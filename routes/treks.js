const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Trek = require('../models/Trek');
const TrekCoord = require('../models/TrekCoord');
const POI = require('../models/POI');

// Funções auxiliares para exportação
function buildGPX(trek, coords) {
  const header = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="TrekSafe_API" xmlns="http://www.topografix.com/GPX/1/1">`;
  const trkHeader = `<trk><name>${escapeXml(trek.title || 'Trilha')}</name><trkseg>`;
  const trkpts = coords
    .map(c => `<trkpt lat="${c.lat}" lon="${c.lng}"><time>${new Date(c.timestamp).toISOString()}</time>${c.alt !== undefined ? `<ele>${c.alt}</ele>` : ''}</trkpt>`)
    .join('');
  const trkFooter = `</trkseg></trk>`;
  const footer = `</gpx>`;
  return [header, trkHeader, trkpts, trkFooter, footer].join('');
}
function escapeXml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function buildTXT(coords) {
  // CSV-like: orderIndex,lat,lng,alt,timestamp
  const header = 'orderIndex,lat,lng,alt,timestamp';
  const lines = coords.map(c => `${c.orderIndex},${c.lat},${c.lng},${c.alt ?? ''},${new Date(c.timestamp).toISOString()}`);
  return [header, ...lines].join('\n');
}

// @desc    Criar uma trilha
// @route   POST /api/treks
// @access  Privado
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, startedAt, endedAt, totalDistance, durationSeconds, isOnline, isPublic, initialLat, initialLng } = req.body;

    // validação básica para initialLat/initialLng
    const latN = Number(initialLat);
    const lngN = Number(initialLng);
    if (Number.isNaN(latN) || Number.isNaN(lngN)) {
      return res.status(400).json({ success: false, message: 'Forneça initialLat e initialLng numéricos.' });
    }
    if (latN < -90 || latN > 90 || lngN < -180 || lngN > 180) {
      return res.status(400).json({ success: false, message: 'initialLat deve estar entre -90 e 90; initialLng entre -180 e 180.' });
    }

    const trek = await Trek.create({
      title,
      description,
      user: req.user._id,
      startedAt,
      endedAt,
      totalDistance,
      durationSeconds,
      isOnline,
      isPublic,
      initialLat: latN,
      initialLng: lngN
    });

    res.status(201).json({ success: true, data: trek });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erro ao criar trilha' });
  }
});

// @desc    Adicionar coordenadas ordenadas a uma trilha
// @route   POST /api/treks/:trekId/coords
// @access  Privado
router.post('/:trekId/coords', protect, async (req, res) => {
  try {
    const { trekId } = req.params;
    const { coords } = req.body; // array de coordenadas

    if (!Array.isArray(coords) || coords.length === 0) {
      return res.status(400).json({ success: false, message: 'Forneça um array de coordenadas' });
    }

    const trek = await Trek.findById(trekId);

    if (!trek) {
      return res.status(404).json({ success: false, message: 'Trilha não encontrada' });
    }

    // Garantir que o usuário é dono da trilha
    if (String(trek.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Sem permissão para adicionar coordenadas nesta trilha' });
    }

    // Obter último índice para continuar a ordenação
    const lastCoord = await TrekCoord.findOne({ trek: trek._id }).sort({ orderIndex: -1 }).lean();
    let startIndex = lastCoord ? lastCoord.orderIndex + 1 : 0;

    // Ordenar por timestamp asc, se existir; caso contrário manter ordem recebida
    const normalized = coords
      .map((c) => ({ ...c }))
      .sort((a, b) => {
        const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return ta - tb;
      })
      .map((c, idx) => ({
        trek: trek._id,
        orderIndex: startIndex + idx,
        lat: c.lat,
        lng: c.lng,
        alt: c.alt,
        accuracy: c.accuracy,
        speed: c.speed,
        heading: c.heading,
        timestamp: c.timestamp ? new Date(c.timestamp) : new Date()
      }));

    const inserted = await TrekCoord.insertMany(normalized, { ordered: true });

    res.status(201).json({ success: true, count: inserted.length, data: inserted });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Índices duplicados detectados para coordenadas' });
    }
    res.status(500).json({ success: false, message: 'Erro ao adicionar coordenadas' });
  }
});

// @desc    Buscar trilhas por bounding box (minLat, maxLat, minLng, maxLng)
// @route   GET /api/treks/search
// @access  Privado
router.get('/search', protect, async (req, res) => {
  try {
    const { minLat, maxLat, minLng, maxLng } = req.query;
    const includePois = String(req.query.includePois || '').toLowerCase() === 'true';

    const toNum = (v) => (v !== undefined ? Number(v) : undefined);
    const minLatN = toNum(minLat);
    const maxLatN = toNum(maxLat);
    const minLngN = toNum(minLng);
    const maxLngN = toNum(maxLng);

    if ([minLatN, maxLatN, minLngN, maxLngN].some((v) => typeof v !== 'number' || Number.isNaN(v))) {
      return res.status(400).json({ success: false, message: 'Parâmetros inválidos. Use minLat, maxLat, minLng, maxLng como números.' });
    }
    if (minLatN > maxLatN || minLngN > maxLngN) {
      return res.status(400).json({ success: false, message: 'Intervalos inválidos: min deve ser menor ou igual a max.' });
    }

    // Treks que possuem ao menos uma coordenada dentro do bounding box
    const trekIdsFromCoords = await TrekCoord.find({
      lat: { $gte: minLatN, $lte: maxLatN },
      lng: { $gte: minLngN, $lte: maxLngN }
    }).distinct('trek');

    // Treks cujo ponto inicial está dentro do bounding box
    const treksFromStart = await Trek.find({
      initialLat: { $gte: minLatN, $lte: maxLatN },
      initialLng: { $gte: minLngN, $lte: maxLngN }
    }).select('_id').lean();

    const trekIdsFromStart = treksFromStart.map((t) => String(t._id));

    // União de IDs
    const idSet = new Set([...(trekIdsFromCoords || []).map(String), ...trekIdsFromStart]);
    const allIds = Array.from(idSet);

    if (allIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Filtrar trilhas do usuário OU trilhas públicas de outros
    const treks = await Trek.find({
      _id: { $in: allIds },
      $or: [{ user: req.user._id }, { isPublic: true }]
    }).sort({ createdAt: -1 }).lean();

    if (includePois) {
      const poiList = await POI.find({ trek: { $in: treks.map((t) => t._id) } }).lean();
      const byTrek = {};
      for (const p of poiList) {
        const key = String(p.trek);
        if (!byTrek[key]) byTrek[key] = [];
        byTrek[key].push(p);
      }
      const data = treks.map((t) => ({ ...t, pois: byTrek[String(t._id)] || [] }));
      return res.status(200).json({ success: true, count: data.length, data });
    }

    res.status(200).json({ success: true, count: treks.length, data: treks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erro ao buscar trilhas por bounding box' });
  }
});

// @desc    Buscar trilha por ID
// @route   GET /api/treks/:trekId
// @access  Privado
router.get('/:trekId', protect, async (req, res) => {
  try {
    const { trekId } = req.params;
    const withCoords = String(req.query.withCoords || '').toLowerCase() === 'true';
    const includePois = String(req.query.includePois || '').toLowerCase() === 'true';

    const trek = await Trek.findById(trekId);
    if (!trek) {
      return res.status(404).json({ success: false, message: 'Trilha não encontrada' });
    }

    // Garantir que o usuário é dono da trilha
    if (String(trek.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Sem permissão para visualizar esta trilha' });
    }

    const response = { trek };
    if (withCoords) {
      const coords = await TrekCoord.find({ trek: trek._id }).sort({ orderIndex: 1 });
      response.coords = coords;
    }
    if (includePois) {
      const pois = await POI.find({ trek: trek._id }).sort({ createdAt: -1 });
      response.pois = pois;
    }

    res.status(200).json({ success: true, data: response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erro ao buscar trilha por ID' });
  }
});

// @desc    Atualizar dados de uma trilha (exceto coordenadas)
// @route   PUT /api/treks/:trekId
// @access  Privado
router.put('/:trekId', protect, async (req, res) => {
  try {
    const { trekId } = req.params;
    const trek = await Trek.findById(trekId);
    if (!trek) {
      return res.status(404).json({ success: false, message: 'Trilha não encontrada' });
    }

    // Garantir que o usuário é dono da trilha
    if (String(trek.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Sem permissão para alterar esta trilha' });
    }

    // Campos permitidos (exceto coordenadas e relacionamentos)
    const {
      title,
      description,
      startedAt,
      endedAt,
      totalDistance,
      durationSeconds,
      isOnline,
      isPublic
      // NOTA: não permitir alterar initialLat/initialLng e user
    } = req.body;

    const update = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (startedAt !== undefined) update.startedAt = startedAt;
    if (endedAt !== undefined) update.endedAt = endedAt;
    if (totalDistance !== undefined) update.totalDistance = totalDistance;
    if (durationSeconds !== undefined) update.durationSeconds = durationSeconds;
    if (isOnline !== undefined) update.isOnline = isOnline;
    if (isPublic !== undefined) update.isPublic = isPublic;

    const updated = await Trek.findByIdAndUpdate(trek._id, { $set: update }, { new: true, runValidators: true });

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erro ao atualizar trilha' });
  }
});

// @desc    Exportar pontos da trilha em GPX/TXT/JSON
// @route   GET /api/treks/:trekId/export?format=gpx|txt|json
// @access  Privado
router.get('/:trekId/export', protect, async (req, res) => {
  try {
    const { trekId } = req.params;
    const format = String(req.query.format || 'json').toLowerCase();

    const trek = await Trek.findById(trekId);
    if (!trek) {
      return res.status(404).json({ success: false, message: 'Trilha não encontrada' });
    }
    if (String(trek.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Sem permissão para exportar esta trilha' });
    }

    const coords = await TrekCoord.find({ trek: trek._id }).sort({ orderIndex: 1 }).lean();

    if (format === 'gpx') {
      const gpx = buildGPX(trek, coords);
      res.setHeader('Content-Type', 'application/gpx+xml');
      res.setHeader('Content-Disposition', `attachment; filename=trek_${trek._id}.gpx`);
      return res.status(200).send(Buffer.from(gpx, 'utf-8'));
    }
    if (format === 'txt') {
      const txt = buildTXT(coords);
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename=trek_${trek._id}.txt`);
      return res.status(200).send(Buffer.from(txt, 'utf-8'));
    }
    // json
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=trek_${trek._id}.json`);
    return res.status(200).send(Buffer.from(JSON.stringify({ trekId: trek._id, points: coords }), 'utf-8'));
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erro ao exportar trilha' });
  }
});

// @desc    Minhas trilhas (criadas pelo usuário logado)
// @route   GET /api/treks/mine
// @access  Privado
router.get('/mine', protect, async (req, res) => {
  try {
    const treks = await Trek.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: treks.length, data: treks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erro ao listar trilhas do usuário' });
  }
});

module.exports = router;
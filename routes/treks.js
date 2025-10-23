const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Trek = require('../models/Trek');
const TrekCoord = require('../models/TrekCoord');

// @desc    Criar uma trilha
// @route   POST /api/treks
// @access  Privado
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, startedAt, endedAt, totalDistance, durationSeconds, isOnline, initialLat, initialLng } = req.body;

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

// @desc    Buscar trilha por ID
// @route   GET /api/treks/:trekId
// @access  Privado
router.get('/:trekId', protect, async (req, res) => {
  try {
    const { trekId } = req.params;
    const withCoords = String(req.query.withCoords || '').toLowerCase() === 'true';

    const trek = await Trek.findById(trekId);
    if (!trek) {
      return res.status(404).json({ success: false, message: 'Trilha não encontrada' });
    }

    // Garantir que o usuário é dono da trilha
    if (String(trek.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Sem permissão para visualizar esta trilha' });
    }

    if (withCoords) {
      const coords = await TrekCoord.find({ trek: trek._id }).sort({ orderIndex: 1 });
      return res.status(200).json({ success: true, data: { trek, coords } });
    }

    res.status(200).json({ success: true, data: trek });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erro ao buscar trilha por ID' });
  }
});

// @desc    Buscar trilhas por bounding box (minLat, maxLat, minLng, maxLng)
// @route   GET /api/treks/search
// @access  Privado
router.get('/search', protect, async (req, res) => {
  try {
    const { minLat, maxLat, minLng, maxLng } = req.query;

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

    // IDs de treks com ao menos uma coordenada dentro do bounding box
    const trekIdsFromCoords = await TrekCoord.find({
      lat: { $gte: minLatN, $lte: maxLatN },
      lng: { $gte: minLngN, $lte: maxLngN }
    }).distinct('trek');

    // IDs de treks cujo ponto inicial está dentro do bounding box (do próprio usuário)
    const treksFromStart = await Trek.find({
      user: req.user._id,
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

    // Filtrar pelas trilhas do usuário
    const treks = await Trek.find({ _id: { $in: allIds }, user: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: treks.length, data: treks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erro ao buscar trilhas por bounding box' });
  }
});

module.exports = router;
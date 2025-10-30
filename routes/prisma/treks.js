const express = require('express');
const Trilha = require('../../models/prisma/Trilha');
const PontoTrilha = require('../../models/prisma/PontoTrilha');
const POI = require('../../models/prisma/POI');
const { protect } = require('../../middleware/auth');

const router = express.Router();

// @desc    Criar trilha
// @route   POST /api/treks
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      titulo,
      descricao,
      startedAt,
      endedAt,
      totalDistance,
      durationSeconds,
      isOnline,
      isPublic,
      initialLat,
      initialLng
    } = req.body;

    // Validação
    if (!titulo || !initialLat || !initialLng) {
      return res.status(400).json({
        success: false,
        error: 'Título, latitude inicial e longitude inicial são obrigatórios'
      });
    }

    const trilhaData = {
      titulo,
      descricao,
      usuarioId: req.user.id,
      iniciadaEm: startedAt ? new Date(startedAt) : null,
      finalizadaEm: endedAt ? new Date(endedAt) : null,
      distanciaTotal: totalDistance || 0,
      duracaoSegundos: durationSeconds || 0,
      online: isOnline !== undefined ? isOnline : true,
      publica: isPublic || false,
      latitudeInicial: parseFloat(initialLat),
      longitudeInicial: parseFloat(initialLng)
    };

    const trilha = await Trilha.create(trilhaData);

    res.status(201).json({
      success: true,
      data: trilha
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @desc    Buscar trilhas
// @route   GET /api/treks/search
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const {
      minLat,
      maxLat,
      minLng,
      maxLng,
      includePois,
      page = 1,
      limit = 10
    } = req.query;

    const filters = {
      usuarioId: req.user.id,
      minLat,
      maxLat,
      minLng,
      maxLng,
      includePois: includePois === 'true',
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await Trilha.search(filters);

    res.status(200).json({
      success: true,
      count: result.trilhas.length,
      pagination: {
        page: result.page,
        pages: result.pages,
        total: result.total
      },
      data: result.trilhas
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @desc    Buscar minhas trilhas
// @route   GET /api/treks/mine
// @access  Private
router.get('/mine', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await Trilha.findByUserId(
      req.user.id,
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      count: result.trilhas.length,
      pagination: {
        page: result.page,
        pages: result.pages,
        total: result.total
      },
      data: result.trilhas
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @desc    Obter trilha por ID
// @route   GET /api/treks/:trekId
// @access  Private
router.get('/:trekId', protect, async (req, res) => {
  try {
    const { trekId } = req.params;
    const { includeCoords, includePois } = req.query;

    const trilha = await Trilha.findById(
      trekId,
      includeCoords === 'true',
      includePois === 'true'
    );

    if (!trilha) {
      return res.status(404).json({
        success: false,
        error: 'Trilha não encontrada'
      });
    }

    // Verificar se usuário pode acessar a trilha
    if (trilha.usuarioId !== req.user.id && !trilha.publica) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    res.status(200).json({
      success: true,
      data: trilha
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @desc    Atualizar trilha
// @route   PUT /api/treks/:trekId
// @access  Private
router.put('/:trekId', protect, async (req, res) => {
  try {
    const { trekId } = req.params;

    // Verificar se usuário é dono da trilha
    const isOwner = await Trilha.isOwner(trekId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    const {
      titulo,
      descricao,
      startedAt,
      endedAt,
      totalDistance,
      durationSeconds,
      isOnline,
      isPublic
    } = req.body;

    const updateData = {};
    if (titulo !== undefined) updateData.titulo = titulo;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (startedAt !== undefined) updateData.iniciadaEm = startedAt ? new Date(startedAt) : null;
    if (endedAt !== undefined) updateData.finalizadaEm = endedAt ? new Date(endedAt) : null;
    if (totalDistance !== undefined) updateData.distanciaTotal = totalDistance;
    if (durationSeconds !== undefined) updateData.duracaoSegundos = durationSeconds;
    if (isOnline !== undefined) updateData.online = isOnline;
    if (isPublic !== undefined) updateData.publica = isPublic;

    const trilha = await Trilha.update(trekId, updateData);

    res.status(200).json({
      success: true,
      data: trilha
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @desc    Deletar trilha
// @route   DELETE /api/treks/:trekId
// @access  Private
router.delete('/:trekId', protect, async (req, res) => {
  try {
    const { trekId } = req.params;

    // Verificar se usuário é dono da trilha
    const isOwner = await Trilha.isOwner(trekId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    await Trilha.delete(trekId);

    res.status(200).json({
      success: true,
      message: 'Trilha deletada com sucesso'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @desc    Adicionar coordenadas à trilha
// @route   POST /api/treks/:trekId/coords
// @access  Private
router.post('/:trekId/coords', protect, async (req, res) => {
  try {
    const { trekId } = req.params;
    const { coords } = req.body;

    // Verificar se usuário é dono da trilha
    const isOwner = await Trilha.isOwner(trekId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    if (!coords || !Array.isArray(coords)) {
      return res.status(400).json({
        success: false,
        error: 'Coordenadas são obrigatórias e devem ser um array'
      });
    }

    // Preparar dados das coordenadas
    const coordsData = coords.map((coord, index) => ({
      trilhaId: trekId,
      indiceOrdem: coord.orderIndex || index,
      latitude: parseFloat(coord.lat),
      longitude: parseFloat(coord.lng),
      altitude: coord.alt ? parseFloat(coord.alt) : null,
      precisao: coord.accuracy ? parseFloat(coord.accuracy) : null,
      velocidade: coord.speed ? parseFloat(coord.speed) : null,
      direcao: coord.heading ? parseFloat(coord.heading) : null,
      timestamp: new Date(coord.timestamp)
    }));

    await PontoTrilha.createMany(coordsData);

    res.status(201).json({
      success: true,
      message: 'Coordenadas adicionadas com sucesso',
      count: coordsData.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @desc    Exportar pontos da trilha
// @route   GET /api/treks/:trekId/export
// @access  Private
router.get('/:trekId/export', protect, async (req, res) => {
  try {
    const { trekId } = req.params;
    const { format = 'json' } = req.query;

    // Verificar se usuário é dono da trilha
    const isOwner = await Trilha.isOwner(trekId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    const trilha = await Trilha.findById(trekId);
    const pontos = await PontoTrilha.findByTrilhaId(trekId);

    if (!trilha) {
      return res.status(404).json({
        success: false,
        error: 'Trilha não encontrada'
      });
    }

    switch (format.toLowerCase()) {
      case 'gpx':
        const gpxContent = generateGPX(trilha, pontos);
        res.set({
          'Content-Type': 'application/gpx+xml',
          'Content-Disposition': `attachment; filename="${trilha.titulo}.gpx"`
        });
        return res.send(gpxContent);

      case 'txt':
        const txtContent = generateTXT(pontos);
        res.set({
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${trilha.titulo}.txt"`
        });
        return res.send(txtContent);

      default:
        res.status(200).json({
          success: true,
          data: {
            trilha,
            pontos
          }
        });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Funções auxiliares para exportação
function generateGPX(trilha, pontos) {
  const trackPoints = pontos.map(ponto => `
    <trkpt lat="${ponto.latitude}" lon="${ponto.longitude}">
      ${ponto.altitude ? `<ele>${ponto.altitude}</ele>` : ''}
      <time>${ponto.timestamp.toISOString()}</time>
    </trkpt>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TrekSafe API">
  <trk>
    <name>${trilha.titulo}</name>
    <desc>${trilha.descricao || ''}</desc>
    <trkseg>
      ${trackPoints}
    </trkseg>
  </trk>
</gpx>`;
}

function generateTXT(pontos) {
  const header = 'Latitude,Longitude,Altitude,Timestamp\n';
  const lines = pontos.map(ponto => 
    `${ponto.latitude},${ponto.longitude},${ponto.altitude || ''},${ponto.timestamp.toISOString()}`
  ).join('\n');
  
  return header + lines;
}

module.exports = router;
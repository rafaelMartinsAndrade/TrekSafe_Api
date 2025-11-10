const express = require('express');
const POI = require('../../models/prisma/POI');
const Trilha = require('../../models/prisma/Trilha');
const { protect } = require('../../middleware/auth');

const router = express.Router();

// @desc    Criar POI
// @route   POST /api/pois
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { trilhaId, nome, descricao, lat, lng, alt, category } = req.body;

    const allowedCategories = [
      'landmark','viewpoint','water','shelter','danger','parking','food','camping',
      'bridge','cave','summit','waterfall','wildlife','photo','rest','other'
    ];

    // Validação
    if (!trilhaId || !nome || !lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'TrilhaId, nome, latitude e longitude são obrigatórios'
      });
    }

    // Validar categoria se fornecida
    if (category !== undefined && !allowedCategories.includes(String(category))) {
      return res.status(400).json({
        success: false,
        error: 'Categoria inválida'
      });
    }

    // Verificar se usuário é dono da trilha
    const isOwner = await Trilha.isOwner(trilhaId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    const poiData = {
      trilhaId,
      nome,
      descricao,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      altitude: alt ? parseFloat(alt) : null,
      // mapear "category" (API) para "categoria" (Prisma)
      categoria: category !== undefined ? String(category) : undefined
    };

    const poi = await POI.create(poiData);

    res.status(201).json({
      success: true,
      data: poi
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @desc    Listar POIs por trilha
// @route   GET /api/pois/by-trek/:trekId
// @access  Private
router.get('/by-trek/:trekId', protect, async (req, res) => {
  try {
    const { trekId } = req.params;

    // Verificar se usuário pode acessar a trilha
    const trilha = await Trilha.findById(trekId);
    if (!trilha) {
      return res.status(404).json({
        success: false,
        error: 'Trilha não encontrada'
      });
    }

    if (trilha.usuarioId !== req.user.id && !trilha.publica) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    const pois = await POI.findByTrilhaId(trekId);

    res.status(200).json({
      success: true,
      count: pois.length,
      data: pois
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @desc    Obter POI por ID
// @route   GET /api/pois/:poiId
// @access  Private
router.get('/:poiId', protect, async (req, res) => {
  try {
    const { poiId } = req.params;

    const poi = await POI.findById(poiId);
    if (!poi) {
      return res.status(404).json({
        success: false,
        error: 'POI não encontrado'
      });
    }

    // Verificar se usuário pode acessar o POI
    const canAccess = await POI.canAccess(poiId, req.user.id);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    res.status(200).json({
      success: true,
      data: poi
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @desc    Atualizar POI
// @route   PUT /api/pois/:poiId
// @access  Private
router.put('/:poiId', protect, async (req, res) => {
  try {
    const { poiId } = req.params;
    const { nome, descricao, lat, lng, alt, category } = req.body;

    const allowedCategories = [
      'landmark','viewpoint','water','shelter','danger','parking','food','camping',
      'bridge','cave','summit','waterfall','wildlife','photo','rest','other'
    ];

    const poi = await POI.findById(poiId);
    if (!poi) {
      return res.status(404).json({
        success: false,
        error: 'POI não encontrado'
      });
    }

    // Verificar se usuário é dono da trilha
    const isOwner = await Trilha.isOwner(poi.trilhaId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    const updateData = {};
    if (nome !== undefined) updateData.nome = nome;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (lat !== undefined) updateData.latitude = parseFloat(lat);
    if (lng !== undefined) updateData.longitude = parseFloat(lng);
    if (alt !== undefined) updateData.altitude = alt ? parseFloat(alt) : null;
    if (category !== undefined) {
      if (!allowedCategories.includes(String(category))) {
        return res.status(400).json({ success: false, error: 'Categoria inválida' });
      }
      updateData.categoria = String(category);
    }

    const poiAtualizado = await POI.update(poiId, updateData);

    res.status(200).json({
      success: true,
      data: poiAtualizado
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @desc    Deletar POI
// @route   DELETE /api/pois/:poiId
// @access  Private
router.delete('/:poiId', protect, async (req, res) => {
  try {
    const { poiId } = req.params;

    const poi = await POI.findById(poiId);
    if (!poi) {
      return res.status(404).json({
        success: false,
        error: 'POI não encontrado'
      });
    }

    // Verificar se usuário é dono da trilha
    const isOwner = await Trilha.isOwner(poi.trilhaId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    await POI.delete(poiId);

    res.status(200).json({
      success: true,
      message: 'POI deletado com sucesso'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @desc    Buscar POIs em área
// @route   GET /api/pois/search
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const { minLat, maxLat, minLng, maxLng } = req.query;

    if (!minLat || !maxLat || !minLng || !maxLng) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros de bounding box são obrigatórios'
      });
    }

    const pois = await POI.findInBounds(minLat, maxLat, minLng, maxLng);

    // Filtrar apenas POIs que o usuário pode acessar
    const poisAcessiveis = pois.filter(poi => 
      poi.trilha.usuarioId === req.user.id || poi.trilha.publica
    );

    res.status(200).json({
      success: true,
      count: poisAcessiveis.length,
      data: poisAcessiveis
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;

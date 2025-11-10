const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Trek = require('../models/Trek');
const POI = require('../models/POI');

// Criar POI para uma trilha existente
// POST /api/pois
router.post('/', protect, async (req, res) => {
  try {
    const { trekId, name, description, lat, lng, alt, category } = req.body;

    const allowedCategories = [
      'landmark','viewpoint','water','shelter','danger','parking','food','camping',
      'bridge','cave','summit','waterfall','wildlife','photo','rest','other'
    ];
    if (!trekId || !name || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Campos obrigatórios: trekId, name, lat, lng' });
    }

    if (category !== undefined && !allowedCategories.includes(String(category))) {
      return res.status(400).json({ success: false, message: 'Categoria inválida' });
    }

    const trek = await Trek.findById(trekId);
    if (!trek) {
      return res.status(404).json({ success: false, message: 'Trilha não encontrada' });
    }
    if (String(trek.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Sem permissão para adicionar POIs nesta trilha' });
    }

    const poi = await POI.create({ trek: trek._id, name, description, lat, lng, alt, category });
    res.status(201).json({ success: true, data: poi });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erro ao criar POI' });
  }
});

// Listar POIs por trilha
// GET /api/pois/by-trek/:trekId
router.get('/by-trek/:trekId', protect, async (req, res) => {
  try {
    const { trekId } = req.params;
    const trek = await Trek.findById(trekId);
    if (!trek) {
      return res.status(404).json({ success: false, message: 'Trilha não encontrada' });
    }
    if (String(trek.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Sem permissão para visualizar POIs desta trilha' });
    }

    const pois = await POI.find({ trek: trek._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: pois.length, data: pois });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erro ao listar POIs' });
  }
});

// Obter POI por id
// GET /api/pois/:poiId
router.get('/:poiId', protect, async (req, res) => {
  try {
    const { poiId } = req.params;
    const poi = await POI.findById(poiId);
    if (!poi) {
      return res.status(404).json({ success: false, message: 'POI não encontrado' });
    }

    const trek = await Trek.findById(poi.trek);
    if (!trek || String(trek.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Sem permissão para acessar este POI' });
    }

    res.status(200).json({ success: true, data: poi });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erro ao obter POI' });
  }
});

// Atualizar POI
// PUT /api/pois/:poiId
router.put('/:poiId', protect, async (req, res) => {
  try {
    const { poiId } = req.params;
    const { name, description, lat, lng, alt, category } = req.body;

    const allowedCategories = [
      'landmark','viewpoint','water','shelter','danger','parking','food','camping',
      'bridge','cave','summit','waterfall','wildlife','photo','rest','other'
    ];

    const poi = await POI.findById(poiId);
    if (!poi) {
      return res.status(404).json({ success: false, message: 'POI não encontrado' });
    }

    const trek = await Trek.findById(poi.trek);
    if (!trek || String(trek.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Sem permissão para atualizar este POI' });
    }

    if (name !== undefined) poi.name = name;
    if (description !== undefined) poi.description = description;
    if (lat !== undefined) poi.lat = lat;
    if (lng !== undefined) poi.lng = lng;
    if (alt !== undefined) poi.alt = alt;
    if (category !== undefined) {
      if (!allowedCategories.includes(String(category))) {
        return res.status(400).json({ success: false, message: 'Categoria inválida' });
      }
      poi.category = String(category);
    }

    await poi.save();
    res.status(200).json({ success: true, data: poi });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erro ao atualizar POI' });
  }
});

// Remover POI
// DELETE /api/pois/:poiId
router.delete('/:poiId', protect, async (req, res) => {
  try {
    const { poiId } = req.params;
    const poi = await POI.findById(poiId);
    if (!poi) {
      return res.status(404).json({ success: false, message: 'POI não encontrado' });
    }
    const trek = await Trek.findById(poi.trek);
    if (!trek || String(trek.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Sem permissão para remover este POI' });
    }

    await poi.deleteOne();
    res.status(200).json({ success: true, message: 'POI removido com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erro ao remover POI' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Trek = require('../models/Trek');
const FavoriteTrek = require('../models/FavoriteTrek');

// Adicionar trilha aos favoritos do usuário
// POST /api/favorites { trekId }
router.post('/', protect, async (req, res) => {
  try {
    const { trekId } = req.body;
    if (!trekId) {
      return res.status(400).json({ success: false, message: 'Informe trekId' });
    }

    const trek = await Trek.findById(trekId);
    if (!trek) {
      return res.status(404).json({ success: false, message: 'Trilha não encontrada' });
    }

    const fav = await FavoriteTrek.create({ user: req.user._id, trek: trek._id });
    res.status(201).json({ success: true, data: fav });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Trilha já está nos favoritos' });
    }
    res.status(500).json({ success: false, message: 'Erro ao adicionar favorito' });
  }
});

// Listar trilhas favoritas do usuário logado
// GET /api/favorites
router.get('/', protect, async (req, res) => {
  try {
    const favorites = await FavoriteTrek.find({ user: req.user._id })
      .populate('trek')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: favorites.length, data: favorites });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erro ao listar favoritos' });
  }
});

// Remover favorito
// DELETE /api/favorites/:favoriteId
router.delete('/:favoriteId', protect, async (req, res) => {
  try {
    const { favoriteId } = req.params;
    const fav = await FavoriteTrek.findById(favoriteId);
    if (!fav) {
      return res.status(404).json({ success: false, message: 'Favorito não encontrado' });
    }
    if (String(fav.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Sem permissão para remover este favorito' });
    }
    await fav.deleteOne();
    res.status(200).json({ success: true, message: 'Favorito removido com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erro ao remover favorito' });
  }
});

module.exports = router;

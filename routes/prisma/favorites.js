const express = require('express');
const TrilhaFavorita = require('../../models/prisma/TrilhaFavorita');
const Trilha = require('../../models/prisma/Trilha');
const { protect } = require('../../middleware/authPrisma');

const router = express.Router();

// @desc    Adicionar trilha aos favoritos
// @route   POST /api/favorites
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { trilhaId } = req.body;

    if (!trilhaId) {
      return res.status(400).json({
        success: false,
        error: 'TrilhaId é obrigatório'
      });
    }

    // Verificar se a trilha existe e é acessível
    const trilha = await Trilha.findById(trilhaId);
    if (!trilha) {
      return res.status(404).json({
        success: false,
        error: 'Trilha não encontrada'
      });
    }

    // Verificar se usuário pode acessar a trilha (própria ou pública)
    if (trilha.usuarioId !== req.user.id && !trilha.publica) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    // Não permitir favoritar próprias trilhas
    if (trilha.usuarioId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível favoritar suas próprias trilhas'
      });
    }

    const favorito = await TrilhaFavorita.create(req.user.id, trilhaId);

    res.status(201).json({
      success: true,
      data: favorito
    });
  } catch (error) {
    if (error.message === 'Trilha já está nos favoritos') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @desc    Listar trilhas favoritas
// @route   GET /api/favorites
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await TrilhaFavorita.findByUserId(
      req.user.id,
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      count: result.favoritos.length,
      pagination: {
        page: result.page,
        pages: result.pages,
        total: result.total
      },
      data: result.favoritos
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @desc    Remover trilha dos favoritos
// @route   DELETE /api/favorites/:favoriteId
// @access  Private
router.delete('/:favoriteId', protect, async (req, res) => {
  try {
    const { favoriteId } = req.params;

    // Verificar se o favorito existe e pertence ao usuário
    const favorito = await TrilhaFavorita.findById(favoriteId);
    if (!favorito) {
      return res.status(404).json({
        success: false,
        error: 'Favorito não encontrado'
      });
    }

    // Verificar se usuário é dono do favorito
    const isOwner = await TrilhaFavorita.isOwner(favoriteId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    await TrilhaFavorita.delete(favoriteId);

    res.status(200).json({
      success: true,
      message: 'Trilha removida dos favoritos'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @desc    Verificar se trilha está nos favoritos
// @route   GET /api/favorites/check/:trilhaId
// @access  Private
router.get('/check/:trilhaId', protect, async (req, res) => {
  try {
    const { trilhaId } = req.params;

    const isFavorite = await TrilhaFavorita.isFavorite(req.user.id, trilhaId);

    res.status(200).json({
      success: true,
      data: {
        isFavorite
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @desc    Obter trilhas mais favoritadas
// @route   GET /api/favorites/popular
// @access  Private
router.get('/popular', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const trilhasPopulares = await TrilhaFavorita.getMostFavorited(parseInt(limit));

    res.status(200).json({
      success: true,
      count: trilhasPopulares.length,
      data: trilhasPopulares
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @desc    Remover trilha dos favoritos por trilhaId
// @route   DELETE /api/favorites/by-trek/:trilhaId
// @access  Private
router.delete('/by-trek/:trilhaId', protect, async (req, res) => {
  try {
    const { trilhaId } = req.params;

    const result = await TrilhaFavorita.deleteByUserAndTrek(req.user.id, trilhaId);

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        error: 'Trilha não está nos favoritos'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Trilha removida dos favoritos'
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

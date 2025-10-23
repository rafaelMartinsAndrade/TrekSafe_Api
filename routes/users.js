const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @desc    Cadastrar usuário (público)
// @route   POST /api/users/register
// @access  Público
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'Usuário já existe' });
    }

    user = await User.create({ name, email, password });
    const token = user.getSignedJwtToken();

    res.status(201).json({ success: true, token });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
});

// @desc    Obter usuário atual
// @route   GET /api/users/me
// @access  Privado
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
});

// @desc    Atualizar dados do usuário (name, email)
// @route   PUT /api/users/me
// @access  Privado
router.put('/me', protect, async (req, res) => {
  try {
    const { name, email } = req.body;

    const update = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) {
      // Checar unicidade se o email for alterado
      const existing = await User.findOne({ email });
      if (existing && String(existing._id) !== String(req.user.id)) {
        return res.status(400).json({ success: false, message: 'Email já está em uso por outro usuário' });
      }
      update.email = email;
    }

    const user = await User.findByIdAndUpdate(req.user.id, { $set: update }, { new: true, runValidators: true });

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
});

module.exports = router;
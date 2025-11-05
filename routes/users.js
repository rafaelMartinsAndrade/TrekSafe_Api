// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @desc    Cadastrar usuário (público)
// @route   POST /api/users/register
// @access  Público
router.post('/register', async (req, res) => {
  try {
    console.log('📥 Dados recebidos no registro:', req.body);
    
    const { name, email, password } = req.body;

    // Validações básicas
    if (!name || !email || !password) {
      console.log('❌ Campos obrigatórios faltando');
      return res.status(400).json({ 
        success: false, 
        message: 'Nome, email e senha são obrigatórios' 
      });
    }

    if (name.trim().length < 2) {
      console.log('❌ Nome muito curto:', name);
      return res.status(400).json({ 
        success: false, 
        message: 'Nome deve ter pelo menos 2 caracteres' 
      });
    }

    // VALIDAÇÃO DE EMAIL ADICIONADA
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Email inválido:', email);
      return res.status(400).json({ 
        success: false, 
        message: 'Email inválido' 
      });
    }

    if (password.length < 6) {
      console.log('❌ Senha muito curta');
      return res.status(400).json({ 
        success: false, 
        message: 'Senha deve ter pelo menos 6 caracteres' 
      });
    }

    console.log('✅ Todas as validações passaram');

    // Verificar se usuário já existe
    console.log('🔍 Verificando se email já existe:', email.toLowerCase());
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      console.log('❌ Email já existe no banco');
      return res.status(400).json({ 
        success: false, 
        message: 'Email já está em uso' 
      });
    }

    console.log('✅ Email disponível, criando usuário...');

    // Criar usuário
    user = await User.create({ 
      name: name.trim(), 
      email: email.toLowerCase().trim(), 
      password 
    });

    console.log('✅ Usuário criado:', user._id);

    // Gerar tokens
    const token = user.getSignedJwtToken();
    const refreshToken = user.getRefreshToken ? user.getRefreshToken() : token;

    // Remover senha da resposta
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    };

    console.log('✅ Enviando resposta de sucesso');

    res.status(201).json({ 
      success: true, 
      data: {
        user: userResponse,
        token,
        refreshToken
      },
      message: 'Usuário criado com sucesso'
    });
  } catch (err) {
    console.error('💥 Erro no registro:', err);
    
    // Tratar erros específicos do MongoDB
    if (err.code === 11000) {
      console.log('❌ Erro de duplicação (11000)');
      return res.status(400).json({ 
        success: false, 
        message: 'Email já está em uso' 
      });
    }
    
    if (err.name === 'ValidationError') {
      console.log('❌ Erro de validação do Mongoose:', err.errors);
      const messages = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join(', ') 
      });
    }

    console.log('❌ Erro interno do servidor');
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// @desc    Obter usuário atual
// @route   GET /api/users/me
// @access  Privado
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      message: 'Dados do usuário carregados'
    });
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// @desc    Atualizar dados do usuário (name, email)
// @route   PUT /api/users/me
// @access  Privado
router.put('/me', protect, async (req, res) => {
  try {
    const { name, email } = req.body;

    // Validações
    const update = {};
    
    if (name !== undefined) {
      if (name.trim().length < 2) {
        return res.status(400).json({ 
          success: false, 
          message: 'Nome deve ter pelo menos 2 caracteres' 
        });
      }
      update.name = name.trim();
    }
    
    if (email !== undefined) {
      // USAR A MESMA REGEX DO REGISTRO
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email inválido' 
        });
      }
      
      // Checar unicidade se o email for alterado
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing && String(existing._id) !== String(req.user.id)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email já está em uso por outro usuário' 
        });
      }
      update.email = email.toLowerCase().trim();
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nenhum dado fornecido para atualização' 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id, 
      { $set: update }, 
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.status(200).json({ 
      success: true, 
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        updatedAt: user.updatedAt
      },
      message: 'Dados atualizados com sucesso'
    });
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
    
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email já está em uso' 
      });
    }
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join(', ') 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// @desc    Alterar senha
// @route   PUT /api/users/password
// @access  Privado
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Nova senha deve ter pelo menos 6 caracteres'
      });
    }

    // Buscar usuário com senha
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar senha atual
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual incorreta'
      });
    }

    // Atualizar senha
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
  } catch (err) {
    console.error('Erro ao alterar senha:', err);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// @desc    Excluir conta
// @route   DELETE /api/users/me
// @access  Privado
router.delete('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Conta excluída com sucesso'
    });
  } catch (err) {
    console.error('Erro ao excluir conta:', err);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
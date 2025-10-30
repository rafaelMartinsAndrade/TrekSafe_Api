const express = require('express');
const Usuario = require('../../models/prisma/Usuario');
const { protect } = require('../../middleware/auth');

const router = express.Router();

// @desc    Registrar usuário
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    // Verificar se usuário já existe
    const usuarioExistente = await Usuario.findByEmail(email);
    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        error: 'Usuário já existe'
      });
    }

    // Criar usuário
    const usuario = await Usuario.create({
      nome,
      email,
      senha
    });

    // Gerar token
    const token = Usuario.getSignedJwtToken(usuario.id);

    res.status(201).json({
      success: true,
      token,
      data: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
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

// @desc    Login usuário
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Validar email e senha
    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        error: 'Por favor, forneça email e senha'
      });
    }

    // Buscar usuário
    const usuario = await Usuario.findByEmail(email);
    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
    }

    // Verificar senha
    const isMatch = await Usuario.matchPassword(senha, usuario.senha);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
    }

    // Gerar token
    const token = Usuario.getSignedJwtToken(usuario.id);

    res.status(200).json({
      success: true,
      token,
      data: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
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

// @desc    Obter usuário atual
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        criadoEm: usuario.criadoEm
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

// @desc    Esqueci a senha
// @route   POST /api/auth/forgotpassword
// @access  Public
router.post('/forgotpassword', async (req, res) => {
  try {
    const { email } = req.body;

    const usuario = await Usuario.findByEmail(email);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Gerar token de reset
    const { resetToken, resetPasswordToken, resetPasswordExpire } = Usuario.getResetPasswordToken();

    // Salvar token no banco
    await Usuario.update(usuario.id, {
      resetPasswordToken,
      resetPasswordExpire
    });

    // Aqui você enviaria o email com o token
    // Por enquanto, retornamos o token na resposta (apenas para desenvolvimento)
    res.status(200).json({
      success: true,
      message: 'Token de reset enviado',
      resetToken // Remover em produção
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// @desc    Reset senha
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
router.put('/resetpassword/:resettoken', async (req, res) => {
  try {
    const { senha } = req.body;
    const resetToken = req.params.resettoken;

    // Hash do token
    const crypto = require('crypto');
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const usuario = await Usuario.findByResetToken(resetPasswordToken);
    if (!usuario) {
      return res.status(400).json({
        success: false,
        error: 'Token inválido'
      });
    }

    // Atualizar senha
    await Usuario.update(usuario.id, {
      senha,
      resetPasswordToken: null,
      resetPasswordExpire: null
    });

    // Gerar novo token
    const token = Usuario.getSignedJwtToken(usuario.id);

    res.status(200).json({
      success: true,
      token,
      message: 'Senha alterada com sucesso'
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
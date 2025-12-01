const express = require('express');
const Usuario = require('../../models/prisma/Usuario');
const { protect } = require('../../middleware/authPrisma');

const router = express.Router();

// @desc    Registrar usu?rio
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : req.body.email;
    const nomeRaw = req.body.nome || req.body.name || req.body.username;
    const senhaRaw = req.body.senha || req.body.password || req.body.pass || req.body.pwd;
    const nome = typeof nomeRaw === 'string' ? nomeRaw.trim() : nomeRaw;
    const senha = typeof senhaRaw === 'string' ? senhaRaw.trim() : senhaRaw;

    // Verificar se usu?rio j? existe
    const usuarioExistente = await Usuario.findByEmail(email);
    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        error: 'Usu?rio j? existe'
      });
    }

    if (!nome || !email || !senha) {
      return res.status(400).json({
        success: false,
        error: 'Por favor, forneca nome, email e senha'
      });
    }
    const usuario = await Usuario.create({ nome, email, senha });

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

// @desc    Login usu?rio
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : req.body.email;
    const senhaRaw = req.body.senha || req.body.password || req.body.pass || req.body.pwd;
    const senha = typeof senhaRaw === 'string' ? senhaRaw.trim() : senhaRaw;

    // Validar email e senha
    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        error: 'Por favor, forne?a email e senha'
      });
    }

    // Buscar usu?rio
    const usuario = await Usuario.findByEmail(email);
    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inv?lidas'
      });
    }

    // Verificar senha
    const isMatch = await Usuario.matchPassword(senha, usuario.senha);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inv?lidas'
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

// @desc    Obter usu?rio atual
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
        error: 'Usu?rio n?o encontrado'
      });
    }

    // Gerar token de reset
    const { resetToken, resetPasswordToken, resetPasswordExpire } = Usuario.getResetPasswordToken();

    // Salvar token no banco
    await Usuario.update(usuario.id, {
      resetPasswordToken,
      resetPasswordExpire
    });

    // Aqui voc? enviaria o email com o token
    // Por enquanto, retornamos o token na resposta (apenas para desenvolvimento)
    res.status(200).json({
      success: true,
      message: 'Token de reset enviado',
      resetToken // Remover em produ??o
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
        error: 'Token inv?lido'
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

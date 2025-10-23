const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @desc    Registrar usuário
// @route   POST /api/auth/register
// @access  Público
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Verificar se o usuário já existe
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ success: false, message: 'Usuário já existe' });
    }

    // Criar usuário
    user = await User.create({
      name,
      email,
      password
    });

    // Criar token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
});

// @desc    Login de usuário
// @route   POST /api/auth/login
// @access  Público
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar email e senha
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Por favor, forneça email e senha' });
    }

    // Verificar usuário
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }

    // Verificar se a senha corresponde
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }

    // Criar token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
});

// @desc    Logout de usuário / limpar cookie
// @route   GET /api/auth/logout
// @access  Privado
router.get('/logout', async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logout realizado com sucesso',
      data: {}
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
});

// @desc    Solicitar recuperação de senha
// @route   POST /api/auth/forgot-password
// @access  Público
router.post('/forgot-password', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Não existe usuário com esse email' 
      });
    }

    // Gerar token de recuperação
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Em um ambiente real, enviaríamos um email com o link de recuperação
    // Aqui apenas retornamos o token para fins de demonstração
    
    res.status(200).json({
      success: true,
      message: 'Email de recuperação enviado',
      resetToken // Em produção, não retornar o token diretamente
    });
  } catch (err) {
    console.error(err.message);
    
    // Se ocorrer um erro, limpar os campos de recuperação
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save({ validateBeforeSave: false });
    
    res.status(500).json({ success: false, message: 'Erro ao enviar email de recuperação' });
  }
});

// @desc    Redefinir senha
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Público
router.put('/reset-password/:resettoken', async (req, res) => {
  try {
    // Obter token hashed
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token inválido ou expirado' 
      });
    }

    // Definir nova senha
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    // Retornar novo token JWT
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: 'Senha alterada com sucesso',
      token
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Erro ao redefinir senha' });
  }
});

module.exports = router;
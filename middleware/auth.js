const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Proteger rotas
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Obter token do header
    token = req.headers.authorization.split(' ')[1];
  }

  // Verificar se o token existe
  if (!token) {
    console.log(req.headers)
    return res.status(401).json({ 
      success: false, 
      message: 'Token não encontrado nos Headers' 
    });
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    console.log(err)
    return res.status(401).json({ 
      success: false, 
      message: 'Erro ao validar token' 
    });
  }
};
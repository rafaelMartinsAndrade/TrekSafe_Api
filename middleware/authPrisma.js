const jwt = require('jsonwebtoken');
const Usuario = require('../models/prisma/Usuario');

// Proteger rotas
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Extrair token do header
    token = req.headers.authorization.split(' ')[1];
  }

  // Verificar se token existe
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Não autorizado para acessar esta rota'
    });
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuário
    const usuario = await Usuario.findById(decoded.id);
    
    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: 'Não autorizado para acessar esta rota'
      });
    }

    req.user = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email
    };

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({
      success: false,
      error: 'Não autorizado para acessar esta rota'
    });
  }
};

// Autorizar papéis específicos
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Papel de usuário ${req.user.role} não autorizado para acessar esta rota`
      });
    }
    next();
  };
};
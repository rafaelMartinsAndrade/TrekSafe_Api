const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class Usuario {
  // Criar usuário
  static async create(data) {
    const { nome, email, senha } = data;
    
    // Criptografar senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);
    
    return await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaHash
      }
    });
  }

  // Buscar usuário por email
  static async findByEmail(email) {
    return await prisma.usuario.findUnique({
      where: { email }
    });
  }

  // Buscar usuário por ID
  static async findById(id) {
    return await prisma.usuario.findUnique({
      where: { id }
    });
  }

  // Atualizar usuário
  static async update(id, data) {
    if (data.senha) {
      const salt = await bcrypt.genSalt(10);
      data.senha = await bcrypt.hash(data.senha, salt);
    }
    
    return await prisma.usuario.update({
      where: { id },
      data
    });
  }

  // Deletar usuário
  static async delete(id) {
    return await prisma.usuario.delete({
      where: { id }
    });
  }

  // Verificar senha
  static async matchPassword(senhaPlain, senhaHash) {
    return await bcrypt.compare(senhaPlain, senhaHash);
  }

  // Gerar JWT
  static getSignedJwtToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });
  }

  // Gerar token de reset de senha
  static getResetPasswordToken() {
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    const resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
    
    return { resetToken, resetPasswordToken, resetPasswordExpire };
  }

  // Buscar usuário por token de reset
  static async findByResetToken(resetPasswordToken) {
    return await prisma.usuario.findFirst({
      where: {
        resetPasswordToken,
        resetPasswordExpire: {
          gt: new Date()
        }
      }
    });
  }
}

module.exports = Usuario;
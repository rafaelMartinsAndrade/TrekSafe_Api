const prisma = require('../../config/prisma');

class PontoTrilha {
  // Criar ponto de trilha
  static async create(data) {
    return await prisma.pontoTrilha.create({
      data
    });
  }

  // Criar múltiplos pontos
  static async createMany(data) {
    return await prisma.pontoTrilha.createMany({
      data,
      skipDuplicates: true
    });
  }

  // Buscar pontos por trilha
  static async findByTrilhaId(trilhaId) {
    return await prisma.pontoTrilha.findMany({
      where: { trilhaId },
      orderBy: {
        indiceOrdem: 'asc'
      }
    });
  }

  // Buscar ponto por ID
  static async findById(id) {
    return await prisma.pontoTrilha.findUnique({
      where: { id },
      include: {
        trilha: {
          select: {
            id: true,
            titulo: true,
            usuarioId: true
          }
        }
      }
    });
  }

  // Atualizar ponto
  static async update(id, data) {
    return await prisma.pontoTrilha.update({
      where: { id },
      data
    });
  }

  // Deletar ponto
  static async delete(id) {
    return await prisma.pontoTrilha.delete({
      where: { id }
    });
  }

  // Deletar todos os pontos de uma trilha
  static async deleteByTrilhaId(trilhaId) {
    return await prisma.pontoTrilha.deleteMany({
      where: { trilhaId }
    });
  }

  // Buscar pontos em uma área (bounding box)
  static async findInBounds(minLat, maxLat, minLng, maxLng) {
    return await prisma.pontoTrilha.findMany({
      where: {
        latitude: {
          gte: parseFloat(minLat),
          lte: parseFloat(maxLat)
        },
        longitude: {
          gte: parseFloat(minLng),
          lte: parseFloat(maxLng)
        }
      },
      include: {
        trilha: {
          select: {
            id: true,
            titulo: true,
            publica: true,
            usuarioId: true
          }
        }
      }
    });
  }

  // Contar pontos de uma trilha
  static async countByTrilhaId(trilhaId) {
    return await prisma.pontoTrilha.count({
      where: { trilhaId }
    });
  }

  // Obter estatísticas de uma trilha
  static async getStatsByTrilhaId(trilhaId) {
    const pontos = await prisma.pontoTrilha.findMany({
      where: { trilhaId },
      orderBy: { indiceOrdem: 'asc' },
      select: {
        latitude: true,
        longitude: true,
        altitude: true,
        velocidade: true,
        timestamp: true
      }
    });

    if (pontos.length === 0) {
      return null;
    }

    const altitudes = pontos.filter(p => p.altitude !== null).map(p => p.altitude);
    const velocidades = pontos.filter(p => p.velocidade !== null).map(p => p.velocidade);
    
    const stats = {
      totalPontos: pontos.length,
      altitudeMin: altitudes.length > 0 ? Math.min(...altitudes) : null,
      altitudeMax: altitudes.length > 0 ? Math.max(...altitudes) : null,
      altitudeMedia: altitudes.length > 0 ? altitudes.reduce((a, b) => a + b, 0) / altitudes.length : null,
      velocidadeMax: velocidades.length > 0 ? Math.max(...velocidades) : null,
      velocidadeMedia: velocidades.length > 0 ? velocidades.reduce((a, b) => a + b, 0) / velocidades.length : null,
      duracaoTotal: pontos.length > 1 ? 
        new Date(pontos[pontos.length - 1].timestamp) - new Date(pontos[0].timestamp) : 0
    };

    return stats;
  }
}

module.exports = PontoTrilha;
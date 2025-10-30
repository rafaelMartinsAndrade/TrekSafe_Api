const prisma = require('../../config/prisma');

class POI {
  // Criar POI
  static async create(data) {
    return await prisma.pOI.create({
      data,
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

  // Buscar POI por ID
  static async findById(id) {
    return await prisma.pOI.findUnique({
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

  // Buscar POIs por trilha
  static async findByTrilhaId(trilhaId) {
    return await prisma.pOI.findMany({
      where: { trilhaId },
      orderBy: {
        criadoEm: 'desc'
      }
    });
  }

  // Atualizar POI
  static async update(id, data) {
    return await prisma.pOI.update({
      where: { id },
      data,
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

  // Deletar POI
  static async delete(id) {
    return await prisma.pOI.delete({
      where: { id }
    });
  }

  // Deletar todos os POIs de uma trilha
  static async deleteByTrilhaId(trilhaId) {
    return await prisma.pOI.deleteMany({
      where: { trilhaId }
    });
  }

  // Buscar POIs em uma área (bounding box)
  static async findInBounds(minLat, maxLat, minLng, maxLng) {
    return await prisma.pOI.findMany({
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

  // Contar POIs de uma trilha
  static async countByTrilhaId(trilhaId) {
    return await prisma.pOI.count({
      where: { trilhaId }
    });
  }

  // Verificar se usuário pode acessar POI (através da trilha)
  static async canAccess(poiId, usuarioId) {
    const poi = await prisma.pOI.findUnique({
      where: { id: poiId },
      include: {
        trilha: {
          select: {
            usuarioId: true,
            publica: true
          }
        }
      }
    });

    if (!poi) return false;
    
    // Usuário é dono da trilha ou trilha é pública
    return poi.trilha.usuarioId === usuarioId || poi.trilha.publica;
  }
}

module.exports = POI;
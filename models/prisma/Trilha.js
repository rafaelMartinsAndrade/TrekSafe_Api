const prisma = require('../../config/prisma');

class Trilha {
  // Criar trilha
  static async create(data) {
    return await prisma.trilha.create({
      data,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });
  }

  // Buscar trilha por ID
  static async findById(id, includeCoords = false, includePois = false) {
    const include = {
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true
        }
      }
    };

    if (includeCoords) {
      include.coordenadas = {
        orderBy: {
          indiceOrdem: 'asc'
        }
      };
    }

    if (includePois) {
      include.pois = true;
    }

    return await prisma.trilha.findUnique({
      where: { id },
      include
    });
  }

  // Buscar trilhas do usuário
  static async findByUserId(usuarioId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [trilhas, total] = await Promise.all([
      prisma.trilha.findMany({
        where: { usuarioId },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          }
        },
        orderBy: {
          criadaEm: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.trilha.count({
        where: { usuarioId }
      })
    ]);

    return {
      trilhas,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  // Buscar trilhas públicas e do usuário
  static async search(filters = {}) {
    const {
      usuarioId,
      minLat,
      maxLat,
      minLng,
      maxLng,
      includePois = false,
      page = 1,
      limit = 10
    } = filters;

    const skip = (page - 1) * limit;
    
    const where = {
      OR: [
        { usuarioId }, // Trilhas do próprio usuário
        { publica: true } // Trilhas públicas de outros usuários
      ]
    };

    // Filtro por bounding box
    if (minLat && maxLat && minLng && maxLng) {
      where.AND = [
        { latitudeInicial: { gte: parseFloat(minLat) } },
        { latitudeInicial: { lte: parseFloat(maxLat) } },
        { longitudeInicial: { gte: parseFloat(minLng) } },
        { longitudeInicial: { lte: parseFloat(maxLng) } }
      ];
    }

    const include = {
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true
        }
      }
    };

    if (includePois) {
      include.pois = true;
    }

    const [trilhas, total] = await Promise.all([
      prisma.trilha.findMany({
        where,
        include,
        orderBy: {
          criadaEm: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.trilha.count({ where })
    ]);

    return {
      trilhas,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  // Atualizar trilha
  static async update(id, data) {
    return await prisma.trilha.update({
      where: { id },
      data,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });
  }

  // Deletar trilha
  static async delete(id) {
    return await prisma.trilha.delete({
      where: { id }
    });
  }

  // Verificar se usuário é dono da trilha
  static async isOwner(trilhaId, usuarioId) {
    const trilha = await prisma.trilha.findUnique({
      where: { id: trilhaId },
      select: { usuarioId: true }
    });
    
    return trilha && trilha.usuarioId === usuarioId;
  }
}

module.exports = Trilha;
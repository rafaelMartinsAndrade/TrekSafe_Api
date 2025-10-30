const prisma = require('../../config/prisma');

class TrilhaFavorita {
  // Adicionar trilha aos favoritos
  static async create(usuarioId, trilhaId) {
    try {
      return await prisma.trilhaFavorita.create({
        data: {
          usuarioId,
          trilhaId
        },
        include: {
          trilha: {
            select: {
              id: true,
              titulo: true,
              descricao: true,
              latitudeInicial: true,
              longitudeInicial: true,
              distanciaTotal: true,
              duracaoSegundos: true,
              criadaEm: true,
              usuario: {
                select: {
                  id: true,
                  nome: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('Trilha já está nos favoritos');
      }
      throw error;
    }
  }

  // Buscar favorito por ID
  static async findById(id) {
    return await prisma.trilhaFavorita.findUnique({
      where: { id },
      include: {
        trilha: {
          select: {
            id: true,
            titulo: true,
            descricao: true,
            latitudeInicial: true,
            longitudeInicial: true,
            distanciaTotal: true,
            duracaoSegundos: true,
            criadaEm: true,
            usuario: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        }
      }
    });
  }

  // Buscar favoritos do usuário
  static async findByUserId(usuarioId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [favoritos, total] = await Promise.all([
      prisma.trilhaFavorita.findMany({
        where: { usuarioId },
        include: {
          trilha: {
            select: {
              id: true,
              titulo: true,
              descricao: true,
              latitudeInicial: true,
              longitudeInicial: true,
              distanciaTotal: true,
              duracaoSegundos: true,
              criadaEm: true,
              usuario: {
                select: {
                  id: true,
                  nome: true
                }
              }
            }
          }
        },
        orderBy: {
          criadaEm: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.trilhaFavorita.count({
        where: { usuarioId }
      })
    ]);

    return {
      favoritos,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  // Remover dos favoritos
  static async delete(id) {
    return await prisma.trilhaFavorita.delete({
      where: { id }
    });
  }

  // Remover dos favoritos por usuário e trilha
  static async deleteByUserAndTrek(usuarioId, trilhaId) {
    return await prisma.trilhaFavorita.deleteMany({
      where: {
        usuarioId,
        trilhaId
      }
    });
  }

  // Verificar se trilha está nos favoritos
  static async isFavorite(usuarioId, trilhaId) {
    const favorito = await prisma.trilhaFavorita.findFirst({
      where: {
        usuarioId,
        trilhaId
      }
    });
    
    return !!favorito;
  }

  // Verificar se usuário é dono do favorito
  static async isOwner(favoritoId, usuarioId) {
    const favorito = await prisma.trilhaFavorita.findUnique({
      where: { id: favoritoId },
      select: { usuarioId: true }
    });
    
    return favorito && favorito.usuarioId === usuarioId;
  }

  // Contar favoritos do usuário
  static async countByUserId(usuarioId) {
    return await prisma.trilhaFavorita.count({
      where: { usuarioId }
    });
  }

  // Buscar trilhas mais favoritadas
  static async getMostFavorited(limit = 10) {
    const result = await prisma.trilhaFavorita.groupBy({
      by: ['trilhaId'],
      _count: {
        trilhaId: true
      },
      orderBy: {
        _count: {
          trilhaId: 'desc'
        }
      },
      take: limit
    });

    // Buscar detalhes das trilhas
    const trilhaIds = result.map(item => item.trilhaId);
    const trilhas = await prisma.trilha.findMany({
      where: {
        id: { in: trilhaIds },
        publica: true
      },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        latitudeInicial: true,
        longitudeInicial: true,
        distanciaTotal: true,
        duracaoSegundos: true,
        criadaEm: true,
        usuario: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    });

    // Combinar com contagem de favoritos
    return trilhas.map(trilha => {
      const countData = result.find(item => item.trilhaId === trilha.id);
      return {
        ...trilha,
        favoritosCount: countData ? countData._count.trilhaId : 0
      };
    });
  }
}

module.exports = TrilhaFavorita;
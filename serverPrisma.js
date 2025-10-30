const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const prisma = require('./config/prisma');

// Carregar variáveis de ambiente
dotenv.config();

// Importar rotas Prisma
const authRoutes = require('./routes/prisma/auth');
const trekRoutes = require('./routes/prisma/treks');
const poiRoutes = require('./routes/prisma/pois');
const favoriteRoutes = require('./routes/prisma/favorites');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/treks', trekRoutes);
app.use('/api/pois', poiRoutes);
app.use('/api/favorites', favoriteRoutes);

// Rota de teste
app.get('/api/health', async (req, res) => {
  try {
    // Testar conexão com banco
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      success: true,
      message: 'API funcionando corretamente',
      database: 'PostgreSQL conectado',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro na verificação de saúde:', error);
    res.status(500).json({
      success: false,
      message: 'Erro na API',
      error: error.message
    });
  }
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Erro interno do servidor'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada'
  });
});

const PORT = process.env.PORT || 5000;

// Função para iniciar o servidor
const startServer = async () => {
  try {
    // Testar conexão com Prisma
    await prisma.$connect();
    console.log('? Conectado ao PostgreSQL via Prisma');

    const server = app.listen(PORT, () => {
      console.log(`?? Servidor rodando na porta ${PORT}`);
      console.log(`?? Health check: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM recebido. Fechando servidor...');
      await prisma.$disconnect();
      server.close(() => {
        console.log('Servidor fechado.');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT recebido. Fechando servidor...');
      await prisma.$disconnect();
      server.close(() => {
        console.log('Servidor fechado.');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('? Erro ao conectar com o banco de dados:', error);
    process.exit(1);
  }
};

// Iniciar servidor
startServer();

module.exports = app;
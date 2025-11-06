const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

console.log('🔍 Iniciando servidor...');

// Carregar variáveis de ambiente
dotenv.config();

console.log('🔍 DEBUG - Variáveis de ambiente:');
console.log('- PORT do .env:', process.env.PORT);
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- MONGODB_URI presente:', !!process.env.MONGODB_URI);
console.log('- JWT_SECRET presente:', !!process.env.JWT_SECRET);

// Conectar ao banco de dados
console.log('🔍 Conectando ao banco...');
connectDB();

const app = express();

console.log('🔍 Configurando middlewares...');

// Middleware de log para TODAS as requisições
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('📋 Headers:', req.headers);
  console.log('📦 Body:', req.body);
  next();
});

// Middleware
app.use(express.json());

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false 
}));

console.log('🔍 Configurando rotas...');

// Rota de teste simples
app.get('/test', (req, res) => {
  console.log('🧪 Rota /test acessada!');
  res.json({ 
    message: 'Teste funcionando!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
});

// Rota padrão
app.get('/', (req, res) => {
  console.log('🏠 Rota raiz (/) acessada!');
  res.json({ 
    message: 'Bem-vindo à API TrekSafe',
    status: 'online',
    database: 'MongoDB conectado',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  console.log('🏥 Rota /api/health acessada!');
  res.json({ 
    success: true, 
    message: 'API TrekSafe funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rotas da API
console.log('🔍 Carregando rotas da API...');
try {
  app.use('/api/auth', require('./routes/auth'));
  console.log('✅ Rotas /api/auth carregadas');
} catch (error) {
  console.error('❌ Erro ao carregar rotas auth:', error.message);
}

try {
  app.use('/api/users', require('./routes/users'));
  console.log('✅ Rotas /api/users carregadas');
} catch (error) {
  console.error('❌ Erro ao carregar rotas users:', error.message);
}

try {
  app.use('/api/treks', require('./routes/treks'));
  console.log('✅ Rotas /api/treks carregadas');
} catch (error) {
  console.error('❌ Erro ao carregar rotas treks:', error.message);
}

try {
  app.use('/api/pois', require('./routes/pois'));
  console.log('✅ Rotas /api/pois carregadas');
} catch (error) {
  console.error('❌ Erro ao carregar rotas pois:', error.message);
}

try {
  app.use('/api/favorites', require('./routes/favorites'));
  console.log('✅ Rotas /api/favorites carregadas');
} catch (error) {
  console.error('❌ Erro ao carregar rotas favorites:', error.message);
}

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  console.log(`❌ Rota não encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Rota ${req.method} ${req.originalUrl} não encontrada`,
    availableRoutes: [
      'GET /',
      'GET /test',
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/users/register'
    ]
  });
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('💥 Erro no servidor:', error);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: error.message
  });
});

const PORT = process.env.PORT || 3001;

console.log('🔍 DEBUG - Porta final:', PORT);

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 SERVIDOR TREKSAFE INICIADO COM SUCESSO!');
  console.log('='.repeat(60));
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🌐 Rede: http://192.168.18.13:${PORT}`);
  console.log(`📱 Teste no telefone: http://192.168.18.13:${PORT}`);
  console.log(`💾 MongoDB Atlas conectado`);
  console.log('\n🧪 ROTAS DE TESTE:');
  console.log(`- http://localhost:${PORT}/`);
  console.log(`- http://localhost:${PORT}/test`);
  console.log(`- http://localhost:${PORT}/api/health`);
  console.log('='.repeat(60));
});
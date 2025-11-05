const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Carregar variáveis de ambiente
dotenv.config();

// Conectar ao banco de dados
connectDB();

const app = express();

// Middleware
app.use(express.json());


app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false 
}));

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/treks', require('./routes/treks'));
app.use('/api/pois', require('./routes/pois'));
app.use('/api/favorites', require('./routes/favorites'));

// Rota padrão
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bem-vindo à API TrekSafe',
    status: 'online',
    database: 'MongoDB conectado',
    version: '1.0.0'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API TrekSafe funcionando!',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor TrekSafe rodando na porta ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🌐 Rede: http://192.168.18.13:${PORT}`);
  console.log(`📱 Teste no telefone: http://192.168.18.13:${PORT}`);
  console.log(`💾 MongoDB Atlas conectado`);
});
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API TrekSafe está funcionando!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rota padrão
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bem-vindo à API TrekSafe',
    status: 'online',
    endpoints: [
      'GET / - Esta mensagem',
      'GET /api/health - Health check',
      'POST /api/auth/register - Registrar usuário',
      'POST /api/auth/login - Login usuário',
      'GET /api/users/me - Dados do usuário atual'
    ]
  });
});

// Rotas de teste sem banco de dados
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Nome, email e senha são obrigatórios'
    });
  }
  
  res.json({
    success: true,
    message: 'Usuário registrado com sucesso (modo teste)',
    user: { name, email },
    token: 'test_token_123'
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email e senha são obrigatórios'
    });
  }
  
  res.json({
    success: true,
    message: 'Login realizado com sucesso (modo teste)',
    token: 'test_token_123'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`?? Servidor TrekSafe rodando na porta ${PORT}`);
  console.log(`?? Acesse: http://localhost:${PORT}`);
  console.log(`??  Health check: http://localhost:${PORT}/api/health`);
});
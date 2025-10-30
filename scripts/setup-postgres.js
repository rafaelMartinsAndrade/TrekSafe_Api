const fs = require('fs');
const path = require('path');

console.log('?? TrekSafe API - Configuração PostgreSQL');
console.log('==========================================\n');

// Verificar se .env existe
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('? Arquivo .env não encontrado!');
  console.log('?? Crie um arquivo .env na raiz do projeto com as seguintes variáveis:\n');
  
  const envTemplate = `PORT=3000
DATABASE_URL="postgresql://username:password@localhost:5432/treksafe_db?schema=public"
JWT_SECRET=treksafe_secret_key_change_in_production
JWT_EXPIRE=24h`;
  
  console.log(envTemplate);
  console.log('\n?? Substitua username, password pelos seus dados do PostgreSQL');
  process.exit(1);
}

// Ler .env atual
const envContent = fs.readFileSync(envPath, 'utf8');
console.log('? Arquivo .env encontrado');

// Verificar DATABASE_URL
if (envContent.includes('DATABASE_URL')) {
  console.log('? DATABASE_URL configurada');
  
  // Extrair URL do banco
  const match = envContent.match(/DATABASE_URL="([^"]+)"/);
  if (match) {
    const dbUrl = match[1];
    console.log(`?? URL do banco: ${dbUrl}`);
    
    if (dbUrl.includes('username:password')) {
      console.log('??  ATENÇÃO: Você precisa substituir "username" e "password" pelas suas credenciais reais do PostgreSQL!');
      console.log('\n?? Passos para configurar:');
      console.log('1. Instale PostgreSQL se ainda não tiver');
      console.log('2. Crie um banco chamado "treksafe_db"');
      console.log('3. Substitua "username" pelo seu usuário PostgreSQL');
      console.log('4. Substitua "password" pela sua senha PostgreSQL');
      console.log('5. Execute: npm run migrate');
    } else {
      console.log('? Credenciais configuradas');
    }
  }
} else {
  console.log('? DATABASE_URL não encontrada no .env');
}

console.log('\n?? Próximos passos:');
console.log('1. Configure PostgreSQL e atualize DATABASE_URL no .env');
console.log('2. Execute: npm install');
console.log('3. Execute: npm run migrate');
console.log('4. Execute: npm run dev:prisma');
console.log('5. Teste: http://localhost:3000/api/health');

console.log('\n???  Comandos úteis:');
console.log('- npm run db:studio    # Interface visual do banco');
console.log('- npm run db:reset     # Resetar banco (cuidado!)');
console.log('- npm run dev:prisma   # Iniciar servidor com Prisma');

console.log('\n? Configuração concluída!');
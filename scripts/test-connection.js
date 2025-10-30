const prisma = require('../config/prisma');

async function testConnection() {
  try {
    console.log('?? Testando conexão com PostgreSQL...');
    
    // Teste básico de conexão
    await prisma.$connect();
    console.log('? Conectado ao PostgreSQL com sucesso!');
    
    // Teste de query simples
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('? Query de teste executada:', result);
    
    // Verificar se as tabelas foram criadas
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('?? Tabelas criadas no banco:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    console.log('\n?? Teste de conexão concluído com sucesso!');
    
  } catch (error) {
    console.error('? Erro na conexão:', error.message);
    console.error('?? Verifique se:');
    console.error('  1. PostgreSQL está rodando');
    console.error('  2. DATABASE_URL está correto no .env');
    console.error('  3. Banco de dados existe');
    console.error('  4. Credenciais estão corretas');
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

testConnection();
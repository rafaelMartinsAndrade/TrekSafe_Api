const { execSync } = require('child_process');
const path = require('path');

console.log('?? Iniciando migração do banco de dados...');

try {
  // Gerar o cliente Prisma
  console.log('?? Gerando cliente Prisma...');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });

  // Executar migração
  console.log('??? Executando migração...');
  execSync('npx prisma db push', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });

  console.log('? Migração concluída com sucesso!');
  console.log('?? Para visualizar o banco, execute: npx prisma studio');

} catch (error) {
  console.error('? Erro durante a migração:', error.message);
  process.exit(1);
}
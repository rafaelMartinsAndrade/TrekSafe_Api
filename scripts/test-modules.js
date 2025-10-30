console.log('?? Testando carregamento de módulos...');

try {
  // Testar carregamento do Prisma Client
  console.log('?? Carregando @prisma/client...');
  const { PrismaClient } = require('@prisma/client');
  console.log('? @prisma/client carregado com sucesso');
  
  // Testar carregamento do Express
  console.log('?? Carregando express...');
  const express = require('express');
  console.log('? express carregado com sucesso');
  
  // Testar carregamento do dotenv
  console.log('?? Carregando dotenv...');
  const dotenv = require('dotenv');
  console.log('? dotenv carregado com sucesso');
  
  // Carregar variáveis de ambiente
  console.log('?? Carregando variáveis de ambiente...');
  dotenv.config();
  
  if (process.env.DATABASE_URL) {
    console.log('? DATABASE_URL encontrada');
  } else {
    console.log('?? DATABASE_URL não encontrada no .env');
  }
  
  if (process.env.JWT_SECRET) {
    console.log('? JWT_SECRET encontrada');
  } else {
    console.log('?? JWT_SECRET não encontrada no .env');
  }
  
  console.log('?? Todos os módulos carregados com sucesso!');
  
} catch (error) {
  console.error('? Erro ao carregar módulos:', error.message);
  console.error('?? Execute: npm install');
}

console.log('? Teste de módulos concluído');
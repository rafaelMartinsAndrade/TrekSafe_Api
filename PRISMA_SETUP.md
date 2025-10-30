# TrekSafe API - Migração para PostgreSQL com Prisma

Este documento descreve como configurar e usar a versão da API com PostgreSQL e Prisma.

## ?? Pré-requisitos

1. **PostgreSQL** instalado e rodando
2. **Node.js** (versão 16 ou superior)
3. **npm** ou **yarn**

## ?? Configuração Inicial

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Banco de Dados

1. Crie um banco PostgreSQL chamado `treksafe_db`
2. Atualize o arquivo `.env` com suas credenciais:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/treksafe_db?schema=public"
PORT=5000
JWT_SECRET=seu_jwt_secret_aqui
JWT_EXPIRE=30d
```

### 3. Executar Migração

```bash
npm run migrate
```

Ou execute os comandos separadamente:

```bash
# Gerar cliente Prisma
npm run db:generate

# Aplicar schema ao banco
npm run db:push
```

## ????? Executando a API

### Modo Desenvolvimento
```bash
npm run dev:prisma
```

### Modo Produção
```bash
npm run start:prisma
```

## ??? Scripts Disponíveis

- `npm run start:prisma` - Inicia servidor em produção
- `npm run dev:prisma` - Inicia servidor em desenvolvimento
- `npm run migrate` - Executa migração completa
- `npm run db:generate` - Gera cliente Prisma
- `npm run db:push` - Aplica schema ao banco
- `npm run db:studio` - Abre Prisma Studio (interface visual)
- `npm run db:reset` - Reseta banco (cuidado!)

## ?? Prisma Studio

Para visualizar e editar dados graficamente:

```bash
npm run db:studio
```

Acesse: http://localhost:5555

## ??? Estrutura do Projeto

```
TrekSafe_API/
??? prisma/
?   ??? schema.prisma          # Schema do banco
??? config/
?   ??? prisma.js             # Configuração do cliente
??? models/prisma/            # Modelos Prisma
?   ??? Usuario.js
?   ??? Trilha.js
?   ??? PontoTrilha.js
?   ??? POI.js
?   ??? TrilhaFavorita.js
??? routes/prisma/            # Rotas usando Prisma
?   ??? auth.js
?   ??? treks.js
?   ??? pois.js
?   ??? favorites.js
??? middleware/
?   ??? authPrisma.js         # Middleware de auth
??? scripts/
?   ??? migrate.js            # Script de migração
??? serverPrisma.js           # Servidor principal
```

## ?? Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do usuário atual
- `POST /api/auth/forgot-password` - Esqueci senha
- `POST /api/auth/reset-password` - Resetar senha

### Trilhas
- `GET /api/treks` - Listar trilhas
- `POST /api/treks` - Criar trilha
- `GET /api/treks/:id` - Obter trilha
- `PUT /api/treks/:id` - Atualizar trilha
- `DELETE /api/treks/:id` - Deletar trilha
- `POST /api/treks/:id/coordinates` - Adicionar coordenadas
- `GET /api/treks/:id/export/:format` - Exportar (json/gpx/txt)

### POIs
- `GET /api/pois/trek/:trekId` - Listar POIs da trilha
- `POST /api/pois` - Criar POI
- `GET /api/pois/:id` - Obter POI
- `PUT /api/pois/:id` - Atualizar POI
- `DELETE /api/pois/:id` - Deletar POI
- `GET /api/pois/search` - Buscar POIs por área

### Favoritos
- `GET /api/favorites` - Listar favoritos
- `POST /api/favorites` - Adicionar favorito
- `DELETE /api/favorites/:id` - Remover favorito
- `GET /api/favorites/check/:trekId` - Verificar se é favorito
- `GET /api/favorites/popular` - Trilhas mais favoritadas

## ?? Health Check

Verifique se a API está funcionando:

```bash
GET /api/health
```

## ?? Troubleshooting

### Erro de Conexão
1. Verifique se PostgreSQL está rodando
2. Confirme credenciais no `.env`
3. Teste conexão: `psql -h localhost -U username -d treksafe_db`

### Erro de Schema
1. Execute: `npm run db:reset`
2. Execute: `npm run migrate`

### Erro de Cliente
1. Execute: `npm run db:generate`
2. Reinicie o servidor

## ?? Notas Importantes

1. **Backup**: Sempre faça backup antes de executar `db:reset`
2. **Ambiente**: Use `.env` diferentes para dev/prod
3. **Segurança**: Nunca commite credenciais reais
4. **Performance**: Use índices apropriados em produção

## ?? Migração do MongoDB

Se você está migrando do MongoDB:

1. Exporte dados do MongoDB
2. Configure PostgreSQL
3. Execute migração: `npm run migrate`
4. Importe dados (script personalizado necessário)
5. Teste endpoints
6. Atualize aplicação cliente para usar novos endpoints
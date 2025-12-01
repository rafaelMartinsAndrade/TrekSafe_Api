## Objetivo
Configurar e rodar a TrekSafe_API usando PostgreSQL com Prisma, aplicando o schema e iniciando o servidor Prisma.

## PrÃ©â€‘requisitos
- PostgreSQL instalado e em execuÃ§Ã£o (localhost porta `5432`).
- Banco `treksafe_db` criado e usuÃ¡rio com acesso.
- Node.js instalado; dependÃªncias do projeto instaladas (`npm install`).

## Configurar `.env`
- Criar/editar `c:\Users\samsung\source\TrekSafe_API\.env` com:
  - `DATABASE_URL="postgresql://<usuario>:<senha>@localhost:5432/treksafe_db?schema=public"`
  - `PORT=5000` (opcional) e `JWT_SECRET`, `JWT_EXPIRE`.
- ReferÃªncia: `scripts/setup-postgres.js` valida e instrui a configuraÃ§Ã£o (`scripts/setup-postgres.js:7-65`).

## Aplicar schema ao PostgreSQL
- Garantir dependÃªncias: `npm install`.
- Rodar migraÃ§Ã£o: `npm run migrate`.
  - O script executa `prisma generate` e `prisma db push` (`scripts/migrate.js:7-19`).
  - Script definido em `package.json` (`package.json:12-19`).
- Confirmar provider PostgreSQL no schema: `prisma/schema.prisma:8-11`.

## Verificar banco
- Abrir Prisma Studio: `npm run db:studio` para inspecionar tabelas e dados (`package.json:16-19`).
- Opcional: reaplicar schema manualmente com `npm run db:push`.

## Iniciar servidor com Prisma
- Iniciar: `npm run dev:prisma` (usa `serverPrisma.js`) (`package.json:9,11`).
- Health check: `GET http://localhost:5000/api/health` valida conexÃ£o (`serverPrisma.js:36-47`).

## Erros comuns e correÃ§Ãµes
- `DATABASE_URL` invÃ¡lida: verificar usuÃ¡rio/senha/banco e que a string estÃ¡ entre aspas.
- Banco nÃ£o existe: criar `treksafe_db` antes de `db push`.
- Postgres nÃ£o estÃ¡ rodando: iniciar serviÃ§o e reexecutar `npm run migrate`.
- Firewall/porta: liberar 5432 local.

## PrÃ³ximo passo
Com sua confirmaÃ§Ã£o, executo os comandos acima, verifico a migraÃ§Ã£o e deixo o servidor Prisma rodando com o health check funcional.
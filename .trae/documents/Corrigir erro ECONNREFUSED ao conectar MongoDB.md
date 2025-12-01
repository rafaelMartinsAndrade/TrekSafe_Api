## Causa Provável

* A API está conectando via `mongoose` usando `process.env.MONGODB_URI` (c:\Users\samsung\source\TrekSafe\_API\config\db.js:5) carregado em `server.js` (c:\Users\samsung\source\TrekSafe\_API\server.js:9,14,19).

* O erro `connect ECONNREFUSED ::1:27017` e `127.0.0.1:27017` indica que o cliente tentou IPv6 (`::1`) e IPv4 (`127.0.0.1`) para `localhost`, mas não há `mongod` escutando na porta 27017 ou o `localhost` está resolvendo para IPv6 que não está habilitado no MongoDB.

## O que vou fazer

1. Revisar o `.env` e confirmar o valor de `MONGODB_URI` que a API usa.
2. Se for banco local, trocar `localhost` por `127.0.0.1` e incluir `?directConnection=true` (ex.: `mongodb://127.0.0.1:27017/treksafe?directConnection=true`).
3. Se for Atlas, substituir por URI `mongodb+srv://...` correta e garantir IP liberado (whitelist) e credenciais válidas.
4. Forçar resolução IPv4 no Node para evitar `::1` quando `localhost` for usado:

   * Opção sem código: setar `NODE_OPTIONS=--dns-result-order=ipv4first` no ambiente.

   * Opção com código: adicionar `dns.setDefaultResultOrder('ipv4first')` no início de `server.js` antes de `dotenv.config()`.
5. Verificar se o MongoDB está de fato rodando:

   * Windows Service `MongoDB` (Services.msc) ou container Docker (`mongo:6`) com mapeamento `-p 27017:27017`.

   * Checar firewall liberando entrada na porta 27017 local.
6. Reiniciar a API e validar logs:

   * Esperado: `MongoDB Conectado: ...` (c:\Users\samsung\source\TrekSafe\_API\config\db.js:10).

   * Exercitar `GET /api/health` e `GET /` para confirmar API online (c:\Users\samsung\source\TrekSafe\_API\server.js:69,57).

## Validação

* Confirmar ausência do erro ECONNREFUSED nos logs.

* Confirmar conexão `mongoose` bem-sucedida e resposta das rotas de saúde.

* Caso a API rode em Docker/compose, ajustar `MONGODB_URI` para hostname do serviço (`mongodb`) em vez de `localhost`.

## Entregáveis

* Atualização do `MONGODB_URI` conforme ambiente (local/Atlas/Docker).

* Ajuste opcional para resolução IPv4 no Node (configuração de ambiente ou linha de código).

* Instruções claras para iniciar o MongoDB e validar a conexão.


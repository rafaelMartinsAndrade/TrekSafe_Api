# TrekSafe API

API de autenticação para o sistema TrekSafe, desenvolvida com Node.js, Express e MongoDB.

## Configuração

1. Instale as dependências:
```
npm install
```

2. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/treksafe
JWT_SECRET=seu_segredo_jwt
JWT_EXPIRE=24h
```

3. Inicie o servidor:
```
npm start
```

Para desenvolvimento:
```
npm run dev
```

## Endpoints da API

### Autenticação

#### Registrar Usuário
- **URL**: `/api/auth/register`
- **Método**: `POST`
- **Corpo da Requisição**:
  ```json
  {
    "name": "Nome do Usuário",
    "email": "usuario@email.com",
    "password": "senha123"
  }
  ```
- **Resposta de Sucesso**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

#### Login de Usuário
- **URL**: `/api/auth/login`
- **Método**: `POST`
- **Corpo da Requisição**:
  ```json
  {
    "email": "usuario@email.com",
    "password": "senha123"
  }
  ```
- **Resposta de Sucesso**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

#### Logout de Usuário
- **URL**: `/api/auth/logout`
- **Método**: `GET`
- **Headers**: 
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```
- **Resposta de Sucesso**:
  ```json
  {
    "success": true,
    "message": "Logout realizado com sucesso",
    "data": {}
  }
  ```

#### Solicitar Recuperação de Senha
- **URL**: `/api/auth/forgot-password`
- **Método**: `POST`
- **Corpo da Requisição**:
  ```json
  {
    "email": "usuario@email.com"
  }
  ```
- **Resposta de Sucesso**:
  ```json
  {
    "success": true,
    "message": "Email de recuperação enviado",
    "resetToken": "token_de_recuperacao" // Em produção, não retornar o token diretamente
  }
  ```

#### Redefinir Senha
- **URL**: `/api/auth/reset-password/:resettoken`
- **Método**: `PUT`
- **Corpo da Requisição**:
  ```json
  {
    "password": "nova_senha123"
  }
  ```
- **Resposta de Sucesso**:
  ```json
  {
    "success": true,
    "message": "Senha alterada com sucesso",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### Usuários

#### Obter Usuário Atual
- **URL**: `/api/users/me`
- **Método**: `GET`
- **Headers**: 
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```
- **Resposta de Sucesso**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "Nome do Usuário",
      "email": "usuario@email.com",
      "createdAt": "2023-06-22T19:12:24.985Z"
    }
  }
  ```

## Trilhas

### Criar Trilha
- **URL**: `/api/treks`
- **Método**: `POST`
- **Headers**:
  ```
  Authorization: Bearer <token>
  ```
- **Corpo da Requisição**:
  ```json
  {
    "title": "Trilha Serra do Mar",
    "description": "Trilha feita online",
    "startedAt": "2025-10-23T10:00:00Z",
    "endedAt": "2025-10-23T12:00:00Z",
    "totalDistance": 7200.5,
    "durationSeconds": 7200,
    "isOnline": true,
    "isPublic": false,
    "initialLat": -23.5505,
    "initialLng": -46.6333
  }
  ```
- **Observações**:
  - `initialLat` deve estar entre `-90` e `90`
  - `initialLng` deve estar entre `-180` e `180`
  - `isPublic`: quando `true`, a trilha aparece para outros usuários nas buscas por área
- **Resposta de Sucesso**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "<trekId>",
      "title": "Trilha Serra do Mar",
      "user": "<userId>",
      "startedAt": "2025-10-23T10:00:00.000Z",
      "endedAt": "2025-10-23T12:00:00.000Z",
      "totalDistance": 7200.5,
      "durationSeconds": 7200,
      "isOnline": true,
      "initialLat": -23.5505,
      "initialLng": -46.6333,
      "createdAt": "2025-10-23T12:05:00.000Z"
    }
  }
  ```

### Adicionar Coordenadas da Trilha
- **URL**: `/api/treks/:trekId/coords`
- **Método**: `POST`
- **Headers**:
  ```
  Authorization: Bearer <token>
  ```
- **Corpo da Requisição**:
  ```json
  {
    "coords": [
      { "lat": -23.5505, "lng": -46.6333, "timestamp": "2025-10-23T10:01:00Z" },
      { "lat": -23.5510, "lng": -46.6335, "timestamp": "2025-10-23T10:01:05Z" },
      { "lat": -23.5515, "lng": -46.6338, "timestamp": "2025-10-23T10:01:10Z" }
    ]
  }
  ```
- **Comportamento**:
  - Ordena por `timestamp` ascendente
  - Atribui `orderIndex` sequencial, continuando de onde parou
  - Salva na coleção `PontosTrilha` com chave estrangeira `trek` apontando para a trilha
- **Resposta de Sucesso**:
  ```json
  {
    "success": true,
    "count": 3,
    "data": [
      {
        "trek": "<trekId>",
        "orderIndex": 0,
        "lat": -23.5505,
        "lng": -46.6333,
        "timestamp": "2025-10-23T10:01:00.000Z"
      }
    ]
  }
  ```

### Buscar Trilhas por Bounding Box
- **URL**: `/api/treks/search`
- **Método**: `GET`
- **Headers**:
  ```
  Authorization: Bearer <token>
  ```
- **Query Params**:
  - `minLat`, `maxLat`, `minLng`, `maxLng` (obrigatórios)
  - `includePois` (opcional, `true|false`) ? inclui pontos de interesse vinculados às trilhas retornadas
- **Comportamento**:
  - Considera trilhas do usuário que tenham `initialLat/initialLng` ou qualquer coordenada dentro do bounding box
  - Inclui também trilhas de outros usuários quando `isPublic=true`
- **Exemplo**:
  ```http
  GET /api/treks/search?minLat=-23.56&maxLat=-23.54&minLng=-46.64&maxLng=-46.62&includePois=true
  ```
- **Resposta de Sucesso**:
  ```json
  {
    "success": true,
    "count": 2,
    "data": [
      {
        "_id": "<trekId>",
        "title": "Trilha Serra do Mar",
        "isPublic": true,
        "initialLat": -23.5505,
        "initialLng": -46.6333,
        "pois": [
          { "_id": "<poiId>", "name": "Mirante", "lat": -23.551, "lng": -46.6337 },
          { "_id": "<poiId2>", "name": "Cachoeira" }
        ]
      },
      { "_id": "<trekId2>", "title": "Trilha do Usuário", "isPublic": false }
    ]
  }
  ```

### Buscar Trilha por ID
- **URL**: `/api/treks/:trekId`
- **Método**: `GET`
- **Headers**:
  ```
  Authorization: Bearer <token>
  ```
- **Query Params**:
  - `withCoords` (opcional, `true|false`) ? inclui coordenadas ordenadas da trilha
  - `includePois` (opcional, `true|false`) ? inclui POIs vinculados a esta trilha
- **Resposta de Sucesso**:
  ```json
  {
    "success": true,
    "data": {
      "trek": { "_id": "<trekId>", "title": "Trilha" },
      "coords": [ { "lat": -23.55, "lng": -46.63 } ],
      "pois": [ { "name": "Ponto de Interesse" } ]
    }
  }
  ```

### Atualizar Trilha
- **URL**: `/api/treks/:trekId`
- **Método**: `PUT`
- **Headers**:
  ```
  Authorization: Bearer <token>
  ```
- **Campos Permitidos**:
  - `title`, `description`, `startedAt`, `endedAt`, `totalDistance`, `durationSeconds`, `isOnline`, `isPublic`
  - Não é permitido alterar `initialLat`, `initialLng` ou `user`
- **Exemplo**:
  ```json
  {
    "title": "Trilha Serra do Mar (pública)",
    "isPublic": true
  }
  ```
- **Resposta de Sucesso**:
  ```json
  { "success": true, "data": { "_id": "<trekId>", "isPublic": true } }
  ```

### POIs

#### Criar POI
- **URL**: `/api/pois`
- **Método**: `POST`
- **Headers**:
  ```
  Authorization: Bearer <token>
  ```
- **Corpo da Requisição**:
  ```json
  {
    "trekId": "<trekId>",
    "name": "Mirante",
    "lat": -23.551,
    "lng": -46.6337,
    "description": "Vista bonita",
    "alt": 780
  }
  ```
- **Resposta de Sucesso**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "<poiId>",
      "trek": "<trekId>",
      "name": "Mirante",
      "lat": -23.551,
      "lng": -46.6337,
      "alt": 780,
      "createdAt": "2025-10-23T12:05:00.000Z"
    }
  }
  ```

#### Listar POIs por Trilha
- **URL**: `/api/pois/by-trek/:trekId`
- **Método**: `GET`
- **Headers**:
  ```
  Authorization: Bearer <token>
  ```
- **Resposta de Sucesso**:
  ```json
  {
    "success": true,
    "count": 2,
    "data": [
      { "_id": "<poiId>", "name": "Mirante", "lat": -23.551, "lng": -46.6337 },
      { "_id": "<poiId2>", "name": "Cachoeira" }
    ]
  }
  ```

#### Obter POI por ID
- **URL**: `/api/pois/:poiId`
- **Método**: `GET`
- **Headers**:
  ```
  Authorization: Bearer <token>
  ```
- **Resposta de Sucesso**:
  ```json
  { "success": true, "data": { "_id": "<poiId>", "name": "Mirante" } }
  ```

#### Atualizar POI
- **URL**: `/api/pois/:poiId`
- **Método**: `PUT`
- **Headers**:
  ```
  Authorization: Bearer <token>
  ```
- **Corpo da Requisição** (campos opcionais):
  ```json
  { "name": "Novo nome", "description": "...", "lat": -23.552, "lng": -46.6338, "alt": 790 }
  ```
- **Resposta de Sucesso**:
  ```json
  { "success": true, "data": { "_id": "<poiId>", "name": "Novo nome" } }
  ```

#### Remover POI
- **URL**: `/api/pois/:poiId`
- **Método**: `DELETE`
- **Headers**:
  ```
  Authorization: Bearer <token>
  ```
- **Resposta de Sucesso**:
  ```json
  { "success": true, "message": "POI removido com sucesso" }
  ```

### Trilhas Favoritas

#### Adicionar Favorito
- **URL**: `/api/favorites`
- **Método**: `POST`
- **Headers**:
  ```
  Authorization: Bearer <token>
  ```
- **Corpo da Requisição**:
  ```json
  { "trekId": "<trekId>" }
  ```
- **Resposta de Sucesso**:
  ```json
  { "success": true, "data": { "_id": "<favoriteId>", "trek": "<trekId>", "user": "<userId>" } }
  ```

#### Listar Favoritos
- **URL**: `/api/favorites`
- **Método**: `GET`
- **Headers**:
  ```
  Authorization: Bearer <token>
  ```
- **Resposta de Sucesso**:
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "_id": "<favoriteId>",
        "trek": { "_id": "<trekId>", "title": "Trilha Serra do Mar", "isPublic": true },
        "user": "<userId>",
        "createdAt": "2025-10-23T12:05:00.000Z"
      }
    ]
  }
  ```

#### Remover Favorito
- **URL**: `/api/favorites/:favoriteId`
- **Método**: `DELETE`
- **Headers**:
  ```
  Authorization: Bearer <token>
  ```
- **Resposta de Sucesso**:
  ```json
  { "success": true, "message": "Favorito removido com sucesso" }
  ```

### Minhas Trilhas

#### Listar Minhas Trilhas
- **URL**: `/api/treks/mine`
- **Método**: `GET`
- **Headers**:
  ```
  Authorization: Bearer <token>
  ```
- **Resposta de Sucesso**:
  ```json
  { "success": true, "count": 3, "data": [ { "_id": "<trekId>", "title": "Trilha" } ] }
  ```

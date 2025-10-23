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
    "initialLat": -23.5505,
    "initialLng": -46.6333
  }
  ```
- **Observações**:
  - `initialLat` deve estar entre `-90` e `90`
  - `initialLng` deve estar entre `-180` e `180`
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
  - Salva na coleção `trek_coords` com chave estrangeira `trek` apontando para a trilha
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

### Filtrar Trilhas por Bounding Box
- **URL**: `/api/treks/search`
- **Método**: `GET`
- **Headers**:
  ```
  Authorization: Bearer <token>
  ```
- **Query Params**:
  - `minLat`, `maxLat`, `minLng`, `maxLng` (números)
- **Comportamento**:
  - Considera dois critérios:
    - Trilhas com ponto inicial (`initialLat/initialLng`) dentro do retângulo
    - Trilhas com ao menos uma coordenada (`trek_coords`) dentro do retângulo
  - Retorna apenas trilhas do usuário autenticado
- **Exemplo**:
  ```
  GET /api/treks/search?minLat=-23.56&maxLat=-23.54&minLng=-46.64&maxLng=-46.62
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
        "user": "<userId>",
        "initialLat": -23.5505,
        "initialLng": -46.6333,
        "createdAt": "2025-10-23T12:05:00.000Z"
      }
    ]
  }
  ```

### Obter Trilha por ID
- **URL**: `/api/treks/:trekId`
- **Método**: `GET`
- **Headers**:
  ```
  Authorization: Bearer <token>
  ```
- **Query Params (opcional)**:
  - `withCoords=true` para incluir coordenadas ordenadas (`orderIndex` asc)
- **Exemplos**:
  - `GET /api/treks/652fc1d9e1eabf3f1d123456`
  - `GET /api/treks/652fc1d9e1eabf3f1d123456?withCoords=true`
- **Resposta de Sucesso (sem coords)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "<trekId>",
      "title": "Trilha Serra do Mar",
      "user": "<userId>",
      "initialLat": -23.5505,
      "initialLng": -46.6333,
      "createdAt": "2025-10-23T12:05:00.000Z"
    }
  }
  ```
- **Resposta de Sucesso (com coords)**:
  ```json
  {
    "success": true,
    "data": {
      "trek": {
        "_id": "<trekId>",
        "title": "Trilha Serra do Mar",
        "user": "<userId>",
        "initialLat": -23.5505,
        "initialLng": -46.6333,
        "createdAt": "2025-10-23T12:05:00.000Z"
      },
      "coords": [
        { "orderIndex": 0, "lat": -23.5505, "lng": -46.6333, "timestamp": "2025-10-23T10:01:00.000Z" }
      ]
    }
  }
  ```

## Tecnologias Utilizadas

- Node.js
- Express
- MongoDB
- Mongoose
- JWT (JSON Web Tokens)
- bcryptjs
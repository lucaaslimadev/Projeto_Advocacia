# API Backend - Sistema de Advocacia

## Configuração

### 1. Instalar dependências
```bash
cd server
npm install
```

### 2. Configurar banco de dados PostgreSQL

Crie um banco de dados PostgreSQL:
```sql
CREATE DATABASE advocacia_db;
```

### 3. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

Edite o `.env` com suas configurações:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=advocacia_db
DB_USER=postgres
DB_PASSWORD=sua_senha

JWT_SECRET=seu_jwt_secret_super_seguro_aqui
JWT_EXPIRES_IN=7d

PORT=5000
NODE_ENV=development

MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

### 4. Executar migrations

Execute o SQL de migration:
```bash
psql -U postgres -d advocacia_db -f migrations/001_initial_schema.sql
```

Ou use o script:
```bash
npm run migrate
```

### 5. Iniciar servidor

Desenvolvimento:
```bash
npm run dev
```

Produção:
```bash
npm start
```

## Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Obter usuário atual

### Sessões
- `GET /api/sessoes` - Listar sessões
- `POST /api/sessoes` - Criar sessão
- `DELETE /api/sessoes/:id` - Deletar sessão

### Arquivos
- `GET /api/arquivos` - Listar arquivos (com filtros)
- `GET /api/arquivos/recentes` - Arquivos recentes
- `GET /api/arquivos/sessao/:sessaoId` - Arquivos por sessão
- `POST /api/arquivos/upload` - Upload único
- `POST /api/arquivos/upload-multiple` - Upload múltiplo
- `PUT /api/arquivos/:id` - Atualizar arquivo
- `DELETE /api/arquivos/:id` - Deletar arquivo
- `PATCH /api/arquivos/:id/access` - Atualizar acesso
- `PATCH /api/arquivos/:id/favorito` - Toggle favorito
- `PATCH /api/arquivos/:id/notas` - Atualizar notas
- `GET /api/arquivos/:id/download` - Download arquivo

### Admin (requer role admin)
- `GET /api/admin/usuarios` - Listar usuários
- `GET /api/admin/usuarios/:id` - Detalhes do usuário
- `POST /api/admin/usuarios` - Criar usuário
- `PUT /api/admin/usuarios/:id` - Atualizar usuário
- `PATCH /api/admin/usuarios/:id/senha` - Atualizar senha
- `DELETE /api/admin/usuarios/:id` - Deletar usuário
- `GET /api/admin/estatisticas` - Estatísticas gerais

## Estrutura de Pastas

```
server/
├── config/
│   └── database.js       # Configuração PostgreSQL
├── middleware/
│   └── auth.js           # Middleware de autenticação
├── routes/
│   ├── auth.js           # Rotas de autenticação
│   ├── sessoes.js        # Rotas de sessões
│   ├── arquivos.js       # Rotas de arquivos
│   └── admin.js          # Rotas administrativas
├── migrations/
│   └── 001_initial_schema.sql  # Schema inicial
└── server.js             # Servidor Express
```


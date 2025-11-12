# Configuração do PostgreSQL

## Opção 1: Instalar PostgreSQL via Homebrew

```bash
# Instalar PostgreSQL
brew install postgresql@16

# Iniciar o serviço PostgreSQL
brew services start postgresql@16

# Adicionar ao PATH (adicione ao seu ~/.zshrc)
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Criar banco de dados
createdb advocacia_db

# Executar migration
psql -U $USER -d advocacia_db -f migrations/001_initial_schema.sql
```

## Opção 2: Usar Docker (Mais fácil para desenvolvimento)

```bash
# Instalar Docker Desktop (se não tiver)
# https://www.docker.com/products/docker-desktop

# Executar PostgreSQL em container
docker run --name advocacia-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=advocacia_db \
  -p 5432:5432 \
  -d postgres:16

# Executar migration
docker exec -i advocacia-postgres psql -U postgres -d advocacia_db < migrations/001_initial_schema.sql
```

## Opção 3: Usar PostgreSQL Cloud (Para produção)

- **Railway**: https://railway.app (gratuito para começar)
- **Supabase**: https://supabase.com (gratuito até 500MB)
- **ElephantSQL**: https://www.elephantsql.com (gratuito até 20MB)

## Configuração do .env

Após instalar, configure o `server/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=advocacia_db
DB_USER=postgres  # ou seu usuário do sistema
DB_PASSWORD=postgres  # ou sua senha
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
PORT=5000
NODE_ENV=development
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

## Verificar instalação

```bash
# Verificar se PostgreSQL está rodando
psql --version

# Conectar ao banco
psql -U postgres -d advocacia_db

# Listar tabelas
\dt
```


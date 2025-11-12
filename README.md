# 📚 Sistema de Advocacia - Gerenciamento de Documentos Jurídicos

Sistema web completo para gerenciamento de documentos jurídicos, desenvolvido para escritórios de advocacia.

## 🚀 Tecnologias

### Frontend
- **React 18** - Biblioteca JavaScript para interfaces
- **Tailwind CSS** - Framework CSS utilitário
- **React Router** - Roteamento
- **Lucide React** - Ícones modernos

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação
- **Multer** - Upload de arquivos
- **bcryptjs** - Hash de senhas

## 📋 Funcionalidades

- ✅ **Autenticação de usuários** (Login/Registro)
- ✅ **Upload de arquivos** (PDF, DOC, DOCX, TXT)
- ✅ **Upload múltiplo** de arquivos
- ✅ **Organização por sessões** (Criminal, Cível, Trabalhista, etc.)
- ✅ **Pesquisa inteligente** por nome ou palavras-chave
- ✅ **Arquivos recentes** (últimos 20 acessados)
- ✅ **Edição de metadados** (nome, cliente, tags, etc.)
- ✅ **Download de arquivos**
- ✅ **Painel administrativo** (gerenciar usuários)
- ✅ **Sistema de tags coloridas**
- ✅ **Favoritos**
- ✅ **Notas por arquivo**

## 🛠️ Instalação

### Pré-requisitos

- Node.js 16+
- PostgreSQL 14+
- npm ou yarn

### 1. Clone o repositório

```bash
git clone https://github.com/SEU_USUARIO/Projeto_Advocacia.git
cd Projeto_Advocacia
```

### 2. Instalar dependências

```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 3. Configurar banco de dados

```bash
# Criar banco de dados
createdb advocacia_db

# Executar migrations
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"  # macOS
psql -U seu_usuario -d advocacia_db -f server/migrations/001_initial_schema.sql
```

### 4. Configurar variáveis de ambiente

**Backend** (`server/.env`):
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=advocacia_db
DB_USER=seu_usuario
DB_PASSWORD=sua_senha

JWT_SECRET=seu_jwt_secret_super_seguro_aqui
JWT_EXPIRES_IN=7d

PORT=5001
NODE_ENV=development

MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

**Frontend** (raiz `.env`):
```env
REACT_APP_API_URL=http://localhost:5001/api
```

### 5. Iniciar aplicação

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
npm start
```

Acesse: http://localhost:3000

## 👤 Credenciais Padrão

Após a primeira execução, um usuário admin é criado automaticamente:

- **Email**: `admin@advocacia.com`
- **Senha**: `admin123`

⚠️ **IMPORTANTE**: Altere a senha em produção!

## 📁 Estrutura do Projeto

```
Projeto_Advocacia/
├── server/                 # Backend Node.js
│   ├── config/            # Configurações (database)
│   ├── middleware/        # Middlewares (auth)
│   ├── routes/            # Rotas da API
│   │   ├── auth.js        # Autenticação
│   │   ├── sessoes.js     # Sessões
│   │   ├── arquivos.js    # Arquivos
│   │   └── admin.js       # Admin
│   ├── migrations/        # Migrations SQL
│   ├── uploads/           # Arquivos salvos (gitignored)
│   └── server.js          # Servidor principal
│
├── src/                    # Frontend React
│   ├── components/        # Componentes React
│   │   ├── Login.js       # Tela de login
│   │   ├── AdminPanel.js  # Painel admin
│   │   ├── SearchTab.js   # Aba de pesquisa
│   │   ├── RecentTab.js   # Aba de recentes
│   │   └── ...
│   ├── services/          # Serviços de API
│   │   └── api.js         # Cliente API
│   ├── AppWeb.js          # App principal
│   └── index.js           # Entry point
│
├── public/                 # Arquivos públicos
└── docs/                   # Documentação
```

## 🔐 Segurança

- Senhas hasheadas com bcrypt
- Autenticação JWT
- Validação de dados (express-validator)
- CORS configurado
- Helmet para segurança HTTP
- Isolamento de dados por usuário

## 📊 Banco de Dados

### Tabelas Principais

- **usuarios**: Usuários do sistema
- **sessoes**: Categorias de documentos
- **arquivos**: Documentos e metadados

## 🚢 Deploy

### Opções Recomendadas

1. **Railway** (Mais fácil)
   - Deploy automático
   - PostgreSQL incluído
   - Frontend no Vercel/Netlify

2. **Heroku**
   - Addon PostgreSQL
   - Deploy via Git

3. **AWS/DigitalOcean**
   - Mais controle
   - Requer mais configuração

## 📝 Scripts Disponíveis

### Frontend
- `npm start` - Desenvolvimento
- `npm run build` - Build de produção

### Backend
- `npm run dev` - Desenvolvimento (nodemon)
- `npm start` - Produção
- `npm run migrate` - Executar migrations

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é de uso privado para escritórios de advocacia.

## 👨‍💻 Autor

**Lucas Lima**

## 🙏 Agradecimentos

- Comunidade React
- Comunidade Node.js
- Todos os mantenedores das bibliotecas utilizadas

---

⭐ Se este projeto foi útil, considere dar uma estrela!

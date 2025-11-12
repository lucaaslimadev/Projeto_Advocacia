# 📦 Guia de Backup e Deploy no GitHub

## ✅ Checklist Antes de Fazer Backup

- [x] `.gitignore` configurado
- [x] Arquivos sensíveis não versionados (.env)
- [x] README.md completo
- [x] Estrutura organizada
- [x] Documentação atualizada

## 📋 Passos para Fazer Backup no GitHub

### 1. Inicializar Git (se ainda não foi feito)

```bash
cd /Users/lucaslima/Desktop/PROJETOS_GITHUB/Projeto_Advocacia
git init
```

### 2. Adicionar arquivos

```bash
# Verificar o que será adicionado
git status

# Adicionar todos os arquivos (respeitando .gitignore)
git add .
```

### 3. Fazer commit inicial

```bash
git commit -m "feat: Sistema de Advocacia - Gerenciamento de Documentos Jurídicos

- Backend Node.js/Express com PostgreSQL
- Frontend React com Tailwind CSS
- Sistema de autenticação JWT
- Upload e download de arquivos
- Painel administrativo
- Gerenciamento de sessões e documentos"
```

### 4. Criar repositório no GitHub

1. Acesse: https://github.com/new
2. Nome do repositório: `Projeto_Advocacia` (ou outro nome)
3. Descrição: "Sistema web para gerenciamento de documentos jurídicos"
4. Escolha: **Privado** (recomendado) ou Público
5. **NÃO** inicialize com README (já temos)
6. Clique em "Create repository"

### 5. Conectar e fazer push

```bash
# Adicionar remote
git remote add origin https://github.com/SEU_USUARIO/Projeto_Advocacia.git

# Renomear branch para main (se necessário)
git branch -M main

# Fazer push
git push -u origin main
```

## 🔒 Segurança - Arquivos NÃO Versionados

Os seguintes arquivos **NÃO** serão enviados (estão no .gitignore):

- ✅ `.env` (variáveis de ambiente)
- ✅ `node_modules/` (dependências)
- ✅ `server/uploads/` (arquivos dos usuários)
- ✅ `*.db` (bancos de dados)
- ✅ `.DS_Store` (arquivos do macOS)

## 📝 Arquivos de Exemplo

Crie arquivos `.env.example` para referência:

### `server/.env.example`
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=advocacia_db
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui

JWT_SECRET=seu_jwt_secret_super_seguro_aqui
JWT_EXPIRES_IN=7d

PORT=5001
NODE_ENV=development

MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

### `.env.example` (raiz)
```env
REACT_APP_API_URL=http://localhost:5001/api
```

## 🚀 Comandos Úteis

```bash
# Ver status
git status

# Ver o que será commitado
git diff --cached

# Ver histórico
git log --oneline

# Criar tag de versão
git tag -a v1.0.0 -m "Versão inicial"
git push origin v1.0.0
```

## 📦 Estrutura Recomendada para GitHub

```
Projeto_Advocacia/
├── .gitignore          ✅
├── README.md           ✅
├── LICENSE             ✅ (opcional)
├── CONTRIBUTING.md     ✅
├── .env.example        ⚠️ Criar
├── server/
│   ├── .env.example    ⚠️ Criar
│   └── .gitignore      ✅
└── ...
```

## ⚠️ Importante

1. **NUNCA** commite arquivos `.env` com senhas reais
2. **NUNCA** commite `node_modules/`
3. **NUNCA** commite arquivos de upload (`server/uploads/`)
4. **SEMPRE** use `.env.example` como template
5. **SEMPRE** verifique `git status` antes de commit

## 🔄 Atualizações Futuras

```bash
# Adicionar mudanças
git add .

# Commit
git commit -m "descrição das mudanças"

# Push
git push origin main
```

## 📚 Recursos

- [GitHub Docs](https://docs.github.com)
- [Git Handbook](https://guides.github.com/introduction/git-handbook/)


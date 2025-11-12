# 🚀 Preparar Projeto para GitHub

## ✅ Arquivos Criados

- ✅ `.gitignore` - Configurado para ignorar arquivos sensíveis
- ✅ `README.md` - Documentação completa
- ✅ `CONTRIBUTING.md` - Guia de contribuição
- ✅ `.env.example` - Template de variáveis de ambiente
- ✅ `server/.env.example` - Template do backend
- ✅ `BACKUP.md` - Guia de backup

## 📋 Próximos Passos

### 1. Verificar o que será commitado

```bash
git status
```

### 2. Adicionar arquivos novos/modificados

```bash
# Ver o que será adicionado
git status

# Adicionar tudo (respeitando .gitignore)
git add .

# OU adicionar seletivamente
git add README.md
git add server/
git add src/
git add package.json
# etc...
```

### 3. Fazer commit

```bash
git commit -m "feat: Sistema de Advocacia - Versão Web Completa

- Migração de Electron para Web
- Backend Node.js/Express com PostgreSQL
- Frontend React com autenticação
- Sistema completo de upload/download
- Painel administrativo
- Gerenciamento de sessões e documentos"
```

### 4. Fazer push para GitHub

```bash
# Se já tem remote configurado
git push origin main

# OU se for a primeira vez
git remote add origin https://github.com/SEU_USUARIO/Projeto_Advocacia.git
git branch -M main
git push -u origin main
```

## 🔒 Segurança - Verificar ANTES de Push

Certifique-se de que estes arquivos **NÃO** estão sendo commitados:

```bash
# Verificar se .env está ignorado
git check-ignore .env server/.env

# Verificar se node_modules está ignorado
git check-ignore node_modules server/node_modules

# Verificar se uploads está ignorado
git check-ignore server/uploads
```

## 📦 Tamanho do Repositório

- **Sem node_modules**: ~5-10 MB
- **Com node_modules**: ~1 GB (NÃO commitar!)

O `.gitignore` já está configurado para ignorar `node_modules/`.

## 🎯 Estrutura Final no GitHub

```
Projeto_Advocacia/
├── .gitignore
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── BACKUP.md
├── .env.example
├── package.json
├── server/
│   ├── .env.example
│   ├── package.json
│   ├── server.js
│   └── ...
├── src/
│   └── ...
└── public/
    └── ...
```

## ⚠️ Checklist Final

Antes de fazer push, verifique:

- [ ] `.env` não está no git (git check-ignore .env)
- [ ] `node_modules/` não está no git
- [ ] `server/uploads/` não está no git
- [ ] Arquivos `.example` criados
- [ ] README.md atualizado
- [ ] Sem senhas ou tokens no código
- [ ] Licença adicionada (se necessário)

## 🚀 Comandos Rápidos

```bash
# Ver o que será commitado
git status

# Adicionar tudo
git add .

# Commit
git commit -m "sua mensagem"

# Push
git push origin main
```

## 📝 Dica

Se quiser fazer um backup local antes:

```bash
# Criar arquivo .tar.gz
tar -czf backup-advocacia-$(date +%Y%m%d).tar.gz \
  --exclude='node_modules' \
  --exclude='server/node_modules' \
  --exclude='.env' \
  --exclude='server/.env' \
  --exclude='server/uploads' \
  .
```

Pronto para fazer backup! 🎉


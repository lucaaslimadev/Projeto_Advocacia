# 🚀 Como Iniciar a Aplicação

## ✅ Status Atual
- ✅ PostgreSQL instalado e rodando
- ✅ Banco de dados criado
- ✅ Tabelas criadas
- ✅ Arquivos .env configurados

## 📋 Passos para Iniciar

### 1. Iniciar o Backend (Terminal 1)

```bash
cd server
npm run dev
```

O servidor iniciará em: **http://localhost:5000**

### 2. Iniciar o Frontend (Terminal 2)

```bash
# Na raiz do projeto
npm start
```

O frontend iniciará em: **http://localhost:3000**

## 🔍 Verificar se está funcionando

### Backend
```bash
curl http://localhost:5000/api/health
```

Deve retornar:
```json
{"status":"ok","timestamp":"..."}
```

### Frontend
Abra no navegador: http://localhost:3000

## 🎯 Primeiro Acesso

1. Acesse http://localhost:3000
2. Você será redirecionado para `/login`
3. Clique em "Registre-se" para criar uma conta
4. Após registrar, você será logado automaticamente

## 👤 Criar Usuário Admin

Para criar um usuário admin, você pode:

1. **Via código** (temporário):
   - Editar `server/routes/auth.js` e adicionar lógica para primeiro usuário ser admin
   
2. **Via banco de dados**:
```sql
psql -U lucaslima -d advocacia_db
UPDATE usuarios SET role = 'admin' WHERE email = 'seu@email.com';
```

3. **Via API** (após criar primeiro admin):
   - Usar o painel admin em `/admin`

## 🛠️ Comandos Úteis

### Parar o servidor
```bash
# Encontrar o processo
ps aux | grep "node.*server.js"

# Matar o processo
kill <PID>
```

### Ver logs do PostgreSQL
```bash
tail -f /opt/homebrew/var/log/postgresql@16.log
```

### Conectar ao banco
```bash
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
psql -U lucaslima -d advocacia_db
```

### Ver tabelas
```sql
\dt
```

### Ver usuários
```sql
SELECT id, nome, email, role, ativo FROM usuarios;
```

## ⚠️ Problemas Comuns

### PostgreSQL não está rodando
```bash
brew services start postgresql@16
```

### Porta 5000 já em uso
```bash
# Ver o que está usando a porta
lsof -i :5000

# Matar o processo
kill -9 <PID>
```

### Erro de conexão com banco
Verifique o arquivo `server/.env`:
- DB_USER deve ser seu usuário do sistema (lucaslima)
- DB_PASSWORD deve estar vazio (ou sua senha se configurou)

## 📝 Notas

- O JWT_SECRET foi gerado automaticamente, mas você pode mudá-lo no `.env`
- Os arquivos são salvos em `server/uploads/`
- O banco de dados está em: `/opt/homebrew/var/postgresql@16`


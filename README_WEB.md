# Sistema de Advocacia - Versão Web

## 🚀 Migração de Electron para Web

Este projeto foi migrado de Electron para uma aplicação web completa com backend Node.js e frontend React.

## 📋 Tecnologias

### Backend
- **Node.js** + **Express**
- **PostgreSQL** (substituiu SQLite)
- **JWT** para autenticação
- **Multer** para upload de arquivos
- **bcryptjs** para hash de senhas

### Frontend
- **React 18**
- **React Router** para navegação
- **Tailwind CSS** para estilização
- **Lucide React** para ícones

## 🗄️ Por que PostgreSQL?

PostgreSQL é a escolha ideal para deploy web porque:
- ✅ **Escalabilidade**: Suporta múltiplos usuários simultâneos
- ✅ **Confiabilidade**: ACID completo, transações robustas
- ✅ **Performance**: Índices avançados, full-text search nativo
- ✅ **Deploy fácil**: Suportado por todos os principais provedores (Heroku, AWS, Railway, etc)
- ✅ **Multi-tenancy**: Cada usuário tem seus próprios dados isolados
- ✅ **Backup**: Ferramentas nativas de backup e restore

## 📦 Instalação

### Backend

```bash
cd server
npm install
cp .env.example .env
# Edite o .env com suas configurações
psql -U postgres -d advocacia_db -f migrations/001_initial_schema.sql
npm run dev
```

### Frontend

```bash
npm install
# Crie um arquivo .env na raiz com:
# REACT_APP_API_URL=http://localhost:5000/api
npm start
```

## 🔐 Autenticação

O sistema agora possui:
- ✅ Login/Registro de usuários
- ✅ Autenticação JWT
- ✅ Proteção de rotas
- ✅ Isolamento de dados por usuário
- ✅ Sistema de roles (admin/user)

## 👥 Painel Administrativo

Acesse `/admin` (apenas para admins) para:
- Gerenciar usuários
- Visualizar estatísticas
- Ativar/desativar usuários
- Alterar roles

## 🎯 Melhorias Implementadas

1. **Multi-usuário**: Cada usuário vê apenas seus próprios arquivos
2. **Segurança**: Senhas hasheadas, JWT, validação de dados
3. **Escalabilidade**: Pronto para produção
4. **API REST**: Padrão RESTful para integração
5. **Upload de arquivos**: Sistema robusto com validação

## 📝 Sugestões Adicionais de Melhorias

### 1. **Paginação**
- Implementar paginação nos resultados de busca
- Limitar número de arquivos por página

### 2. **Busca Avançada**
- Filtros combinados (data + sessão + cliente)
- Busca full-text no conteúdo dos PDFs (usando pg_trgm)

### 3. **Notificações**
- Sistema de notificações em tempo real (WebSockets)
- Alertas de novos uploads

### 4. **Compartilhamento**
- Compartilhar arquivos entre usuários
- Links públicos temporários

### 5. **Versionamento**
- Histórico de versões dos arquivos
- Restaurar versões anteriores

### 6. **Backup Automático**
- Backup automático do banco de dados
- Restore point-in-time

### 7. **Auditoria**
- Log de todas as ações dos usuários
- Rastreabilidade completa

### 8. **Dashboard Analytics**
- Gráficos de uso
- Estatísticas por período
- Relatórios exportáveis

### 9. **Integração com Cloud Storage**
- Upload direto para S3/Google Cloud
- Redução de carga no servidor

### 10. **API de Integração**
- Webhooks para eventos
- API pública documentada (Swagger)

### 11. **Mobile Responsive**
- Melhorar experiência mobile
- PWA (Progressive Web App)

### 12. **Cache e Performance**
- Redis para cache de queries frequentes
- CDN para arquivos estáticos

## 🚢 Deploy

### Opções Recomendadas:

1. **Railway** (Mais fácil)
   - Deploy automático do backend
   - PostgreSQL incluído
   - Frontend no Vercel/Netlify

2. **Heroku**
   - Addon PostgreSQL
   - Deploy via Git

3. **AWS/DigitalOcean**
   - Mais controle
   - Requer mais configuração

### Variáveis de Ambiente para Produção:

```env
NODE_ENV=production
DB_HOST=seu_host_postgres
DB_NAME=advocacia_db
DB_USER=seu_usuario
DB_PASSWORD=sua_senha_segura
JWT_SECRET=seu_jwt_secret_super_seguro
PORT=5000
```

## 📚 Estrutura do Projeto

```
Projeto_Advocacia/
├── server/              # Backend Node.js
│   ├── config/         # Configurações
│   ├── middleware/     # Middlewares
│   ├── routes/         # Rotas da API
│   ├── migrations/     # Migrations SQL
│   └── server.js       # Servidor principal
├── src/                # Frontend React
│   ├── components/     # Componentes React
│   ├── services/       # Serviços de API
│   └── AppWeb.js       # App principal web
└── public/            # Arquivos públicos
```

## 🔄 Diferenças da Versão Electron

| Feature | Electron | Web |
|---------|----------|-----|
| Banco | SQLite local | PostgreSQL remoto |
| Usuários | Single user | Multi-user |
| Autenticação | Não | Sim (JWT) |
| Upload | Dialog nativo | Input file HTML |
| Acesso | Local | Web (qualquer lugar) |
| Deploy | Instalador | URL web |

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação da API em `server/README.md`.


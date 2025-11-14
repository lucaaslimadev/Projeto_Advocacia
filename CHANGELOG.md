# Changelog

## [2.0.0] - 2024-11-14

### 🗑️ Removido
- Código legado do Electron (public/electron.js, build/electron.js, etc.)
- Código legado do SQLite (better-sqlite3)
- Projeto Python antigo (advocacia-app/)
- Componentes obsoletos (UploadModal.js, MultiUploadModal.js)
- Documentação de bugs corrigidos
- Dependências não utilizadas (electron, electron-builder, docx, pdf-lib, etc.)

### ✨ Adicionado
- Estrutura de pastas organizada
- Scripts utilitários organizados em `server/scripts/utils/` e `server/scripts/migrations/`
- Documentação profissional no README.md

### 🔄 Refatorado
- `AppWeb.js` renomeado para `App.js`
- Package.json limpo e atualizado
- .gitignore atualizado (removidas referências a Python/Electron)

### 📝 Melhorado
- README.md atualizado com estrutura atual do projeto
- Versionamento atualizado para 2.0.0

## [1.0.0] - Versão inicial
- Migração de Electron para Web
- Implementação de PostgreSQL
- Sistema de autenticação JWT
- Upload de arquivos
- Gerenciamento de sessões e documentos


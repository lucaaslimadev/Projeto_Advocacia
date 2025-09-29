# AdvocaciaApp

Um aplicativo desktop moderno para auxiliar advogados no gerenciamento de petições e documentos jurídicos.

Desenvolvido por **Lucas Lima**.

---

## Visão Geral

Este repositório contém duas implementações da mesma aplicação:

- **Electron + React**: Uma versão com interface moderna e multiplataforma.
- **Python (Tkinter)**: Uma versão alternativa e mais leve, ideal para ambientes onde o Python já está presente.

## Estrutura de Pastas

```
Projeto_Advocacia/
│
├── src/                # Código-fonte React (frontend Electron)
├── public/             # Arquivos públicos e electron.js (main Electron)
├── build/              # Build frontend (gerado)
├── dist/               # Instaladores gerados (Electron Builder)
├── docs/               # Documentação adicional
├── advocacia-app/      # Módulo Python (Tkinter, scripts, instalador alternativo)
│   ├── src/            # Código Python principal
│   └── installer/      # Scripts de build e instalador Inno Setup
├── package.json        # Configuração Node/Electron
├── requirements.txt    # Dependências Python
├── LICENSE             # Licença MIT
└── README.md           # Este arquivo
```

## Instalação e Uso

### 1. Pré-requisitos

- Node.js e npm instalados
- Python 3.x (opcional, para uso do módulo Python)

### 2. Instalar dependências

```bash
npm install
```

### 3. Rodar em modo desenvolvimento

```bash
npm run electron-dev
```

### 4. Gerar instalador para Windows

No Windows, execute:

```bash
npm run electron-pack-win
```

O instalador será gerado em `dist/`.

### 5. (Opcional) Usar versão Python

Entre em `advocacia-app/` e siga as instruções do `installer/` para gerar executável com PyInstaller ou Inno Setup.

## Scripts Importantes

- `npm run electron-dev` — Inicia Electron + React em modo dev
- `npm run electron-pack-win` — Gera instalador Windows
- `npm run build` — Gera build de produção do frontend

## Como subir para o GitHub

1. Faça login no GitHub e crie um novo repositório.
2. No terminal, dentro da pasta do projeto:
   ```bash
   git init
   git add .
   git commit -m "Projeto AdvocaciaApp - Lucas Lima"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/NOME_REPO.git
   git push -u origin main
   ```

---

**Autor:** Lucas Lima

# Sistema de Petições - Advocacia

Um aplicativo desktop moderno para auxiliar advogados no gerenciamento de petições e documentos jurídicos.

## Funcionalidades

- 🔍 **Pesquisa Inteligente**: Encontre documentos rapidamente por nome ou palavras-chave
- 📁 **Organização por Sessões**: Organize documentos em categorias (Criminal, Cível, Trabalhista, etc.)
- ⏰ **Arquivos Recentes**: Acesso rápido aos documentos utilizados recentemente
- 🏷️ **Sistema de Tags**: Adicione palavras-chave para facilitar a busca
- 💾 **Banco SQLite**: Armazenamento local seguro e rápido
- 🎨 **Interface Moderna**: Design intuitivo com React e Tailwind CSS

## Tecnologias Utilizadas

- **Frontend**: React 18 + Tailwind CSS
- **Desktop**: Electron
- **Banco de Dados**: SQLite3
- **Ícones**: Lucide React
- **Build**: Electron Builder

## Instalação e Execução

### Pré-requisitos

- Node.js 16+
- npm ou yarn

### Desenvolvimento

1. Instale as dependências:

```bash
npm install
```

2. Execute em modo desenvolvimento:

```bash
npm run electron-dev
```

### Build para Produção

1. Gere o build:

```bash
npm run electron-pack
```

2. O executável será gerado na pasta `dist/`

## Estrutura do Projeto

```
src/
├── components/
│   ├── SearchTab.js      # Aba de resultados de pesquisa
│   ├── RecentTab.js      # Aba de arquivos recentes
│   ├── UploadModal.js    # Modal de upload de arquivos
│   └── SessionsModal.js  # Modal de gerenciamento de sessões
├── App.js               # Componente principal
├── index.js            # Entrada da aplicação
└── index.css           # Estilos globais

public/
└── electron.js         # Processo principal do Electron
```

## Como Usar

1. **Upload de Arquivos**: Clique no botão "Upload" para adicionar novos documentos
2. **Organizar em Sessões**: Use o botão "Sessões" para criar e gerenciar categorias
3. **Pesquisar**: Digite na barra de pesquisa para encontrar documentos
4. **Acessar Recentes**: Use a aba "Arquivos Recentes" para documentos utilizados recentemente
5. **Abrir Documentos**: Clique duplo em qualquer arquivo para abri-lo

## Sessões Padrão

O sistema vem com as seguintes sessões pré-configuradas:

- Criminal
- Cível
- Trabalhista
- Tributário
- Família

## Formatos Suportados

- PDF (.pdf)
- Microsoft Word (.doc, .docx)
- Texto (.txt)

## Licença

Este projeto é de uso privado para escritórios de advocacia.

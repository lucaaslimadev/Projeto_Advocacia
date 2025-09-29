const { contextBridge, ipcRenderer } = require("electron");

// Expõe um objeto 'electronAPI' seguro para o processo de renderização (seu app React)
contextBridge.exposeInMainWorld("electronAPI", {
  // Mapeia cada função que seu frontend precisa chamar no backend
  getSessoes: () => ipcRenderer.invoke("get-sessoes"),
  createSessao: (nome) => ipcRenderer.invoke("create-sessao", nome),
  deleteSessao: (id) => ipcRenderer.invoke("delete-sessao", id),
  searchArquivos: (query) => ipcRenderer.invoke("search-arquivos", query),
  getRecentArquivos: () => ipcRenderer.invoke("get-recent-arquivos"),
  saveArquivo: (arquivo) => ipcRenderer.invoke("save-arquivo", arquivo),
  updateArquivoAccess: (id) => ipcRenderer.invoke("update-arquivo-access", id),
  selectFile: () => ipcRenderer.invoke("select-file"),
  openFile: (filePath) => ipcRenderer.invoke("open-file", filePath),
  getUserDataPath: () => ipcRenderer.invoke("get-user-data-path"),
  toggleFavorito: (id) => ipcRenderer.invoke("toggle-favorito", id),
  updateNotas: (id, notas) => ipcRenderer.invoke("update-notas", id, notas),
  updateTagCor: (id, cor) => ipcRenderer.invoke("update-tag-cor", id, cor),
  deleteArquivo: (id) => ipcRenderer.invoke("delete-arquivo", id),
  updateArquivo: (arquivo) => ipcRenderer.invoke("update-arquivo", arquivo),
  searchArquivosAvancado: (filtros) =>
    ipcRenderer.invoke("search-arquivos-avancado", filtros),
  getArquivosBySession: (sessionId) =>
    ipcRenderer.invoke("get-arquivos-by-session", sessionId),
  convertFile: (filePath) => ipcRenderer.invoke("convert-file", filePath),
  selectMultipleFiles: () => ipcRenderer.invoke("select-multiple-files"),
});

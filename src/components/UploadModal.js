import React, { useState } from "react";
import { X, Upload, FileText, Tag, FolderOpen } from "lucide-react";

const UploadModal = ({ sessions, onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [keywords, setKeywords] = useState("");
  const [cliente, setCliente] = useState("");
  const [tagCor, setTagCor] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async () => {
    try {
      const result = await window.electronAPI.selectFile();
      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        // Replicando a lógica de path.basename sem o módulo 'path'
        const baseName = filePath
          .split(/[\\/]/)
          .pop()
          .replace(/\.[^/.]+$/, "");
        setSelectedFile(filePath);
        setFileName(baseName);
      }
    } catch (error) {
      console.error("Erro ao selecionar arquivo:", error);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !fileName.trim()) {
      alert("Por favor, selecione um arquivo e defina um nome.");
      return;
    }

    setIsUploading(true);

    try {
      // Encontrar ID da sessão
      let sessionId = null;
      if (selectedSession) {
        const session = sessions.find((s) => s.nome === selectedSession);
        sessionId = session ? session.id : null;
      }

      // Salvar no banco de dados (o Electron vai gerenciar o arquivo)
      const arquivo = {
        nome: fileName,
        caminho: selectedFile, // Usar o caminho original por enquanto
        sessao_id: sessionId,
        palavras_chave: keywords.trim(),
        cliente: cliente.trim(),
        tag_cor: tagCor,
        data_criacao: new Date().toISOString().split("T")[0],
      };

      await window.electronAPI.saveArquivo(arquivo);

      alert("Arquivo salvo com sucesso!");
      onSuccess();
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao salvar arquivo: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">
            Upload de Arquivo
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* File Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Selecionar Arquivo
            </label>
            <div
              onClick={handleFileSelect}
              className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-blue-500 hover:bg-gray-800 transition-all duration-200 cursor-pointer"
            >
              {selectedFile ? (
                <div className="flex items-center justify-center space-x-2">
                  <FileText className="w-6 h-6 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-white break-all">
                      {selectedFile.split(/[\\/]/).pop()}
                    </p>
                    <p className="text-xs text-gray-400">Clique para alterar</p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-300">
                    Clique para selecionar um arquivo
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX, TXT
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* File Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome do Arquivo
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Digite o nome do arquivo"
            />
          </div>

          {/* Session */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <FolderOpen className="w-4 h-4 inline mr-1" />
              Sessão (opcional)
            </label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione uma sessão</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.nome}>
                  {session.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Palavras-chave (opcional)
            </label>
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="2"
              placeholder="Digite palavras-chave separadas por vírgula"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ex: menor de idade, criminal, defesa
            </p>
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cliente (opcional)
            </label>
            <input
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nome do cliente"
            />
          </div>

          {/* Tag Colorida */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tag Colorida (opcional)
            </label>
            <div className="flex space-x-2">
              {["red", "blue", "green", "yellow", "purple", "pink"].map(
                (cor) => (
                  <button
                    key={cor}
                    type="button"
                    onClick={() => setTagCor(tagCor === cor ? "" : cor)}
                    className={`w-6 h-6 rounded-full border-2 transition-colors duration-200 ${
                      tagCor === cor
                        ? "border-white ring-2 ring-blue-400"
                        : "border-gray-500 hover:border-gray-300"
                    } ${
                      cor === "red"
                        ? "bg-red-500 hover:bg-red-400"
                        : cor === "blue"
                        ? "bg-blue-500 hover:bg-blue-400"
                        : cor === "green"
                        ? "bg-green-500 hover:bg-green-400"
                        : cor === "yellow"
                        ? "bg-yellow-500 hover:bg-yellow-400"
                        : cor === "purple"
                        ? "bg-purple-500 hover:bg-purple-400"
                        : "bg-pink-500 hover:bg-pink-400"
                    }`}
                  />
                )
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors duration-200"
            disabled={isUploading}
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !fileName.trim() || isUploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isUploading ? "Salvando..." : "Salvar Arquivo"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;

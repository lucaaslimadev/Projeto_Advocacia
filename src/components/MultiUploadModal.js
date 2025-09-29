import React, { useState } from "react";
import {
  X,
  Upload,
  FileText,
  FolderOpen,
  Check,
  ArrowRight,
} from "lucide-react";

const MultiUploadModal = ({ sessions, onClose, onSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentStep, setCurrentStep] = useState(1); // 1: Upload, 2: Distribuir
  const [isUploading, setIsUploading] = useState(false);

  const handleMultiFileSelect = async () => {
    try {
      console.log("Tentando abrir seletor de arquivos...");
      const result = await window.electronAPI.selectMultipleFiles();
      console.log("Resultado do seletor:", result);

      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        const files = result.filePaths.map((filePath) => ({
          path: filePath,
          name: filePath
            .split(/[\\/]/)
            .pop()
            .replace(/\.[^/.]+$/, ""),
          originalName: filePath.split(/[\\/]/).pop(),
          sessionId: null,
          sessionName: "",
          keywords: "",
          cliente: "",
          tagCor: "",
        }));
        console.log("Arquivos processados:", files);
        setSelectedFiles(files);
      } else {
        console.log("Nenhum arquivo selecionado ou operação cancelada");
      }
    } catch (error) {
      console.error("Erro ao selecionar arquivos:", error);
      alert("Erro ao abrir seletor de arquivos: " + error.message);
    }
  };

  const updateFileSession = (index, sessionId, sessionName) => {
    const updatedFiles = [...selectedFiles];
    updatedFiles[index].sessionId = sessionId;
    updatedFiles[index].sessionName = sessionName;
    setSelectedFiles(updatedFiles);
  };

  const updateFileField = (index, field, value) => {
    const updatedFiles = [...selectedFiles];
    updatedFiles[index][field] = value;
    setSelectedFiles(updatedFiles);
  };

  const removeFile = (index) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
  };

  const handleUploadAll = async () => {
    if (selectedFiles.length === 0) {
      alert("Nenhum arquivo selecionado.");
      return;
    }

    setIsUploading(true);

    try {
      for (const file of selectedFiles) {
        const arquivo = {
          nome: file.name,
          caminho: file.path,
          sessao_id: file.sessionId,
          palavras_chave: file.keywords.trim(),
          cliente: file.cliente.trim(),
          tag_cor: file.tagCor,
          data_criacao: new Date().toISOString().split("T")[0],
        };

        await window.electronAPI.saveArquivo(arquivo);
      }

      alert(`${selectedFiles.length} arquivo(s) salvos com sucesso!`);
      onSuccess();
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao salvar arquivos: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const goToDistribution = () => {
    if (selectedFiles.length === 0) {
      alert("Selecione pelo menos um arquivo.");
      return;
    }
    setCurrentStep(2);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-white">
              {currentStep === 1 ? "Upload Múltiplo" : "Distribuir Arquivos"}
            </h2>
            <div className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-600 text-gray-300"
                }`}
              >
                1
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 2
                    ? "bg-blue-600 text-white"
                    : "bg-gray-600 text-gray-300"
                }`}
              >
                2
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {currentStep === 1 ? (
            // Step 1: File Selection
            <div className="space-y-6">
              {/* File Selection Area */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Selecionar Arquivos
                </label>
                <div
                  onClick={handleMultiFileSelect}
                  className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-gray-800 transition-all duration-200 cursor-pointer"
                >
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg text-gray-300 mb-2">
                    Clique para selecionar múltiplos arquivos
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF, DOC, DOCX, TXT - Segure Ctrl/Cmd para selecionar vários
                  </p>
                </div>
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">
                    Arquivos Selecionados ({selectedFiles.length})
                  </h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-800 rounded-lg p-3"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-blue-400" />
                          <div>
                            <p className="text-sm font-medium text-white">
                              {file.originalName}
                            </p>
                            <p className="text-xs text-gray-400">{file.path}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Step 2: Distribution
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-white mb-2">
                  Distribua os arquivos nas sessões
                </h3>
                <p className="text-sm text-gray-400">
                  Configure cada arquivo individualmente ou deixe sem sessão
                </p>
              </div>

              <div className="space-y-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <FileText className="w-6 h-6 text-blue-400 mt-1" />
                      <div className="flex-1 space-y-3">
                        {/* File Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Nome do Arquivo
                          </label>
                          <input
                            type="text"
                            value={file.name}
                            onChange={(e) =>
                              updateFileField(index, "name", e.target.value)
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Session */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              <FolderOpen className="w-4 h-4 inline mr-1" />
                              Sessão
                            </label>
                            <select
                              value={file.sessionId || ""}
                              onChange={(e) => {
                                const sessionId = e.target.value;
                                const sessionName =
                                  sessions.find(
                                    (s) => s.id.toString() === sessionId
                                  )?.nome || "";
                                updateFileSession(
                                  index,
                                  sessionId ? parseInt(sessionId) : null,
                                  sessionName
                                );
                              }}
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Sem sessão</option>
                              {sessions.map((session) => (
                                <option key={session.id} value={session.id}>
                                  {session.nome}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Cliente */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Cliente
                            </label>
                            <input
                              type="text"
                              value={file.cliente}
                              onChange={(e) =>
                                updateFileField(
                                  index,
                                  "cliente",
                                  e.target.value
                                )
                              }
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Nome do cliente"
                            />
                          </div>
                        </div>

                        {/* Keywords */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Palavras-chave
                          </label>
                          <input
                            type="text"
                            value={file.keywords}
                            onChange={(e) =>
                              updateFileField(index, "keywords", e.target.value)
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Palavras-chave separadas por vírgula"
                          />
                        </div>

                        {/* Tag Colorida */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Tag Colorida
                          </label>
                          <div className="flex space-x-2">
                            {[
                              "red",
                              "blue",
                              "green",
                              "yellow",
                              "purple",
                              "pink",
                            ].map((cor) => (
                              <button
                                key={cor}
                                type="button"
                                onClick={() =>
                                  updateFileField(
                                    index,
                                    "tagCor",
                                    file.tagCor === cor ? "" : cor
                                  )
                                }
                                className={`w-6 h-6 rounded-full border-2 transition-colors duration-200 ${
                                  file.tagCor === cor
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
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            {selectedFiles.length > 0 &&
              `${selectedFiles.length} arquivo(s) selecionado(s)`}
          </div>
          <div className="flex items-center space-x-3">
            {currentStep === 2 && (
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors duration-200"
                disabled={isUploading}
              >
                Voltar
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors duration-200"
              disabled={isUploading}
            >
              Cancelar
            </button>
            {currentStep === 1 ? (
              <button
                onClick={goToDistribution}
                disabled={selectedFiles.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Próximo
              </button>
            ) : (
              <button
                onClick={handleUploadAll}
                disabled={isUploading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isUploading ? "Salvando..." : "Salvar Todos"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiUploadModal;

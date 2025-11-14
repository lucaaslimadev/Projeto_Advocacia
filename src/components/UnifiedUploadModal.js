import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileText,
  FolderOpen,
  Tag,
  ArrowRight,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { showToast } from "../utils/toast";

const UnifiedUploadModal = ({ sessions, onClose, onSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentStep, setCurrentStep] = useState(1); // 1: Seleção, 2: Configuração
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['.pdf', '.doc', '.docx', '.txt'];

  const validateFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_TYPES.includes(ext)) {
      showToast.error(`Tipo de arquivo não permitido: ${file.name}. Apenas PDF, DOC, DOCX, TXT.`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast.error(`Arquivo muito grande: ${file.name}. Tamanho máximo: 10MB.`);
      return false;
    }
    return true;
  };

  const processFiles = (files) => {
    const validFiles = Array.from(files).filter(validateFile);
    if (validFiles.length === 0) return;

    const newFiles = validFiles.map((file) => ({
      file: file,
      name: file.name.replace(/\.[^/.]+$/, ""),
      originalName: file.name,
      size: file.size,
      sessionId: null,
      sessionName: "",
      keywords: "",
      cliente: "",
      tagCor: "",
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    if (validFiles.length < files.length) {
      showToast.warning(`${files.length - validFiles.length} arquivo(s) inválido(s) foram ignorados.`);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const updateFileField = (index, field, value) => {
    const updatedFiles = [...selectedFiles];
    updatedFiles[index][field] = value;
    
    // Se mudou a sessão, atualizar também o nome da sessão
    if (field === 'sessionId') {
      const session = sessions.find(s => s.id === parseInt(value, 10));
      updatedFiles[index].sessionName = session ? session.nome : "";
    }
    
    setSelectedFiles(updatedFiles);
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      showToast.warning("Nenhum arquivo selecionado.");
      return;
    }

    // Validar se todos os arquivos têm nome
    const filesWithoutName = selectedFiles.filter(f => !f.name.trim());
    if (filesWithoutName.length > 0) {
      showToast.warning("Por favor, defina um nome para todos os arquivos.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simular progresso durante upload
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 200);

    try {
      const formData = new FormData();
      const arquivosData = [];

      selectedFiles.forEach((fileData) => {
        formData.append('arquivos', fileData.file);
        arquivosData.push({
          nome: fileData.name.trim(),
          sessao_id: fileData.sessionId || null,
          palavras_chave: fileData.keywords.trim() || null,
          cliente: fileData.cliente.trim() || null,
          tag_cor: fileData.tagCor || null,
          data_criacao: new Date().toISOString().split("T")[0],
        });
      });

      formData.append('arquivosData', JSON.stringify(arquivosData));

      const { arquivosAPI } = require('../services/api');
      
      if (selectedFiles.length === 1) {
        // Upload único
        const singleFormData = new FormData();
        singleFormData.append('arquivo', selectedFiles[0].file);
        singleFormData.append('nome', selectedFiles[0].name.trim());
        if (selectedFiles[0].sessionId) {
          singleFormData.append('sessao_id', selectedFiles[0].sessionId);
        }
        if (selectedFiles[0].keywords.trim()) {
          singleFormData.append('palavras_chave', selectedFiles[0].keywords.trim());
        }
        if (selectedFiles[0].cliente.trim()) {
          singleFormData.append('cliente', selectedFiles[0].cliente.trim());
        }
        if (selectedFiles[0].tagCor) {
          singleFormData.append('tag_cor', selectedFiles[0].tagCor);
        }
        singleFormData.append('data_criacao', new Date().toISOString().split("T")[0]);
        
        await arquivosAPI.upload(singleFormData);
      } else {
        // Upload múltiplo
        await arquivosAPI.uploadMultiple(formData);
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      showToast.success(`${selectedFiles.length} arquivo(s) salvo(s) com sucesso!`);
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Erro ao fazer upload:", error);
      showToast.error("Erro ao salvar arquivos: " + error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const goToConfiguration = () => {
    if (selectedFiles.length === 0) {
      showToast.warning("Selecione pelo menos um arquivo.");
      return;
    }
    setCurrentStep(2);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-white">
              {currentStep === 1 ? "Upload de Arquivos" : "Configurar Arquivos"}
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
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 1 ? (
            // Step 1: File Selection
            <div className="space-y-6">
              {/* File Selection Area */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Selecionar Arquivo(s)
                </label>
                <div
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
                    isDragging
                      ? "border-blue-500 bg-blue-900/20"
                      : "border-gray-600 hover:border-blue-500 hover:bg-gray-800"
                  }`}
                >
                  <Upload className={`w-16 h-16 mx-auto mb-4 ${isDragging ? "text-blue-400" : "text-gray-400"}`} />
                  <p className="text-lg text-gray-300 mb-2">
                    {isDragging ? "Solte os arquivos aqui" : "Clique ou arraste arquivos aqui"}
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF, DOC, DOCX, TXT - Máximo 10MB por arquivo
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Segure Ctrl/Cmd para selecionar vários arquivos
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt"
                    multiple
                    className="hidden"
                  />
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
                        <div className="flex items-center space-x-3 flex-1">
                          <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {file.originalName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0 ml-2"
                          title="Remover arquivo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Step 2: Configuration
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-white mb-2">
                  Configure os arquivos
                </h3>
                <p className="text-sm text-gray-400">
                  Defina nome, sessão, cliente e outras informações para cada arquivo
                </p>
              </div>

              <div className="space-y-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-5 border border-gray-700">
                    <div className="flex items-start space-x-4">
                      <FileText className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
                      <div className="flex-1 space-y-4">
                        {/* File Info */}
                        <div className="pb-3 border-b border-gray-700">
                          <p className="text-sm font-medium text-gray-400 mb-1">
                            Arquivo Original
                          </p>
                          <p className="text-sm text-white break-all">
                            {file.originalName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>

                        {/* File Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Nome do Arquivo *
                          </label>
                          <input
                            type="text"
                            value={file.name}
                            onChange={(e) =>
                              updateFileField(index, "name", e.target.value)
                            }
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Digite o nome do arquivo"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Session */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              <FolderOpen className="w-4 h-4 inline mr-1" />
                              Sessão
                            </label>
                            <select
                              value={file.sessionId || ""}
                              onChange={(e) =>
                                updateFileField(
                                  index,
                                  "sessionId",
                                  e.target.value ? parseInt(e.target.value, 10) : null
                                )
                              }
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
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Cliente
                            </label>
                            <input
                              type="text"
                              value={file.cliente}
                              onChange={(e) =>
                                updateFileField(index, "cliente", e.target.value)
                              }
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Nome do cliente"
                            />
                          </div>
                        </div>

                        {/* Keywords */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Tag className="w-4 h-4 inline mr-1" />
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
                                className={`w-8 h-8 rounded-full border-2 transition-colors duration-200 ${
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
                                title={cor}
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
        <div className="flex items-center justify-between p-6 border-t border-gray-700 flex-shrink-0">
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
                onClick={goToConfiguration}
                disabled={selectedFiles.length === 0 || isUploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
              >
                <span>Próximo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex-1">
                {isUploading && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400">Enviando...</span>
                      <span className="text-sm text-gray-400">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Salvar {selectedFiles.length > 1 ? 'Todos' : 'Arquivo'}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedUploadModal;


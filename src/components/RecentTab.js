import React, { useState } from "react";
import {
  FileText,
  FolderOpen,
  Calendar,
  Clock,
  Edit,
  ExternalLink,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react";

const RecentTab = ({ files, onFileOpen, onFileEdit, title, onDataChange }) => {
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleFileSelection = (fileId) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const selectAllFiles = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map((f) => f.id)));
    }
  };

  const deleteSelectedFiles = async () => {
    if (selectedFiles.size === 0) return;

    if (
      !window.confirm(
        `Tem certeza que deseja excluir ${selectedFiles.size} arquivo(s)?`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      for (const fileId of selectedFiles) {
        await window.electronAPI.deleteArquivo(fileId);
      }
      setSelectedFiles(new Set());
      alert(`${selectedFiles.size} arquivo(s) excluído(s) com sucesso!`);
      onDataChange(); // Notifica o componente pai para recarregar os dados
    } catch (error) {
      console.error("Erro ao excluir arquivos:", error);
      alert("Erro ao excluir arquivos: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };
  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          Nenhum arquivo recente
        </h3>
        <p className="text-gray-400">
          Seus arquivos acessados recentemente aparecerão aqui
        </p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return "Hoje";
    } else if (diffDays === 2) {
      return "Ontem";
    } else if (diffDays <= 7) {
      return `${diffDays - 1} dias atrás`;
    } else {
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
  };

  const getFileIcon = (filePath) => {
    const extension = filePath.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "pdf":
        return (
          <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center shadow-lg text-xs font-black text-white transform group-hover:scale-110 transition-all duration-300">
            PDF
          </div>
        );
      case "doc":
        return (
          <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg text-xs font-black text-white transform group-hover:scale-110 transition-all duration-300">
            DOC
          </div>
        );
      case "docx":
        return (
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg text-xs font-black text-white transform group-hover:scale-110 transition-all duration-300">
            DOCX
          </div>
        );
      case "txt":
        return (
          <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg text-xs font-black text-white transform group-hover:scale-110 transition-all duration-300">
            TXT
          </div>
        );
      default:
        return (
          <div className="w-14 h-14 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center shadow-lg text-xs font-black text-white transform group-hover:scale-110 transition-all duration-300">
            FILE
          </div>
        );
    }
  };

  const getFileExtension = (fileName) => {
    return fileName.split(".").pop()?.toUpperCase() || "ARQUIVO";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">
          {title || `Arquivos Recentes (${files.length})`}
        </h3>
        {files.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={selectAllFiles}
              className="flex items-center space-x-1 px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-200"
            >
              {selectedFiles.size === files.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span className="text-xs">Todos</span>
            </button>
            {selectedFiles.size > 0 && (
              <button
                onClick={deleteSelectedFiles}
                disabled={isDeleting}
                className="flex items-center space-x-1 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-xs">
                  {isDeleting
                    ? "Excluindo..."
                    : `Excluir (${selectedFiles.size})`}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-2">
        {files.map((arquivo) => (
          <div
            key={arquivo.id}
            className="bg-gray-800/30 rounded-lg p-3 hover:bg-gray-700/50 transition-all duration-200"
          >
            <div className="flex items-start space-x-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleFileSelection(arquivo.id)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {selectedFiles.has(arquivo.id) ? (
                    <CheckSquare className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
                <div className="flex-shrink-0">
                  {getFileIcon(arquivo.caminho || arquivo.nome)}
                </div>
              </div>

              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-base font-medium text-white group-hover:text-primary-300 transition-colors duration-200 truncate">
                    {arquivo.nome}
                  </h4>
                  <span className="inline-block bg-gray-600 text-gray-200 px-2 py-1 rounded text-xs font-medium flex-shrink-0">
                    {getFileExtension(arquivo.nome)}
                  </span>
                  <span className="text-sm text-gray-400 ml-auto">
                    {formatDate(arquivo.accessed_at)}
                  </span>
                </div>

                <div className="mb-2">
                  <span className="text-sm text-gray-400">
                    📁 {arquivo.sessao_nome || "Sem sessão"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    {arquivo.sessao_nome && (
                      <div className="flex items-center space-x-1">
                        <FolderOpen className="w-4 h-4" />
                        <span>{arquivo.sessao_nome}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(arquivo.accessed_at).toLocaleDateString(
                          "pt-BR"
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <button
                      onClick={() => onFileEdit(arquivo)}
                      className="flex items-center space-x-1 px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-200"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-xs font-medium">Editar</span>
                    </button>
                    <button
                      onClick={() => onFileOpen(arquivo)}
                      className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-xs font-medium">Abrir</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTab;

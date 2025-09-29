import React, { useState } from "react";
import {
  FileText,
  FolderOpen,
  Calendar,
  Tag,
  Star,
  MessageSquare,
  Filter,
  Edit,
  ExternalLink,
} from "lucide-react";
import FilterModal from "./FilterModal";

const SearchTab = ({
  results,
  query,
  onFileOpen,
  onFileEdit,
  sessions,
  onAdvancedSearch,
}) => {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(null);
  const [notas, setNotas] = useState("");

  const toggleFavorito = async (arquivo) => {
    try {
      await window.electronAPI.toggleFavorito(arquivo.id);
      // Recarregar resultados
      window.location.reload();
    } catch (error) {
      console.error("Erro ao alterar favorito:", error);
    }
  };

  const saveNotas = async (arquivoId) => {
    try {
      await window.electronAPI.updateNotas(arquivoId, notas);
      setShowNotesModal(null);
      setNotas("");
    } catch (error) {
      console.error("Erro ao salvar notas:", error);
    }
  };

  const getTagColor = (cor) => {
    const colors = {
      red: "bg-red-200 border-red-300",
      blue: "bg-blue-200 border-blue-300",
      green: "bg-green-200 border-green-300",
      yellow: "bg-yellow-200 border-yellow-300",
      purple: "bg-purple-200 border-purple-300",
      pink: "bg-pink-200 border-pink-300",
    };
    return colors[cor] || "bg-gray-200 border-gray-300";
  };
  if (!query) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          Pesquisar Documentos
        </h3>
        <p className="text-gray-400">
          Digite uma palavra-chave para encontrar seus documentos
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          Nenhum resultado encontrado
        </h3>
        <p className="text-gray-400">Tente usar outras palavras-chave</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileExtension = (filePath) => {
    const extension = filePath.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "pdf":
        return "PDF";
      case "doc":
        return "DOC";
      case "docx":
        return "DOCX";
      case "txt":
        return "TXT";
      default:
        return "FILE";
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">
          {results.length} resultado{results.length !== 1 ? "s" : ""} para "
          {query}"
        </h3>
      </div>

      <div className="grid gap-2">
        {results.map((arquivo) => (
          <div
            key={arquivo.id}
            className="bg-gray-800/30 rounded-lg p-3 hover:bg-gray-700/50 transition-all duration-200"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {getFileIcon(arquivo.caminho || arquivo.nome)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-lg font-medium text-white group-hover:text-primary-300 transition-colors duration-200 truncate">
                        {arquivo.nome}
                      </h4>
                      <span className="inline-block bg-gray-600 text-gray-200 px-2 py-1 rounded text-xs font-medium flex-shrink-0">
                        {getFileExtension(arquivo.nome)}
                      </span>
                    </div>

                    <div className="mb-2">
                      <span className="text-sm text-gray-400">
                        📁 {arquivo.sessao_nome || "Sem sessão"}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                      {arquivo.sessao_nome && (
                        <div className="flex items-center space-x-1">
                          <FolderOpen className="w-4 h-4" />
                          <span>{arquivo.sessao_nome}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(arquivo.accessed_at)}</span>
                      </div>
                    </div>

                    {arquivo.palavras_chave && (
                      <div className="flex items-center space-x-1 mt-2">
                        <Tag className="w-4 h-4 text-gray-500" />
                        <div className="flex flex-wrap gap-1">
                          {arquivo.palavras_chave
                            .split(",")
                            .map((tag, index) => (
                              <span
                                key={index}
                                className="inline-block bg-gray-600 text-gray-200 px-2 py-1 rounded text-xs"
                              >
                                {tag.trim()}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
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
                      <span className="text-sm font-medium">Abrir</span>
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

export default SearchTab;

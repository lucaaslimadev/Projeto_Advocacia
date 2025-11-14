import React, { useState, useEffect } from "react";
import { X, Download, FileText, Loader2 } from "lucide-react";
import { arquivosAPI } from "../services/api";

const FileViewer = ({ arquivo, onClose, onDownload }) => {
  const [viewUrl, setViewUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [textContent, setTextContent] = useState(null);

  useEffect(() => {
    if (!arquivo) return;

    const loadFile = async () => {
      try {
        setLoading(true);
        setError(null);

        const ext = arquivo.nome_original?.toLowerCase().split('.').pop() || '';
        
        // Para arquivos de texto, ler o conteúdo
        if (ext === 'txt') {
          const url = await arquivosAPI.view(arquivo.id);
          const response = await fetch(url);
          const text = await response.text();
          setTextContent(text);
          window.URL.revokeObjectURL(url);
        } else {
          // Para PDFs, criar URL do blob
          const url = await arquivosAPI.view(arquivo.id);
          setViewUrl(url);
        }
      } catch (err) {
        console.error('Erro ao carregar arquivo:', err);
        setError('Erro ao carregar arquivo para visualização');
      } finally {
        setLoading(false);
      }
    };

    loadFile();

    // Cleanup: revogar URL quando componente desmontar
    return () => {
      if (viewUrl) {
        window.URL.revokeObjectURL(viewUrl);
      }
    };
  }, [arquivo]);

  const handleDownload = async () => {
    if (onDownload) {
      await onDownload();
    } else {
      await arquivosAPI.download(arquivo.id);
    }
  };

  const ext = arquivo?.nome_original?.toLowerCase().split('.').pop() || '';

  // Para DOC/DOCX, não podemos visualizar diretamente
  if (ext === 'doc' || ext === 'docx') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl mx-4">
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
              <FileText className="w-6 h-6" />
              <span>{arquivo?.nome_original || 'Arquivo'}</span>
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-8 text-center">
            <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-300 mb-2">
              Arquivos DOC/DOCX não podem ser visualizados diretamente no navegador.
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Faça o download do arquivo para visualizá-lo.
            </p>
            <button
              onClick={handleDownload}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
            >
              <Download className="w-5 h-5" />
              <span>Baixar Arquivo</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl mx-4 h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span className="truncate max-w-md">{arquivo?.nome_original || 'Visualizar Arquivo'}</span>
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
              title="Baixar arquivo"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-800">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Carregando arquivo...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Baixar Arquivo
                </button>
              </div>
            </div>
          ) : ext === 'txt' ? (
            <div className="h-full overflow-auto p-6">
              <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm bg-gray-900 p-4 rounded-lg">
                {textContent}
              </pre>
            </div>
          ) : ext === 'pdf' ? (
            <iframe
              src={viewUrl}
              className="w-full h-full border-0"
              title="Visualizador de PDF"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">Tipo de arquivo não suportado para visualização</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileViewer;




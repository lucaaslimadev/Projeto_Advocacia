import React, { useState } from "react";
import { X, Plus, Trash2, FolderOpen } from "lucide-react";

const SessionsModal = ({ sessions, onClose, onUpdate }) => {
  const [newSessionName, setNewSessionName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) {
      alert("Por favor, digite um nome para a sessão.");
      return;
    }

    setIsCreating(true);

    try {
      await window.electronAPI.createSessao(newSessionName.trim());
      setNewSessionName("");
      onUpdate(); // Atualiza a lista sem fechar o modal
    } catch (error) {
      console.error("Erro ao criar sessão:", error);
      alert("Erro ao criar sessão. Verifique se o nome já não existe.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSession = async (sessionId, sessionName) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir a sessão "${sessionName}"?`
      )
    ) {
      try {
        await window.electronAPI.deleteSessao(sessionId);
        onUpdate(); // Atualiza a lista sem fechar o modal
      } catch (error) {
        console.error("Erro ao excluir sessão:", error);
        alert("Erro ao excluir sessão.");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            Gerenciar Sessões
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Create New Session */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nova Sessão
            </label>
            <div className="flex space-x-3">
              <input
                type="text"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleCreateSession()}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nome da sessão"
              />
              <button
                onClick={handleCreateSession}
                disabled={!newSessionName.trim() || isCreating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isCreating ? "Criando..." : "Criar"}</span>
              </button>
            </div>
          </div>

          {/* Sessions List */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              Sessões Existentes ({sessions.length})
            </h3>

            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">Nenhuma sessão criada ainda</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center">
                        <FolderOpen className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{session.nome}</p>
                        <p className="text-xs text-gray-400">
                          Criada em{" "}
                          {new Date(session.created_at).toLocaleDateString(
                            "pt-BR"
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleDeleteSession(session.id, session.nome)
                      }
                      className="text-gray-400 hover:text-red-400 transition-colors duration-200 p-1"
                      title="Excluir sessão"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionsModal;

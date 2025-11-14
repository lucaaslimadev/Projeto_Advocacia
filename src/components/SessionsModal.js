import React, { useState } from "react";
import { X, Plus, Trash2, FolderOpen } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import ConfirmModal from "./ConfirmModal";
import { showToast } from "../utils/toast";

const SessionsModal = ({ sessions, onClose, onUpdate }) => {
  const queryClient = useQueryClient();
  const [newSessionName, setNewSessionName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) {
      showToast.warning("Por favor, digite um nome para a sessão.");
      return;
    }

    setIsCreating(true);

    try {
      const { sessoesAPI } = require('../services/api');
      await sessoesAPI.create(newSessionName.trim());
      setNewSessionName("");
      // Invalidar cache e forçar refetch
      queryClient.invalidateQueries(['sessoes']);
      queryClient.refetchQueries(['sessoes']);
      showToast.success("Sessão criada com sucesso!");
      onUpdate();
    } catch (error) {
      console.error("Erro ao criar sessão:", error);
      const errorMessage = error.message || "Erro ao criar sessão. Verifique se o nome já não existe.";
      showToast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClick = (sessionId, sessionName) => {
    setSessionToDelete({ id: sessionId, name: sessionName });
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;

    try {
      const { sessoesAPI } = require('../services/api');
      await sessoesAPI.delete(sessionToDelete.id);
      // Invalidar cache e forçar refetch
      queryClient.invalidateQueries(['sessoes']);
      queryClient.refetchQueries(['sessoes']);
      // Também invalidar recentFiles pois pode ter arquivos dessa sessão
      queryClient.invalidateQueries(['recentFiles']);
      showToast.success(`Sessão "${sessionToDelete.name}" excluída com sucesso!`);
      setSessionToDelete(null);
      onUpdate();
    } catch (error) {
      console.error("Erro ao excluir sessão:", error);
      const errorMessage = error.message || "Erro ao excluir sessão.";
      showToast.error(errorMessage);
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
            {/* Filtrar apenas sessões do usuário (não globais) */}
            {(() => {
              const userSessions = sessions.filter(s => s.usuario_id !== null);
              return (
                <>
                  <h3 className="text-sm font-medium text-gray-300 mb-3">
                    Sessões Existentes ({userSessions.length})
                    {sessions.length > userSessions.length && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({sessions.length - userSessions.length} globais não editáveis)
                      </span>
                    )}
                  </h3>

                  {userSessions.length === 0 ? (
                    <div className="text-center py-8">
                      <FolderOpen className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-400">Nenhuma sessão criada ainda</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Sessões globais não podem ser editadas aqui
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {userSessions.map((session) => (
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
                              handleDeleteClick(session.id, session.nome)
                            }
                            className="text-gray-400 hover:text-red-400 transition-colors duration-200 p-1"
                            title="Excluir sessão"
                            aria-label={`Excluir sessão ${session.nome}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
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

      {/* Modal de Confirmação */}
      {sessionToDelete && (
        <ConfirmModal
          isOpen={!!sessionToDelete}
          onClose={() => setSessionToDelete(null)}
          onConfirm={handleDeleteSession}
          title="Confirmar Exclusão"
          message={`Tem certeza que deseja excluir a sessão "${sessionToDelete.name}"? Todos os arquivos desta sessão serão mantidos, mas não estarão mais associados a ela.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          type="danger"
        />
      )}
    </div>
  );
};

export default SessionsModal;

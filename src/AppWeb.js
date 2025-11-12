import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Upload,
  Settings,
  FileText,
  Clock,
  FolderOpen,
  UploadCloud,
  LogOut,
  User,
  Shield,
} from "lucide-react";
import SearchTab from "./components/SearchTab";
import RecentTab from "./components/RecentTab";
import UploadModal from "./components/UploadModal";
import MultiUploadModal from "./components/MultiUploadModal";
import EditFileModal from "./components/EditFileModal";
import SessionsModal from "./components/SessionsModal";
import { sessoesAPI, arquivosAPI, authAPI } from "./services/api";

function AppWeb() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMultiUploadModal, setShowMultiUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [selectedSessionFilter, setSelectedSessionFilter] = useState(null);
  const [sessionFiles, setSessionFiles] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadSessions();
    loadRecentFiles();
  }, []);

  const loadSessions = async () => {
    try {
      const sessoes = await sessoesAPI.getAll();
      console.log("Sessões carregadas:", sessoes);
      setSessions(sessoes || []);
    } catch (error) {
      console.error("Erro ao carregar sessões:", error);
      setSessions([]);
    }
  };

  const loadRecentFiles = async () => {
    try {
      const arquivos = await arquivosAPI.getRecent();
      setRecentFiles(arquivos);
    } catch (error) {
      console.error("Erro ao carregar arquivos recentes:", error);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await arquivosAPI.search(query);
      setSearchResults(results);
      setActiveTab("search");
    } catch (error) {
      console.error("Erro na pesquisa:", error);
    }
  };

  const refreshData = () => {
    loadRecentFiles();
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  };

  const handleFileOpen = async (arquivo) => {
    try {
      await arquivosAPI.updateAccess(arquivo.id);
      await arquivosAPI.download(arquivo.id);
      loadRecentFiles();
    } catch (error) {
      console.error("Erro ao abrir arquivo:", error);
      alert("Erro ao abrir arquivo: " + error.message);
    }
  };

  const handleUploadSuccess = () => {
    loadRecentFiles();
    setShowUploadModal(false);
    setShowMultiUploadModal(false);
  };

  const handleFileEdit = (arquivo) => {
    setEditingFile(arquivo);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    refreshData();
    setShowEditModal(false);
    setEditingFile(null);
  };

  const handleSessionsUpdate = () => {
    loadSessions();
  };

  const handleSessionFilter = async (sessionId) => {
    try {
      const arquivos = await arquivosAPI.getBySession(sessionId);
      setSessionFiles(arquivos);
      setSelectedSessionFilter(sessionId);
      setActiveTab("session");
    } catch (error) {
      console.error("Erro ao carregar arquivos da sessão:", error);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-gray-800 to-slate-900">
      {/* Header */}
      <header className="bg-gray-800/90 backdrop-blur-md shadow-2xl border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">
                  Controle de Documentos Jurídicos
                </h1>
                <p className="text-base text-gray-300 font-medium mt-1">
                  Gerenciamento inteligente de documentos jurídicos
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-2 text-gray-300">
                  <User className="w-5 h-5" />
                  <span className="font-medium">{user.nome}</span>
                  {user.role === "admin" && (
                    <button
                      onClick={() => navigate("/admin")}
                      className="flex items-center space-x-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                      title="Painel Administrativo"
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
              <button
                onClick={() => setShowUploadModal(true)}
                className="btn-secondary flex items-center space-x-3"
              >
                <Upload className="w-5 h-5" />
                <span className="font-semibold">Upload</span>
              </button>

              <button
                onClick={() => setShowMultiUploadModal(true)}
                className="btn-primary flex items-center space-x-3"
              >
                <UploadCloud className="w-5 h-5" />
                <span className="font-semibold">Upload Múltiplo</span>
              </button>

              <button
                onClick={() => setShowSessionsModal(true)}
                className="btn-secondary flex items-center space-x-3"
              >
                <Settings className="w-5 h-5" />
                <span className="font-semibold">Sessões</span>
              </button>

              <button
                onClick={handleLogout}
                className="btn-secondary flex items-center space-x-3"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-semibold">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-6 min-h-0">
          {/* Sidebar - Sessões */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700/50 p-5">
              <h3 className="font-bold text-white mb-6 flex items-center text-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-3">
                  <FolderOpen className="w-5 h-5 text-white" />
                </div>
                Sessões
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedSessionFilter(null);
                    setActiveTab("recent");
                  }}
                  className={`w-full text-left px-5 py-4 rounded-xl font-medium transition-all duration-300 text-base ${
                    selectedSessionFilter === null
                      ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md border border-primary-500"
                      : "hover:bg-gray-700/50 text-gray-300 hover:shadow-sm"
                  }`}
                >
                  📁 Todos os arquivos
                </button>
                {sessions && sessions.length > 0 ? (
                  sessions.map((session) => {
                    const emojis = {
                      Criminal: "⚖️",
                      Cível: "🏢",
                      Trabalhista: "💼",
                      Tributário: "💰",
                      Família: "👨‍👩‍👧‍👦",
                    };
                    return (
                      <button
                        key={session.id}
                        onClick={() => handleSessionFilter(session.id)}
                        className={`w-full text-left px-5 py-4 rounded-xl font-medium transition-all duration-300 text-base ${
                          selectedSessionFilter === session.id
                            ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md border border-primary-500"
                            : "hover:bg-gray-700/50 text-gray-300 hover:shadow-sm"
                        }`}
                      >
                        {emojis[session.nome] || "📄"} {session.nome}
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    Carregando sessões...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search Bar */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700/50 p-6 mb-6">
              <div className="relative">
                <div className="absolute left-5 top-1/2 transform -translate-y-1/2">
                  <Search className="w-6 h-6 text-primary-400" />
                </div>
                <input
                  type="text"
                  placeholder="Pesquisar por nome do arquivo ou palavras-chave..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className="w-full pl-16 pr-6 py-5 bg-transparent border-0 focus:outline-none text-lg font-medium text-white placeholder-gray-400"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-8 h-8 bg-primary-900/50 rounded-lg flex items-center justify-center">
                    <span className="text-primary-300 text-xs font-bold">
                      ⌘K
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700/50">
              <div className="bg-gray-700/50 border-b border-gray-600/50">
                <nav className="flex px-4">
                  <button
                    onClick={() => setActiveTab("search")}
                    className={`tab-button ${
                      activeTab === "search" ? "tab-active" : "tab-inactive"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Search className="w-5 h-5" />
                      <span className="font-semibold text-base">
                        Resultados da Pesquisa
                      </span>
                      {searchResults.length > 0 && (
                        <span className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                          {searchResults.length}
                        </span>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab("recent")}
                    className={`tab-button ${
                      activeTab === "recent" ? "tab-active" : "tab-inactive"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5" />
                      <span className="font-semibold">Arquivos Recentes</span>
                    </div>
                  </button>

                  {selectedSessionFilter && (
                    <button
                      onClick={() => setActiveTab("session")}
                      className={`tab-button ${
                        activeTab === "session"
                          ? "tab-active"
                          : "tab-inactive"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <FolderOpen className="w-5 h-5" />
                        <span className="font-semibold">
                          {
                            sessions.find((s) => s.id === selectedSessionFilter)
                              ?.nome
                          }
                        </span>
                      </div>
                    </button>
                  )}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === "search" && (
                  <SearchTab
                    results={searchResults}
                    query={searchQuery}
                    onDataChange={refreshData}
                    onFileOpen={handleFileOpen}
                    onFileEdit={handleFileEdit}
                  />
                )}

                {activeTab === "recent" && (
                  <RecentTab
                    onDataChange={refreshData}
                    files={recentFiles}
                    onFileOpen={handleFileOpen}
                    onFileEdit={handleFileEdit}
                  />
                )}

                {activeTab === "session" && selectedSessionFilter && (
                  <RecentTab
                    files={sessionFiles}
                    onFileOpen={handleFileOpen}
                    onFileEdit={handleFileEdit}
                    title={`Arquivos da sessão: ${
                      sessions.find((s) => s.id === selectedSessionFilter)?.nome
                    }`}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showUploadModal && (
        <UploadModal
          sessions={sessions}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {showMultiUploadModal && (
        <MultiUploadModal
          sessions={sessions}
          onClose={() => setShowMultiUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {showEditModal && editingFile && (
        <EditFileModal
          arquivo={editingFile}
          sessions={sessions}
          onClose={() => {
            setShowEditModal(false);
            setEditingFile(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {showSessionsModal && (
        <SessionsModal
          sessions={sessions}
          onClose={() => setShowSessionsModal(false)}
          onUpdate={handleSessionsUpdate}
        />
      )}
    </div>
  );
}

export default AppWeb;


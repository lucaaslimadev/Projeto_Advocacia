import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Upload,
  Settings,
  FileText,
  Clock,
  FolderOpen,
  LogOut,
  User,
  Shield,
  Moon,
  Sun,
  Filter,
  Download,
} from "lucide-react";
import SearchTab from "./components/SearchTab";
import RecentTab from "./components/RecentTab";
import UnifiedUploadModal from "./components/UnifiedUploadModal";
import EditFileModal from "./components/EditFileModal";
import SessionsModal from "./components/SessionsModal";
import FileViewer from "./components/FileViewer";
import AdvancedFilters from "./components/AdvancedFilters";
import SortControls from "./components/SortControls";
import Pagination from "./components/Pagination";
import { FileCardSkeleton, SessionButtonSkeleton } from "./components/LoadingSkeleton";
import { useDebounce } from "./hooks/useDebounce";
import { useTheme } from "./hooks/useTheme";
import { showToast } from "./utils/toast";
import { sessoesAPI, arquivosAPI, authAPI } from "./services/api";

function App() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [theme, toggleTheme] = useTheme();
  const [activeTab, setActiveTab] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [searchResults, setSearchResults] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [selectedSessionFilter, setSelectedSessionFilter] = useState(null);
  const [sessionFiles, setSessionFiles] = useState([]);
  const [user, setUser] = useState(null);
  const [viewingFile, setViewingFile] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isLoading, setIsLoading] = useState(false);

  // React Query para sessões
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessoes'],
    queryFn: async () => {
      const sessoes = await sessoesAPI.getAll();
      return sessoes || [];
    },
    staleTime: 0, // Sempre buscar dados frescos
    cacheTime: 0, // Não manter cache
  });

  // React Query para arquivos recentes
  const { data: recentFilesData, isLoading: recentLoading, refetch: refetchRecent } = useQuery({
    queryKey: ['recentFiles'],
    queryFn: async () => {
      const arquivos = await arquivosAPI.getRecent();
      return arquivos || [];
    },
    staleTime: 0, // Sempre buscar dados frescos
    cacheTime: 0, // Não manter cache
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Atualizar sessões quando dados mudarem
  useEffect(() => {
    if (sessionsData) {
      console.log('📁 Sessões carregadas:', sessionsData.length, sessionsData);
      setSessions(sessionsData);
    }
  }, [sessionsData]);

  // Atualizar arquivos recentes quando dados mudarem
  useEffect(() => {
    if (recentFilesData) {
      setRecentFiles(recentFilesData);
    }
  }, [recentFilesData]);

  // Busca com debounce
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      handleSearch(debouncedSearchQuery);
    } else {
      setSearchResults([]);
      setActiveTab("recent");
    }
  }, [debouncedSearchQuery]); // handleSearch é estável, não precisa estar nas deps

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await arquivosAPI.search(query);
      setSearchResults(results);
      setActiveTab("search");
      setCurrentPage(1);
    } catch (error) {
      console.error("Erro na pesquisa:", error);
      showToast.error("Erro ao realizar pesquisa");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    // Invalidar e refetch todas as queries relacionadas
    queryClient.invalidateQueries(['recentFiles']);
    queryClient.invalidateQueries(['sessoes']);
    refetchRecent();
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  };

  // Aplicar filtros
  const handleApplyFilters = (filters) => {
    setAppliedFilters(filters);
    setCurrentPage(1);
    showToast.info("Filtros aplicados");
  };

  const handleClearFilters = () => {
    setAppliedFilters({});
    setCurrentPage(1);
    showToast.info("Filtros removidos");
  };

  // Ordenação
  const handleSortChange = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
  };

  // Filtrar e ordenar resultados (memoizado para performance)
  const filteredResults = useMemo(() => {
    let results = [...searchResults];

    // Aplicar filtros
    if (appliedFilters.sessao) {
      results = results.filter(r => r.sessao_id === parseInt(appliedFilters.sessao));
    }
    if (appliedFilters.cliente) {
      results = results.filter(r => 
        r.cliente?.toLowerCase().includes(appliedFilters.cliente.toLowerCase())
      );
    }
    if (appliedFilters.tagCor) {
      results = results.filter(r => r.tag_cor === appliedFilters.tagCor);
    }
    if (appliedFilters.favorito !== "") {
      results = results.filter(r => r.favorito === (appliedFilters.favorito === "true"));
    }
    if (appliedFilters.dataInicio) {
      results = results.filter(r => {
        const fileDate = new Date(r.created_at);
        return fileDate >= new Date(appliedFilters.dataInicio);
      });
    }
    if (appliedFilters.dataFim) {
      results = results.filter(r => {
        const fileDate = new Date(r.created_at);
        return fileDate <= new Date(appliedFilters.dataFim);
      });
    }

    // Aplicar ordenação
    if (sortBy && sortOrder) {
      results.sort((a, b) => {
        let aVal, bVal;
        switch (sortBy) {
          case "nome":
            aVal = a.nome?.toLowerCase() || "";
            bVal = b.nome?.toLowerCase() || "";
            break;
          case "created_at":
            aVal = new Date(a.created_at);
            bVal = new Date(b.created_at);
            break;
          case "accessed_at":
            aVal = new Date(a.accessed_at);
            bVal = new Date(b.accessed_at);
            break;
          case "tamanho":
            aVal = a.tamanho || 0;
            bVal = b.tamanho || 0;
            break;
          case "cliente":
            aVal = a.cliente?.toLowerCase() || "";
            bVal = b.cliente?.toLowerCase() || "";
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return results;
  }, [searchResults, appliedFilters, sortBy, sortOrder]);

  // Paginação (memoizada)
  const { paginatedResults, totalPages } = useMemo(() => {
    const total = Math.ceil(filteredResults.length / itemsPerPage);
    const paginated = filteredResults.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    return { paginatedResults: paginated, totalPages: total };
  }, [filteredResults, currentPage, itemsPerPage]);

  const handleFileOpen = async (arquivo) => {
    try {
      await arquivosAPI.updateAccess(arquivo.id);
      setViewingFile(arquivo);
      // Invalidar cache para atualizar lista de recentes
      queryClient.invalidateQueries(['recentFiles']);
      refetchRecent();
      showToast.success("Arquivo aberto");
    } catch (error) {
      console.error("Erro ao abrir arquivo:", error);
      showToast.error("Erro ao abrir arquivo: " + error.message);
    }
  };

  const handleFileDownload = async () => {
    if (viewingFile) {
      try {
        await arquivosAPI.download(viewingFile.id);
        showToast.success("Download iniciado");
      } catch (error) {
        console.error("Erro ao fazer download:", error);
        showToast.error("Erro ao fazer download: " + error.message);
      }
    }
  };

  const handleUploadSuccess = () => {
    // Invalidar cache após upload
    queryClient.invalidateQueries(['recentFiles']);
    queryClient.invalidateQueries(['sessoes']);
    refetchRecent();
    setShowUploadModal(false);
    showToast.success("Arquivo(s) enviado(s) com sucesso!");
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  };

  const handleFileEdit = (arquivo) => {
    setEditingFile(arquivo);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    // Invalidar cache após editar
    queryClient.invalidateQueries(['recentFiles']);
    queryClient.invalidateQueries(['sessoes']);
    refreshData();
    setShowEditModal(false);
    setEditingFile(null);
  };

  const handleSessionsUpdate = () => {
    // Invalidar cache de sessões para forçar reload
    queryClient.invalidateQueries(['sessoes']);
    queryClient.refetchQueries(['sessoes']);
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
    showToast.info("Logout realizado");
    navigate("/login");
  };

  // Exportar para CSV
  const handleExportCSV = () => {
    const data = activeTab === "search" && filteredResults.length > 0 
      ? filteredResults 
      : activeTab === "recent" && recentFiles.length > 0
      ? recentFiles
      : [];
    
    if (data.length === 0) {
      showToast.warning("Nenhum arquivo para exportar");
      return;
    }

    const headers = ["Nome", "Cliente", "Sessão", "Palavras-chave", "Data Criação", "Último Acesso", "Tamanho"];
    const rows = data.map(file => [
      file.nome || "",
      file.cliente || "",
      file.sessao_nome || "",
      file.palavras_chave || "",
      new Date(file.created_at).toLocaleDateString("pt-BR"),
      new Date(file.accessed_at).toLocaleDateString("pt-BR"),
      file.tamanho ? `${(file.tamanho / 1024).toFixed(2)} KB` : ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `arquivos_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast.success("Arquivo CSV exportado com sucesso!");
  };

  // Helper para classes de tema
  const themeClasses = {
    bg: theme === 'dark' ? 'bg-gradient-to-br from-slate-800 via-gray-800 to-slate-900' : 'bg-gradient-to-br from-gray-100 via-gray-50 to-white',
    card: theme === 'dark' ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/90 border-gray-200/50',
    text: theme === 'dark' ? 'text-white' : 'text-gray-900',
    textSecondary: theme === 'dark' ? 'text-gray-300' : 'text-gray-600',
    textMuted: theme === 'dark' ? 'text-gray-400' : 'text-gray-500',
    hover: theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100/50',
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses.bg}`}>
      {/* Header */}
      <header className={`backdrop-blur-md shadow-2xl border-b transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-gray-800/90 border-gray-700/50'
          : 'bg-white/90 border-gray-200/50'
      }`}>
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-4xl font-bold transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Controle de Documentos Jurídicos
                </h1>
                <p className={`text-base font-medium mt-1 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Gerenciamento inteligente de documentos jurídicos
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {user && (
                <div className={`flex items-center space-x-2 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <User className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium whitespace-nowrap min-w-0">{user.nome}</span>
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
                onClick={toggleTheme}
                className="btn-secondary flex items-center space-x-2 p-2"
                title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
                aria-label="Alternar tema"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setShowUploadModal(true)}
                className="btn-primary flex items-center space-x-3"
                aria-label="Upload de arquivos"
              >
                <Upload className="w-5 h-5" />
                <span className="font-semibold">Upload</span>
              </button>

              <button
                onClick={() => setShowSessionsModal(true)}
                className="btn-secondary flex items-center space-x-3"
                aria-label="Gerenciar sessões"
              >
                <Settings className="w-5 h-5" />
                <span className="font-semibold">Sessões</span>
              </button>

              <button
                onClick={handleLogout}
                className="btn-secondary flex items-center space-x-3"
                aria-label="Sair"
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
            <div className={`backdrop-blur-sm rounded-xl shadow-xl border p-5 transition-colors duration-300 ${themeClasses.card}`}>
              <h3 className={`font-bold mb-6 flex items-center text-xl transition-colors duration-300 ${themeClasses.text}`}>
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
                      : `${themeClasses.hover} ${themeClasses.textSecondary} hover:shadow-sm`
                  }`}
                >
                  📁 Todos os arquivos
                </button>
                {sessionsLoading ? (
                  <>
                    <SessionButtonSkeleton />
                    <SessionButtonSkeleton />
                    <SessionButtonSkeleton />
                  </>
                ) : sessions && sessions.length > 0 ? (
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
                            : `${themeClasses.hover} ${themeClasses.textSecondary} hover:shadow-sm`
                        }`}
                        aria-label={`Filtrar por sessão ${session.nome}`}
                      >
                        {emojis[session.nome] || "📄"} {session.nome}
                      </button>
                    );
                  })
                ) : (
                  <div className={`text-center py-4 text-sm transition-colors duration-300 ${themeClasses.textMuted}`}>
                    Nenhuma sessão encontrada
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search Bar */}
            <div className={`backdrop-blur-sm rounded-xl shadow-xl border p-6 mb-6 transition-colors duration-300 ${themeClasses.card}`}>
              <div className="relative">
                <div className="absolute left-5 top-1/2 transform -translate-y-1/2">
                  <Search className="w-6 h-6 text-primary-400" />
                </div>
                <input
                  type="text"
                  placeholder="Pesquisar por nome do arquivo ou palavras-chave..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-16 pr-6 py-5 bg-transparent border-0 focus:outline-none text-lg font-medium transition-colors duration-300 ${themeClasses.text} ${theme === 'dark' ? 'placeholder-gray-400' : 'placeholder-gray-500'}`}
                  aria-label="Campo de pesquisa"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  {isLoading && (
                    <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <div className="w-8 h-8 bg-primary-900/50 rounded-lg flex items-center justify-center">
                    <span className="text-primary-300 text-xs font-bold">
                      ⌘K
                    </span>
                  </div>
                </div>
              </div>

              {/* Filtros e Controles */}
              <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      showAdvancedFilters || Object.keys(appliedFilters).some(k => appliedFilters[k])
                        ? "bg-blue-600 text-white"
                        : theme === 'dark' 
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    aria-label="Mostrar filtros avançados"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filtros</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      theme === 'dark'
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    aria-label="Exportar para CSV"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar CSV</span>
                  </button>
                </div>
                {activeTab === "search" && filteredResults.length > 0 && (
                  <SortControls
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSortChange={handleSortChange}
                  />
                )}
              </div>

              {/* Filtros Avançados */}
              {showAdvancedFilters && (
                <div className="mt-4">
                  <AdvancedFilters
                    sessions={sessions}
                    onApplyFilters={handleApplyFilters}
                    onClear={handleClearFilters}
                  />
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className={`backdrop-blur-sm rounded-xl shadow-xl border transition-colors duration-300 ${themeClasses.card}`}>
              <div className={`border-b transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-gray-700/50 border-gray-600/50'
                  : 'bg-gray-100/50 border-gray-200/50'
              }`}>
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
                  <>
                    {isLoading ? (
                      <div className="space-y-4">
                        <FileCardSkeleton />
                        <FileCardSkeleton />
                        <FileCardSkeleton />
                      </div>
                    ) : (
                      <>
                        <SearchTab
                          results={paginatedResults}
                          query={searchQuery}
                          onDataChange={refreshData}
                          onFileOpen={handleFileOpen}
                          onFileEdit={handleFileEdit}
                        />
                        {filteredResults.length > 0 && (
                          <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            itemsPerPage={itemsPerPage}
                            totalItems={filteredResults.length}
                            onItemsPerPageChange={(value) => {
                              setItemsPerPage(value);
                              setCurrentPage(1);
                            }}
                          />
                        )}
                      </>
                    )}
                  </>
                )}

                {activeTab === "recent" && (
                  <>
                    {recentLoading ? (
                      <div className="space-y-4">
                        <FileCardSkeleton />
                        <FileCardSkeleton />
                        <FileCardSkeleton />
                      </div>
                    ) : (
                      <RecentTab
                        onDataChange={refreshData}
                        files={recentFiles}
                        onFileOpen={handleFileOpen}
                        onFileEdit={handleFileEdit}
                      />
                    )}
                  </>
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
        <UnifiedUploadModal
          sessions={sessions}
          onClose={() => setShowUploadModal(false)}
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

      {viewingFile && (
        <FileViewer
          arquivo={viewingFile}
          onClose={() => setViewingFile(null)}
          onDownload={handleFileDownload}
        />
      )}
    </div>
  );
}

export default App;


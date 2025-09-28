import React, { useState, useEffect } from 'react';
import { Search, Upload, Settings, FileText, Clock, FolderOpen, Plus, X, UploadCloud } from 'lucide-react';
import SearchTab from './components/SearchTab';
import RecentTab from './components/RecentTab';
import UploadModal from './components/UploadModal';
import MultiUploadModal from './components/MultiUploadModal';
import EditFileModal from './components/EditFileModal';
import SessionsModal from './components/SessionsModal';

const { ipcRenderer } = window.require('electron');

function App() {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
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

  useEffect(() => {
    loadSessions();
    loadRecentFiles();
  }, []);

  const loadSessions = async () => {
    try {
      const sessoes = await ipcRenderer.invoke('get-sessoes');
      setSessions(sessoes);
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    }
  };

  const loadRecentFiles = async () => {
    try {
      const arquivos = await ipcRenderer.invoke('get-recent-arquivos');
      setRecentFiles(arquivos);
    } catch (error) {
      console.error('Erro ao carregar arquivos recentes:', error);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await ipcRenderer.invoke('search-arquivos', query);
      setSearchResults(results);
      setActiveTab('search');
    } catch (error) {
      console.error('Erro na pesquisa:', error);
    }
  };

  const handleFileOpen = async (arquivo) => {
    try {
      await ipcRenderer.invoke('update-arquivo-access', arquivo.id);
      await ipcRenderer.invoke('open-file', arquivo.caminho);
      loadRecentFiles();
    } catch (error) {
      console.error('Erro ao abrir arquivo:', error);
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
    loadRecentFiles();
    if (searchQuery) {
      handleSearch(searchQuery);
    }
    setShowEditModal(false);
    setEditingFile(null);
  };

  const handleSessionsUpdate = () => {
    loadSessions();
    // Não fechar o modal para permitir múltiplas operações
  };

  const handleSessionFilter = async (sessionId) => {
    try {
      const arquivos = await ipcRenderer.invoke('get-arquivos-by-session', sessionId);
      setSessionFiles(arquivos);
      setSelectedSessionFilter(sessionId);
      setActiveTab('session');
    } catch (error) {
      console.error('Erro ao carregar arquivos da sessão:', error);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-gray-800 to-slate-900">
      {/* Header */}
      <header className="bg-gray-800/90 backdrop-blur-md shadow-2xl border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Controle de Documentos Jurídicos</h1>
                <p className="text-sm text-gray-300 font-medium">Gerenciamento inteligente de documentos jurídicos</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex gap-4 min-h-0">
          {/* Sidebar - Sessões */}
          <div className="w-48 flex-shrink-0">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700/50 p-3">
              <h3 className="font-bold text-white mb-6 flex items-center text-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-3">
                  <FolderOpen className="w-4 h-4 text-white" />
                </div>
                Sessões
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSelectedSessionFilter(null);
                    setActiveTab('recent');
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                    selectedSessionFilter === null
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md border border-primary-500'
                      : 'hover:bg-gray-700/50 text-gray-300 hover:shadow-sm'
                  }`}
                >
                  📁 Todos os arquivos
                </button>
                {sessions.map((session) => {
                  const emojis = {
                    'Criminal': '⚖️',
                    'Cível': '🏢',
                    'Trabalhista': '💼',
                    'Tributário': '💰',
                    'Família': '👨‍👩‍👧‍👦'
                  };
                  return (
                    <button
                      key={session.id}
                      onClick={() => handleSessionFilter(session.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                        selectedSessionFilter === session.id
                          ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md border border-primary-500'
                          : 'hover:bg-gray-700/50 text-gray-300 hover:shadow-sm'
                      }`}
                    >
                      {emojis[session.nome] || '📄'} {session.nome}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search Bar */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700/50 p-4 mb-4">
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
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
                  className="w-full pl-14 pr-6 py-4 bg-transparent border-0 focus:outline-none text-lg font-medium text-white placeholder-gray-400"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-8 h-8 bg-primary-900/50 rounded-lg flex items-center justify-center">
                    <span className="text-primary-300 text-xs font-bold">⌘K</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700/50">
              <div className="bg-gray-700/50 border-b border-gray-600/50">
                <nav className="flex px-2">
                  <button
                    onClick={() => setActiveTab('search')}
                    className={`tab-button ${
                      activeTab === 'search' ? 'tab-active' : 'tab-inactive'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Search className="w-5 h-5" />
                      <span className="font-semibold">Resultados da Pesquisa</span>
                      {searchResults.length > 0 && (
                        <span className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                          {searchResults.length}
                        </span>
                      )}
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('recent')}
                    className={`tab-button ${
                      activeTab === 'recent' ? 'tab-active' : 'tab-inactive'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5" />
                      <span className="font-semibold">Arquivos Recentes</span>
                    </div>
                  </button>

                  {selectedSessionFilter && (
                    <button
                      onClick={() => setActiveTab('session')}
                      className={`tab-button ${
                        activeTab === 'session' ? 'tab-active' : 'tab-inactive'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <FolderOpen className="w-5 h-5" />
                        <span className="font-semibold">{sessions.find(s => s.id === selectedSessionFilter)?.nome}</span>
                      </div>
                    </button>
                  )}
                </nav>
              </div>

              <div className="p-3">
                {activeTab === 'search' && (
                  <SearchTab 
                    results={searchResults} 
                    query={searchQuery}
                    onFileOpen={handleFileOpen}
                    onFileEdit={handleFileEdit}
                  />
                )}
                
                {activeTab === 'recent' && (
                  <RecentTab 
                    files={recentFiles}
                    onFileOpen={handleFileOpen}
                    onFileEdit={handleFileEdit}
                  />
                )}

                {activeTab === 'session' && selectedSessionFilter && (
                  <RecentTab 
                    files={sessionFiles}
                    onFileOpen={handleFileOpen}
                    onFileEdit={handleFileEdit}
                    title={`Arquivos da sessão: ${sessions.find(s => s.id === selectedSessionFilter)?.nome}`}
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

export default App;
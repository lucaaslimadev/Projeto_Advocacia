import React, { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  FolderOpen,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Save,
  Lock,
} from 'lucide-react';
import { adminAPI } from '../services/api';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    role: 'user',
    ativo: true,
  });

  useEffect(() => {
    if (activeTab === 'usuarios') {
      loadUsuarios();
    } else if (activeTab === 'estatisticas') {
      loadEstatisticas();
    }
  }, [activeTab, searchTerm]);

  const loadUsuarios = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getUsuarios({ search: searchTerm });
      setUsuarios(data.usuarios || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      alert('Erro ao carregar usuários: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadEstatisticas = async () => {
    setLoading(true);
    try {
      const stats = await adminAPI.getEstatisticas();
      setEstatisticas(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUsuario = () => {
    setEditingUsuario(null);
    setFormData({
      nome: '',
      email: '',
      senha: '',
      role: 'user',
      ativo: true,
    });
    setShowModal(true);
  };

  const handleEditUsuario = (usuario) => {
    setEditingUsuario(usuario);
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      role: usuario.role,
      ativo: usuario.ativo,
    });
    setShowModal(true);
  };

  const handleSaveUsuario = async () => {
    try {
      if (editingUsuario) {
        await adminAPI.updateUsuario(editingUsuario.id, formData);
        if (formData.senha) {
          await adminAPI.updateSenha(editingUsuario.id, formData.senha);
        }
      } else {
        await adminAPI.createUsuario(formData);
      }
      setShowModal(false);
      loadUsuarios();
    } catch (error) {
      alert('Erro ao salvar usuário: ' + error.message);
    }
  };

  const handleDeleteUsuario = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este usuário?')) {
      return;
    }

    try {
      await adminAPI.deleteUsuario(id);
      loadUsuarios();
    } catch (error) {
      alert('Erro ao deletar usuário: ' + error.message);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-gray-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700/50 p-6 mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Painel Administrativo</h1>
          <p className="text-gray-400">Gerencie usuários e visualize estatísticas</p>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700/50 mb-6">
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`px-6 py-4 font-semibold transition-all ${
                activeTab === 'usuarios'
                  ? 'bg-gray-700/50 text-primary-300 border-b-2 border-primary-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Users className="w-5 h-5 inline mr-2" />
              Usuários
            </button>
            <button
              onClick={() => setActiveTab('estatisticas')}
              className={`px-6 py-4 font-semibold transition-all ${
                activeTab === 'estatisticas'
                  ? 'bg-gray-700/50 text-primary-300 border-b-2 border-primary-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <BarChart3 className="w-5 h-5 inline mr-2" />
              Estatísticas
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'usuarios' && (
              <div>
                {/* Search and Create */}
                <div className="flex items-center justify-between mb-6">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar usuários..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <button
                    onClick={handleCreateUsuario}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Novo Usuário</span>
                  </button>
                </div>

                {/* Users Table */}
                {loading ? (
                  <div className="text-center py-12 text-gray-400">Carregando...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-300 font-semibold">Nome</th>
                          <th className="text-left py-3 px-4 text-gray-300 font-semibold">Email</th>
                          <th className="text-left py-3 px-4 text-gray-300 font-semibold">Role</th>
                          <th className="text-left py-3 px-4 text-gray-300 font-semibold">Status</th>
                          <th className="text-left py-3 px-4 text-gray-300 font-semibold">Criado em</th>
                          <th className="text-right py-3 px-4 text-gray-300 font-semibold">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usuarios.map((usuario) => (
                          <tr key={usuario.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                            <td className="py-3 px-4 text-white">{usuario.nome}</td>
                            <td className="py-3 px-4 text-gray-300">{usuario.email}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  usuario.role === 'admin'
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-blue-500/20 text-blue-400'
                                }`}
                              >
                                {usuario.role}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  usuario.ativo
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-gray-500/20 text-gray-400'
                                }`}
                              >
                                {usuario.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-400 text-sm">
                              {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleEditUsuario(usuario)}
                                  className="p-2 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUsuario(usuario.id)}
                                  className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'estatisticas' && (
              <div>
                {loading ? (
                  <div className="text-center py-12 text-gray-400">Carregando...</div>
                ) : estatisticas ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
                      <div className="flex items-center justify-between mb-4">
                        <Users className="w-8 h-8 text-blue-400" />
                        <span className="text-2xl font-bold text-white">
                          {estatisticas.total_usuarios}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">Total de Usuários</p>
                      <p className="text-green-400 text-xs mt-2">
                        {estatisticas.usuarios_ativos} ativos
                      </p>
                    </div>

                    <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
                      <div className="flex items-center justify-between mb-4">
                        <FileText className="w-8 h-8 text-red-400" />
                        <span className="text-2xl font-bold text-white">
                          {estatisticas.total_arquivos}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">Total de Arquivos</p>
                    </div>

                    <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
                      <div className="flex items-center justify-between mb-4">
                        <FolderOpen className="w-8 h-8 text-green-400" />
                        <span className="text-2xl font-bold text-white">
                          {estatisticas.total_sessoes}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">Total de Sessões</p>
                    </div>

                    <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
                      <div className="flex items-center justify-between mb-4">
                        <BarChart3 className="w-8 h-8 text-yellow-400" />
                        <span className="text-2xl font-bold text-white">
                          {formatBytes(parseInt(estatisticas.tamanho_total_arquivos || 0))}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">Armazenamento Total</p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Usuário */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-4 border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">
                {editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {editingUsuario ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                </label>
                <input
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required={!editingUsuario}
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="rounded border-gray-600 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="ativo" className="text-sm text-gray-300">
                  Usuário ativo
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveUsuario}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Salvar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;


import React, { useState } from 'react';
import { X, Filter, Calendar, User, FolderOpen, Star } from 'lucide-react';

const FilterModal = ({ sessions, onClose, onFilter }) => {
  const [filtros, setFiltros] = useState({
    texto: '',
    cliente: '',
    sessao: '',
    favoritos: false,
    dataInicio: '',
    dataFim: ''
  });

  const handleFilter = () => {
    onFilter(filtros);
    onClose();
  };

  const clearFilters = () => {
    setFiltros({
      texto: '',
      cliente: '',
      sessao: '',
      favoritos: false,
      dataInicio: '',
      dataFim: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtros Avançados
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Texto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar por texto
            </label>
            <input
              type="text"
              value={filtros.texto}
              onChange={(e) => setFiltros({...filtros, texto: e.target.value})}
              className="input-field"
              placeholder="Nome do arquivo ou palavras-chave"
            />
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Cliente
            </label>
            <input
              type="text"
              value={filtros.cliente}
              onChange={(e) => setFiltros({...filtros, cliente: e.target.value})}
              className="input-field"
              placeholder="Nome do cliente"
            />
          </div>

          {/* Sessão */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FolderOpen className="w-4 h-4 inline mr-1" />
              Sessão
            </label>
            <select
              value={filtros.sessao}
              onChange={(e) => setFiltros({...filtros, sessao: e.target.value})}
              className="input-field"
            >
              <option value="">Todas as sessões</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.nome}>
                  {session.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Favoritos */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filtros.favoritos}
                onChange={(e) => setFiltros({...filtros, favoritos: e.target.checked})}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700 flex items-center">
                <Star className="w-4 h-4 mr-1" />
                Apenas favoritos
              </span>
            </label>
          </div>

          {/* Data */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data início
              </label>
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data fim
              </label>
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Limpar filtros
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={handleFilter}
              className="btn-primary"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
import React, { useState } from "react";
import { Filter, X } from "lucide-react";

const AdvancedFilters = ({ sessions, onApplyFilters, onClear }) => {
  const [filters, setFilters] = useState({
    sessao: "",
    cliente: "",
    tagCor: "",
    favorito: "",
    dataInicio: "",
    dataFim: "",
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
  };

  const handleClear = () => {
    setFilters({
      sessao: "",
      cliente: "",
      tagCor: "",
      favorito: "",
      dataInicio: "",
      dataFim: "",
    });
    onClear();
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== "");

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 mb-4 border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Filtros Avançados</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="text-sm text-gray-400 hover:text-white flex items-center space-x-1"
          >
            <X className="w-4 h-4" />
            <span>Limpar</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Sessão */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Sessão
          </label>
          <select
            value={filters.sessao}
            onChange={(e) => handleFilterChange("sessao", e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Cliente */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Cliente
          </label>
          <input
            type="text"
            value={filters.cliente}
            onChange={(e) => handleFilterChange("cliente", e.target.value)}
            placeholder="Nome do cliente"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tag Cor */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tag Colorida
          </label>
          <select
            value={filters.tagCor}
            onChange={(e) => handleFilterChange("tagCor", e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas</option>
            <option value="red">Vermelho</option>
            <option value="blue">Azul</option>
            <option value="green">Verde</option>
            <option value="yellow">Amarelo</option>
            <option value="purple">Roxo</option>
            <option value="pink">Rosa</option>
          </select>
        </div>

        {/* Favorito */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Favorito
          </label>
          <select
            value={filters.favorito}
            onChange={(e) => handleFilterChange("favorito", e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="true">Apenas favoritos</option>
            <option value="false">Apenas não favoritos</option>
          </select>
        </div>

        {/* Data Início */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Data Início
          </label>
          <input
            type="date"
            value={filters.dataInicio}
            onChange={(e) => handleFilterChange("dataInicio", e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Data Fim */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Data Fim
          </label>
          <input
            type="date"
            value={filters.dataFim}
            onChange={(e) => handleFilterChange("dataFim", e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleApply}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Aplicar Filtros
        </button>
      </div>
    </div>
  );
};

export default AdvancedFilters;




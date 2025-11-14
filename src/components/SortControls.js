import React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

const SortControls = ({ sortBy, sortOrder, onSortChange }) => {
  const sortOptions = [
    { value: "nome", label: "Nome" },
    { value: "created_at", label: "Data de Criação" },
    { value: "accessed_at", label: "Último Acesso" },
    { value: "tamanho", label: "Tamanho" },
    { value: "cliente", label: "Cliente" },
  ];

  const handleSort = (field) => {
    if (sortBy === field) {
      // Alternar entre asc, desc, e nenhum
      if (sortOrder === "asc") {
        onSortChange(field, "desc");
      } else if (sortOrder === "desc") {
        onSortChange(null, null);
      } else {
        onSortChange(field, "asc");
      }
    } else {
      onSortChange(field, "asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4 text-blue-400" />
    ) : (
      <ArrowDown className="w-4 h-4 text-blue-400" />
    );
  };

  return (
    <div className="flex items-center space-x-2 flex-wrap gap-2">
      <span className="text-sm text-gray-400">Ordenar por:</span>
      {sortOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => handleSort(option.value)}
          className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
            sortBy === option.value
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          <span>{option.label}</span>
          {getSortIcon(option.value)}
        </button>
      ))}
      {sortBy && (
        <button
          onClick={() => onSortChange(null, null)}
          className="text-sm text-gray-400 hover:text-white"
        >
          Limpar
        </button>
      )}
    </div>
  );
};

export default SortControls;




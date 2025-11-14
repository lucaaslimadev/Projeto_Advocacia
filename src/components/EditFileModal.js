import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, Save, FolderOpen, Tag, User } from "lucide-react";
import { showToast } from "../utils/toast";

const EditFileModal = ({ arquivo, sessions, onClose, onSuccess }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    defaultValues: {
      nome: arquivo?.nome || "",
      sessao_id: arquivo?.sessao_id || "",
      palavras_chave: arquivo?.palavras_chave || "",
      cliente: arquivo?.cliente || "",
      tag_cor: arquivo?.tag_cor || "",
    }
  });

  const [tagCor, setTagCor] = useState(arquivo?.tag_cor || "");

  // Atualizar form quando arquivo mudar
  useEffect(() => {
    if (arquivo) {
      reset({
        nome: arquivo.nome || "",
        sessao_id: arquivo.sessao_id || "",
        palavras_chave: arquivo.palavras_chave || "",
        cliente: arquivo.cliente || "",
        tag_cor: arquivo.tag_cor || "",
      });
      setTagCor(arquivo.tag_cor || "");
    }
  }, [arquivo, reset]);

  const onSubmit = async (data) => {
    if (!arquivo || !arquivo.id) {
      showToast.error("Arquivo inválido");
      return;
    }

    try {
      const { arquivosAPI } = require('../services/api');
      
      const updateData = {
        nome: data.nome.trim(),
        sessao_id: data.sessao_id && data.sessao_id !== '' ? parseInt(data.sessao_id, 10) : null,
        palavras_chave: data.palavras_chave?.trim() || null,
        cliente: data.cliente?.trim() || null,
        tag_cor: tagCor || null,
      };

      console.log('Atualizando arquivo:', arquivo.id, updateData);
      
      await arquivosAPI.update(arquivo.id, updateData);

      showToast.success("Arquivo atualizado com sucesso!");
      onSuccess();
    } catch (error) {
      console.error("Erro ao atualizar arquivo:", error);
      const errorMessage = error.message || "Erro ao atualizar arquivo";
      showToast.error(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Editar Arquivo</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* File Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome do Arquivo *
            </label>
            <input
              type="text"
              {...register("nome", { required: "Nome é obrigatório", minLength: { value: 1, message: "Nome não pode estar vazio" } })}
              className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.nome ? "border-red-500" : "border-gray-600"
              }`}
              placeholder="Digite o nome do arquivo"
              aria-invalid={errors.nome ? "true" : "false"}
            />
            {errors.nome && (
              <p className="text-red-400 text-xs mt-1">{errors.nome.message}</p>
            )}
          </div>

          {/* Session */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <FolderOpen className="w-4 h-4 inline mr-1" />
              Sessão
            </label>
            <select
              {...register("sessao_id")}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sem sessão</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Palavras-chave
            </label>
            <textarea
              {...register("palavras_chave")}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="3"
              placeholder="Digite palavras-chave separadas por vírgula"
            />
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Cliente
            </label>
            <input
              type="text"
              {...register("cliente")}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nome do cliente"
            />
          </div>

          {/* Tag Colorida */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tag Colorida
            </label>
            <div className="flex space-x-2">
              {["red", "blue", "green", "yellow", "purple", "pink"].map(
                (cor) => (
                  <button
                    key={cor}
                    type="button"
                    onClick={() => setTagCor(tagCor === cor ? "" : cor)}
                    className={`w-6 h-6 rounded-full border-2 transition-colors duration-200 ${
                      tagCor === cor
                        ? "border-white ring-2 ring-blue-400"
                        : "border-gray-500 hover:border-gray-300"
                    } ${
                      cor === "red"
                        ? "bg-red-500 hover:bg-red-400"
                        : cor === "blue"
                        ? "bg-blue-500 hover:bg-blue-400"
                        : cor === "green"
                        ? "bg-green-500 hover:bg-green-400"
                        : cor === "yellow"
                        ? "bg-yellow-500 hover:bg-yellow-400"
                        : cor === "purple"
                        ? "bg-purple-500 hover:bg-purple-400"
                        : "bg-pink-500 hover:bg-pink-400"
                    }`}
                  />
                )
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors duration-200"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? "Salvando..." : "Salvar"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditFileModal;

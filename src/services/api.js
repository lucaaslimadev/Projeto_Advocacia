const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Helper para fazer requisições autenticadas
const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    ...options,
    headers: {
      // Não definir Content-Type para FormData (será definido automaticamente)
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${url}`, config);
  
  if (response.status === 401) {
    // Token expirado ou inválido
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro na requisição' }));
    throw new Error(error.error || 'Erro na requisição');
  }

  return response.json();
};

// Auth
export const authAPI = {
  login: async (email, senha) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao fazer login');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  register: async (nome, email, senha) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao registrar');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  getMe: async () => {
    return authFetch('/auth/me');
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// Sessões
export const sessoesAPI = {
  getAll: async () => {
    try {
      const result = await authFetch('/sessoes');
      console.log('API sessoes getAll result:', result);
      return result;
    } catch (error) {
      console.error('Erro ao buscar sessões:', error);
      throw error;
    }
  },
  create: (nome) => authFetch('/sessoes', {
    method: 'POST',
    body: JSON.stringify({ nome }),
  }),
  delete: (id) => authFetch(`/sessoes/${id}`, { method: 'DELETE' }),
};

// Arquivos
export const arquivosAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return authFetch(`/arquivos?${query}`);
  },

  getRecent: () => authFetch('/arquivos/recentes'),

  getBySession: (sessaoId) => authFetch(`/arquivos/sessao/${sessaoId}`),

  search: (query) => authFetch(`/arquivos?search=${encodeURIComponent(query)}`),

  upload: async (formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/arquivos/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao fazer upload');
    }

    return response.json();
  },

  uploadMultiple: async (formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/arquivos/upload-multiple`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao fazer upload múltiplo');
    }

    return response.json();
  },

  update: (id, dados) => authFetch(`/arquivos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  }),

  delete: (id) => authFetch(`/arquivos/${id}`, { method: 'DELETE' }),

  updateAccess: (id) => authFetch(`/arquivos/${id}/access`, { method: 'PATCH' }),

  toggleFavorito: (id) => authFetch(`/arquivos/${id}/favorito`, { method: 'PATCH' }),

  updateNotas: (id, notas) => authFetch(`/arquivos/${id}/notas`, {
    method: 'PATCH',
    body: JSON.stringify({ notas }),
  }),

  download: async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/arquivos/${id}/download`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Erro ao fazer download' }));
        throw new Error(error.error || 'Erro ao fazer download');
      }

      // Obter o nome do arquivo do header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'arquivo';
      if (contentDisposition) {
        // Tenta extrair o filename do header
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
        }
      }

      // Criar blob e fazer download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Limpar após um tempo
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      throw error;
    }
  },
};

// Admin
export const adminAPI = {
  getUsuarios: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return authFetch(`/admin/usuarios?${query}`);
  },

  getUsuario: (id) => authFetch(`/admin/usuarios/${id}`),

  createUsuario: (dados) => authFetch('/admin/usuarios', {
    method: 'POST',
    body: JSON.stringify(dados),
  }),

  updateUsuario: (id, dados) => authFetch(`/admin/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  }),

  updateSenha: (id, senha) => authFetch(`/admin/usuarios/${id}/senha`, {
    method: 'PATCH',
    body: JSON.stringify({ senha }),
  }),

  deleteUsuario: (id) => authFetch(`/admin/usuarios/${id}`, { method: 'DELETE' }),

  getEstatisticas: () => authFetch('/admin/estatisticas'),
};

export default {
  auth: authAPI,
  sessoes: sessoesAPI,
  arquivos: arquivosAPI,
  admin: adminAPI,
};


const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas requerem autenticação e permissão de admin
router.use(authenticate);
router.use(requireAdmin);

// Listar todos os usuários
router.get('/usuarios', async (req, res) => {
  try {
    const { search, ativo, role, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT id, nome, email, role, ativo, created_at, updated_at FROM usuarios WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (nome ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (ativo !== undefined) {
      paramCount++;
      query += ` AND ativo = $${paramCount}`;
      params.push(ativo === 'true');
    }

    if (role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      params.push(role);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Contar total
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM').replace(/ORDER BY.*$/, '');
    const countResult = await pool.query(countQuery, params.slice(0, -2));

    res.json({
      usuarios: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// Obter detalhes de um usuário
router.get('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT u.id, u.nome, u.email, u.role, u.ativo, u.created_at, u.updated_at,
              COUNT(DISTINCT a.id) as total_arquivos,
              COUNT(DISTINCT s.id) as total_sessoes
       FROM usuarios u
       LEFT JOIN arquivos a ON a.usuario_id = u.id
       LEFT JOIN sessoes s ON s.usuario_id = u.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// Criar usuário
router.post('/usuarios', [
  body('nome').trim().isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres'),
  body('email').isEmail().withMessage('Email inválido'),
  body('senha').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('role').optional().isIn(['admin', 'user']).withMessage('Role deve ser admin ou user'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nome, email, senha, role = 'user' } = req.body;

    // Verificar se email já existe
    const existingUser = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Criar usuário
    const result = await pool.query(
      'INSERT INTO usuarios (nome, email, senha, role) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, role, ativo, created_at',
      [nome, email, hashedPassword, role]
    );

    // Criar sessões padrão
    const sessoesPadrao = ['Criminal', 'Cível', 'Trabalhista', 'Tributário', 'Família'];
    for (const sessaoNome of sessoesPadrao) {
      await pool.query(
        'INSERT INTO sessoes (nome, usuario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [sessaoNome, result.rows[0].id]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Atualizar usuário
router.put('/usuarios/:id', [
  body('nome').optional().trim().isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres'),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('role').optional().isIn(['admin', 'user']).withMessage('Role deve ser admin ou user'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { nome, email, role, ativo } = req.body;

    // Verificar se usuário existe
    const existingUser = await pool.query('SELECT id FROM usuarios WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se email já está em uso por outro usuário
    if (email) {
      const emailCheck = await pool.query(
        'SELECT id FROM usuarios WHERE email = $1 AND id != $2',
        [email, id]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email já está em uso' });
      }
    }

    // Construir query dinamicamente
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (nome) {
      paramCount++;
      updates.push(`nome = $${paramCount}`);
      params.push(nome);
    }

    if (email) {
      paramCount++;
      updates.push(`email = $${paramCount}`);
      params.push(email);
    }

    if (role) {
      paramCount++;
      updates.push(`role = $${paramCount}`);
      params.push(role);
    }

    if (ativo !== undefined) {
      paramCount++;
      updates.push(`ativo = $${paramCount}`);
      params.push(ativo);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    paramCount++;
    params.push(id);

    const result = await pool.query(
      `UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${paramCount} 
       RETURNING id, nome, email, role, ativo, updated_at`,
      params
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Atualizar senha do usuário
router.patch('/usuarios/:id/senha', [
  body('senha').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { senha } = req.body;

    const hashedPassword = await bcrypt.hash(senha, 10);

    await pool.query(
      'UPDATE usuarios SET senha = $1 WHERE id = $2',
      [hashedPassword, id]
    );

    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ error: 'Erro ao atualizar senha' });
  }
});

// Deletar usuário
router.delete('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Não permitir deletar a si mesmo
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Você não pode deletar sua própria conta' });
    }

    const result = await pool.query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

// Estatísticas gerais
router.get('/estatisticas', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM usuarios) as total_usuarios,
        (SELECT COUNT(*) FROM usuarios WHERE ativo = true) as usuarios_ativos,
        (SELECT COUNT(*) FROM arquivos) as total_arquivos,
        (SELECT COUNT(*) FROM sessoes) as total_sessoes,
        (SELECT SUM(tamanho) FROM arquivos) as tamanho_total_arquivos
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

module.exports = router;


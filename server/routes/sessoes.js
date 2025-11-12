const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Listar sessões do usuário
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM sessoes 
       WHERE usuario_id = $1 OR usuario_id IS NULL 
       ORDER BY nome`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar sessões:', error);
    res.status(500).json({ error: 'Erro ao buscar sessões' });
  }
});

// Criar sessão
router.post('/', [
  body('nome').trim().isLength({ min: 1 }).withMessage('Nome é obrigatório'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nome } = req.body;
    const nomeTrimmed = nome.trim();

    // Verificar se já existe uma sessão com este nome para este usuário específico
    const existing = await pool.query(
      'SELECT id FROM sessoes WHERE nome = $1 AND usuario_id = $2',
      [nomeTrimmed, req.user.id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Você já possui uma sessão com este nome' });
    }

    // Permitir criar mesmo nome de sessão global (usuario_id IS NULL)
    // O índice único garante que não haverá duplicatas para o mesmo usuário
    const result = await pool.query(
      'INSERT INTO sessoes (nome, usuario_id) VALUES ($1, $2) RETURNING *',
      [nomeTrimmed, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar sessão:', error);
    console.error('Stack:', error.stack);
    
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ 
        error: 'Sessão com este nome já existe para você',
        code: 'DUPLICATE_SESSION'
      });
    }
    
    res.status(500).json({ 
      error: 'Erro ao criar sessão',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Deletar sessão
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a sessão pertence ao usuário ou é global
    const sessao = await pool.query(
      'SELECT * FROM sessoes WHERE id = $1',
      [id]
    );

    if (sessao.rows.length === 0) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    // Só pode deletar sessões próprias (não globais)
    if (sessao.rows[0].usuario_id !== req.user.id) {
      return res.status(403).json({ error: 'Você não tem permissão para deletar esta sessão' });
    }

    await pool.query('DELETE FROM sessoes WHERE id = $1', [id]);
    res.json({ message: 'Sessão deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar sessão:', error);
    res.status(500).json({ error: 'Erro ao deletar sessão' });
  }
});

module.exports = router;


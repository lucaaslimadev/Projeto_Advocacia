const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Listar sessões do usuário
router.get('/', async (req, res) => {
  let client;
  try {
    // Usar cliente do pool para melhor controle
    client = await pool.connect();
    
    const result = await client.query(
      `SELECT * FROM sessoes 
       WHERE usuario_id = $1 OR usuario_id IS NULL 
       ORDER BY usuario_id NULLS FIRST, nome`,
      [req.user.id]
    );
    
    console.log(`📁 Sessões carregadas para usuário ${req.user.id}: ${result.rows.length}`);
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar sessões:', error);
    console.error('Stack:', error.stack);
    console.error('Código do erro:', error.code);
    
    // Se for erro de conexão, tentar novamente
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      res.status(503).json({ error: 'Serviço temporariamente indisponível. Tente novamente.' });
    } else {
      res.status(500).json({ error: 'Erro ao buscar sessões' });
    }
  } finally {
    if (client) {
      client.release();
    }
  }
});

// Criar sessão
router.post('/', [
  body('nome').trim().isLength({ min: 1 }).withMessage('Nome é obrigatório'),
], async (req, res) => {
  const client = await pool.connect();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nome } = req.body;
    const nomeTrimmed = nome.trim();

    await client.query('BEGIN');

    // Verificar se já existe uma sessão com este nome para este usuário específico
    const existing = await client.query(
      'SELECT id FROM sessoes WHERE nome = $1 AND usuario_id = $2',
      [nomeTrimmed, req.user.id]
    );

    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      console.log(`⚠️  Tentativa de criar sessão duplicada "${nomeTrimmed}" para usuário ${req.user.id}`);
      return res.status(400).json({ error: 'Você já possui uma sessão com este nome' });
    }

    // Permitir criar mesmo nome de sessão global (usuario_id IS NULL)
    // O índice único garante que não haverá duplicatas para o mesmo usuário
    const result = await client.query(
      'INSERT INTO sessoes (nome, usuario_id) VALUES ($1, $2) RETURNING *',
      [nomeTrimmed, req.user.id]
    );

    await client.query('COMMIT');

    console.log(`✅ Sessão "${nomeTrimmed}" criada com sucesso (ID: ${result.rows[0].id}) para usuário ${req.user.id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {}); // Ignorar erro se já fechou
    console.error('❌ Erro ao criar sessão:', error);
    console.error('Stack:', error.stack);
    console.error('Código:', error.code);
    
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ 
        error: 'Sessão com este nome já existe para você',
        code: 'DUPLICATE_SESSION'
      });
    }
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({ error: 'Serviço temporariamente indisponível. Tente novamente.' });
    }
    
    res.status(500).json({ 
      error: 'Erro ao criar sessão',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
});

// Deletar sessão
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const sessionId = parseInt(id, 10);

    if (isNaN(sessionId)) {
      return res.status(400).json({ error: 'ID de sessão inválido' });
    }

    console.log(`🗑️  Tentativa de deletar sessão ID: ${sessionId} pelo usuário ${req.user.id}`);

    await client.query('BEGIN');

    // Verificar se a sessão existe e pertence ao usuário
    const sessao = await client.query(
      'SELECT id, nome, usuario_id FROM sessoes WHERE id = $1',
      [sessionId]
    );

    if (sessao.rows.length === 0) {
      await client.query('ROLLBACK');
      console.log(`❌ Sessão ${sessionId} não encontrada`);
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    const sessaoData = sessao.rows[0];

    // Verificar se é sessão global
    if (sessaoData.usuario_id === null) {
      await client.query('ROLLBACK');
      console.log(`❌ Tentativa de deletar sessão global "${sessaoData.nome}" (ID: ${sessionId})`);
      return res.status(403).json({ error: 'Não é possível deletar sessões globais' });
    }

    // Verificar se pertence ao usuário
    if (sessaoData.usuario_id !== req.user.id) {
      await client.query('ROLLBACK');
      console.log(`❌ Usuário ${req.user.id} tentou deletar sessão do usuário ${sessaoData.usuario_id}`);
      return res.status(403).json({ error: 'Você não tem permissão para deletar esta sessão' });
    }

    // Verificar arquivos associados (apenas para log)
    const arquivosCount = await client.query(
      'SELECT COUNT(*) as count FROM arquivos WHERE sessao_id = $1',
      [sessionId]
    );
    const count = parseInt(arquivosCount.rows[0].count);
    if (count > 0) {
      console.log(`⚠️  Sessão "${sessaoData.nome}" tem ${count} arquivo(s) associado(s) - serão mantidos`);
    }

    // Deletar sessão
    await client.query('DELETE FROM sessoes WHERE id = $1', [sessionId]);
    await client.query('COMMIT');

    console.log(`✅ Sessão "${sessaoData.nome}" (ID: ${sessionId}) deletada com sucesso pelo usuário ${req.user.id}`);
    res.json({ message: 'Sessão deletada com sucesso' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {}); // Ignorar erro se já fechou
    console.error('❌ Erro ao deletar sessão:', error);
    console.error('Stack:', error.stack);
    console.error('Código:', error.code);
    
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ error: 'Não é possível deletar esta sessão pois há dependências' });
    }
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({ error: 'Serviço temporariamente indisponível. Tente novamente.' });
    }
    
    res.status(500).json({ error: 'Erro ao deletar sessão', details: process.env.NODE_ENV === 'development' ? error.message : undefined });
  } finally {
    client.release();
  }
});

module.exports = router;


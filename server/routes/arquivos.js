const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Configurar multer para upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Apenas PDF, DOC, DOCX, TXT.'));
    }
  },
});

// Todas as rotas requerem autenticação
router.use(authenticate);

// Listar arquivos do usuário
router.get('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { search, sessao_id, favoritos, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT a.*, s.nome as sessao_nome 
      FROM arquivos a 
      LEFT JOIN sessoes s ON a.sessao_id = s.id 
      WHERE a.usuario_id = $1
    `;
    const params = [req.user.id];
    let paramCount = 1;

    if (search) {
      paramCount++;
      query += ` AND (a.nome ILIKE $${paramCount} OR a.palavras_chave ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (sessao_id) {
      paramCount++;
      query += ` AND a.sessao_id = $${paramCount}`;
      params.push(sessao_id);
    }

    if (favoritos === 'true') {
      query += ` AND a.favorito = true`;
    }

    query += ` ORDER BY a.accessed_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await client.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar arquivos:', error);
    console.error('Código:', error.code);
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === '57P01') {
      res.status(503).json({ error: 'Serviço temporariamente indisponível. Tente novamente.' });
    } else {
      res.status(500).json({ error: 'Erro ao buscar arquivos' });
    }
  } finally {
    client.release();
  }
});

// Buscar arquivos recentes
router.get('/recentes', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT a.*, s.nome as sessao_nome 
       FROM arquivos a 
       LEFT JOIN sessoes s ON a.sessao_id = s.id 
       WHERE a.usuario_id = $1 
       ORDER BY a.accessed_at DESC 
       LIMIT 20`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar arquivos recentes:', error);
    console.error('Código:', error.code);
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === '57P01') {
      res.status(503).json({ error: 'Serviço temporariamente indisponível. Tente novamente.' });
    } else {
      res.status(500).json({ error: 'Erro ao buscar arquivos recentes' });
    }
  } finally {
    client.release();
  }
});

// Buscar arquivos por sessão
router.get('/sessao/:sessaoId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { sessaoId } = req.params;
    const result = await client.query(
      `SELECT a.*, s.nome as sessao_nome 
       FROM arquivos a 
       LEFT JOIN sessoes s ON a.sessao_id = s.id 
       WHERE a.usuario_id = $1 AND a.sessao_id = $2 
       ORDER BY a.accessed_at DESC`,
      [req.user.id, sessaoId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar arquivos da sessão:', error);
    console.error('Código:', error.code);
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === '57P01') {
      res.status(503).json({ error: 'Serviço temporariamente indisponível. Tente novamente.' });
    } else {
      res.status(500).json({ error: 'Erro ao buscar arquivos da sessão' });
    }
  } finally {
    client.release();
  }
});

// Upload de arquivo único
router.post('/upload', upload.single('arquivo'), [
  body('nome').trim().isLength({ min: 1 }).withMessage('Nome é obrigatório'),
], async (req, res) => {
  const client = await pool.connect();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo não fornecido' });
    }

    // Parse dos dados do formulário
    const nome = req.body.nome;
    const sessao_id = req.body.sessao_id ? parseInt(req.body.sessao_id, 10) : null;
    const palavras_chave = req.body.palavras_chave || null;
    const cliente = req.body.cliente || null;
    const tag_cor = req.body.tag_cor || null;
    const data_criacao = req.body.data_criacao || new Date().toISOString().split('T')[0];

    console.log('Upload recebido:', {
      nome,
      sessao_id,
      arquivo: req.file?.originalname,
      tamanho: req.file?.size,
    });

    // Salvar caminho absoluto no banco
    const caminhoAbsoluto = path.resolve(req.file.path);
    
    await client.query('BEGIN');
    
    const result = await client.query(
      `INSERT INTO arquivos 
       (nome, caminho, nome_original, tamanho, tipo_mime, sessao_id, usuario_id, palavras_chave, cliente, tag_cor, data_criacao) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *, (SELECT nome FROM sessoes WHERE id = sessao_id) as sessao_nome`,
      [
        nome,
        caminhoAbsoluto,
        req.file.originalname,
        req.file.size,
        req.file.mimetype,
        sessao_id,
        req.user.id,
        palavras_chave || null,
        cliente || null,
        tag_cor || null,
        data_criacao || new Date().toISOString().split('T')[0],
      ]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('❌ Erro ao fazer upload:', error);
    console.error('Código:', error.code);
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === '57P01') {
      res.status(503).json({ error: 'Serviço temporariamente indisponível. Tente novamente.' });
    } else {
      res.status(500).json({ 
        error: 'Erro ao fazer upload',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } finally {
    client.release();
  }
});

// Upload múltiplo
router.post('/upload-multiple', upload.array('arquivos', 10), async (req, res) => {
  const client = await pool.connect();
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo fornecido' });
    }

    // Parse dos dados dos arquivos (enviados como string JSON)
    let arquivosData = [];
    try {
      if (req.body.arquivosData) {
        arquivosData = JSON.parse(req.body.arquivosData);
      }
    } catch (e) {
      // Se não conseguir parsear, criar array vazio
      arquivosData = [];
    }

    await client.query('BEGIN');
    const uploadedFiles = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const fileData = arquivosData[i] || {};
      
      // Salvar caminho absoluto no banco
      const caminhoAbsoluto = path.resolve(file.path);

      const result = await client.query(
        `INSERT INTO arquivos 
         (nome, caminho, nome_original, tamanho, tipo_mime, sessao_id, usuario_id, palavras_chave, cliente, tag_cor, data_criacao) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
         RETURNING *, (SELECT nome FROM sessoes WHERE id = sessao_id) as sessao_nome`,
        [
          fileData.nome || path.parse(file.originalname).name,
          caminhoAbsoluto,
          file.originalname,
          file.size,
          file.mimetype,
          fileData.sessao_id ? parseInt(fileData.sessao_id, 10) : null,
          req.user.id,
          fileData.palavras_chave || null,
          fileData.cliente || null,
          fileData.tag_cor || null,
          fileData.data_criacao || new Date().toISOString().split('T')[0],
        ]
      );

      uploadedFiles.push(result.rows[0]);
    }

    await client.query('COMMIT');
    res.status(201).json({ arquivos: uploadedFiles });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    // Limpar arquivos em caso de erro
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    console.error('❌ Erro ao fazer upload múltiplo:', error);
    console.error('Código:', error.code);
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === '57P01') {
      res.status(503).json({ error: 'Serviço temporariamente indisponível. Tente novamente.' });
    } else {
      res.status(500).json({ error: 'Erro ao fazer upload múltiplo' });
    }
  } finally {
    client.release();
  }
});

// Atualizar arquivo
router.put('/:id', [
  body('nome').trim().isLength({ min: 1 }).withMessage('Nome é obrigatório'),
], async (req, res) => {
  const client = await pool.connect();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const fileId = parseInt(id, 10);
    
    if (isNaN(fileId)) {
      return res.status(400).json({ error: 'ID de arquivo inválido' });
    }

    const { nome, sessao_id, palavras_chave, cliente, tag_cor } = req.body;

    console.log(`📝 Tentativa de atualizar arquivo ID: ${fileId} pelo usuário ${req.user.id}`);
    console.log(`   Dados:`, { nome, sessao_id, palavras_chave, cliente, tag_cor });

    await client.query('BEGIN');

    // Verificar se o arquivo pertence ao usuário
    const arquivo = await client.query(
      'SELECT * FROM arquivos WHERE id = $1 AND usuario_id = $2',
      [fileId, req.user.id]
    );

    if (arquivo.rows.length === 0) {
      await client.query('ROLLBACK');
      console.log(`❌ Arquivo ${fileId} não encontrado ou não pertence ao usuário ${req.user.id}`);
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const result = await client.query(
      `UPDATE arquivos 
       SET nome = $1, sessao_id = $2, palavras_chave = $3, cliente = $4, tag_cor = $5 
       WHERE id = $6 AND usuario_id = $7 
       RETURNING *, (SELECT nome FROM sessoes WHERE id = sessao_id) as sessao_nome`,
      [
        nome.trim(), 
        sessao_id ? parseInt(sessao_id, 10) : null, 
        palavras_chave ? palavras_chave.trim() : null, 
        cliente ? cliente.trim() : null, 
        tag_cor || null, 
        fileId, 
        req.user.id
      ]
    );

    await client.query('COMMIT');

    console.log(`✅ Arquivo ${fileId} atualizado com sucesso`);
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Erro ao atualizar arquivo:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao atualizar arquivo',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
});

// Atualizar último acesso
router.patch('/:id/access', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query(
      'UPDATE arquivos SET accessed_at = CURRENT_TIMESTAMP WHERE id = $1 AND usuario_id = $2',
      [id, req.user.id]
    );
    res.json({ message: 'Acesso atualizado' });
  } catch (error) {
    console.error('❌ Erro ao atualizar acesso:', error);
    console.error('Código:', error.code);
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === '57P01') {
      res.status(503).json({ error: 'Serviço temporariamente indisponível. Tente novamente.' });
    } else {
      res.status(500).json({ error: 'Erro ao atualizar acesso' });
    }
  } finally {
    client.release();
  }
});

// Toggle favorito
router.patch('/:id/favorito', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const result = await client.query(
      `UPDATE arquivos 
       SET favorito = NOT favorito 
       WHERE id = $1 AND usuario_id = $2 
       RETURNING favorito`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    res.json({ favorito: result.rows[0].favorito });
  } catch (error) {
    console.error('❌ Erro ao favoritar arquivo:', error);
    console.error('Código:', error.code);
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === '57P01') {
      res.status(503).json({ error: 'Serviço temporariamente indisponível. Tente novamente.' });
    } else {
      res.status(500).json({ error: 'Erro ao favoritar arquivo' });
    }
  } finally {
    client.release();
  }
});

// Atualizar notas
router.patch('/:id/notas', [
  body('notas').optional(),
], async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { notas } = req.body;

    const result = await client.query(
      'UPDATE arquivos SET notas = $1 WHERE id = $2 AND usuario_id = $3 RETURNING notas',
      [notas || null, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    res.json({ notas: result.rows[0].notas });
  } catch (error) {
    console.error('❌ Erro ao atualizar notas:', error);
    console.error('Código:', error.code);
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === '57P01') {
      res.status(503).json({ error: 'Serviço temporariamente indisponível. Tente novamente.' });
    } else {
      res.status(500).json({ error: 'Erro ao atualizar notas' });
    }
  } finally {
    client.release();
  }
});

// Deletar arquivo
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const fileId = parseInt(id, 10);

    if (isNaN(fileId)) {
      return res.status(400).json({ error: 'ID de arquivo inválido' });
    }

    console.log(`🗑️  Tentativa de deletar arquivo ID: ${fileId} pelo usuário ${req.user.id}`);

    await client.query('BEGIN');

    // Buscar arquivo
    const arquivo = await client.query(
      'SELECT caminho, nome FROM arquivos WHERE id = $1 AND usuario_id = $2',
      [fileId, req.user.id]
    );

    if (arquivo.rows.length === 0) {
      await client.query('ROLLBACK');
      console.log(`❌ Arquivo ${fileId} não encontrado ou não pertence ao usuário ${req.user.id}`);
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const filePath = arquivo.rows[0].caminho;
    const fileName = arquivo.rows[0].nome;

    // Deletar arquivo físico
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`   📁 Arquivo físico deletado: ${filePath}`);
      } catch (fileError) {
        console.warn(`   ⚠️  Erro ao deletar arquivo físico: ${fileError.message}`);
        // Continuar mesmo se não conseguir deletar o arquivo físico
      }
    } else {
      console.warn(`   ⚠️  Arquivo físico não encontrado: ${filePath}`);
    }

    // Deletar do banco
    await client.query('DELETE FROM arquivos WHERE id = $1 AND usuario_id = $2', [fileId, req.user.id]);
    await client.query('COMMIT');

    console.log(`✅ Arquivo "${fileName}" (ID: ${fileId}) deletado com sucesso`);
    res.json({ message: 'Arquivo deletado com sucesso' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Erro ao deletar arquivo:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao deletar arquivo',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
});

// Visualizar arquivo (sem download)
router.get('/:id/view', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    const result = await client.query(
      'SELECT caminho, nome_original, tipo_mime FROM arquivos WHERE id = $1 AND usuario_id = $2',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const { caminho, nome_original, tipo_mime } = result.rows[0];
    
    // Resolver caminho absoluto se necessário
    const caminhoAbsoluto = path.isAbsolute(caminho) ? caminho : path.join(__dirname, '..', caminho);

    if (!fs.existsSync(caminhoAbsoluto)) {
      return res.status(404).json({ error: 'Arquivo físico não encontrado' });
    }

    // Atualizar último acesso
    await client.query(
      'UPDATE arquivos SET accessed_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    // Detectar tipo MIME baseado na extensão
    const ext = path.extname(nome_original).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
    };
    const contentType = tipo_mime || mimeTypes[ext] || 'application/octet-stream';

    // Headers para visualização (sem Content-Disposition: attachment)
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Type');
    
    // Para PDFs e textos, permitir visualização inline
    if (ext === '.pdf' || ext === '.txt') {
      res.setHeader('Content-Disposition', `inline; filename="${nome_original}"`);
    } else {
      // Para DOC/DOCX, ainda forçar download (não podem ser visualizados diretamente)
      const encodedFilename = encodeURIComponent(nome_original);
      res.setHeader('Content-Disposition', `attachment; filename="${nome_original}"; filename*=UTF-8''${encodedFilename}`);
    }

    // Enviar arquivo
    res.sendFile(caminhoAbsoluto, (err) => {
      if (err) {
        console.error('Erro ao visualizar arquivo:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Erro ao visualizar arquivo' });
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro ao visualizar arquivo:', error);
    console.error('Código:', error.code);
    if (!res.headersSent) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === '57P01') {
        res.status(503).json({ error: 'Serviço temporariamente indisponível. Tente novamente.' });
      } else {
        res.status(500).json({ error: 'Erro ao visualizar arquivo' });
      }
    }
  } finally {
    client.release();
  }
});

// Download arquivo
router.get('/:id/download', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    const result = await client.query(
      'SELECT caminho, nome_original FROM arquivos WHERE id = $1 AND usuario_id = $2',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const { caminho, nome_original } = result.rows[0];
    
    // Resolver caminho absoluto se necessário
    const caminhoAbsoluto = path.isAbsolute(caminho) ? caminho : path.join(__dirname, '..', caminho);

    if (!fs.existsSync(caminhoAbsoluto)) {
      console.error('Arquivo físico não encontrado:', caminhoAbsoluto);
      console.error('Caminho original no banco:', caminho);
      return res.status(404).json({ error: 'Arquivo físico não encontrado' });
    }

    // Atualizar último acesso
    await client.query(
      'UPDATE arquivos SET accessed_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    // Detectar tipo MIME baseado na extensão
    const ext = path.extname(nome_original).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // Configurar headers para download (suporta caracteres especiais)
    const encodedFilename = encodeURIComponent(nome_original);
    res.setHeader('Content-Disposition', `attachment; filename="${nome_original}"; filename*=UTF-8''${encodedFilename}`);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    // Enviar arquivo
    res.sendFile(caminhoAbsoluto, (err) => {
      if (err) {
        console.error('Erro ao enviar arquivo:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Erro ao enviar arquivo' });
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro ao fazer download:', error);
    console.error('Código:', error.code);
    if (!res.headersSent) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === '57P01') {
        res.status(503).json({ error: 'Serviço temporariamente indisponível. Tente novamente.' });
      } else {
        res.status(500).json({ error: 'Erro ao fazer download' });
      }
    }
  } finally {
    client.release();
  }
});

module.exports = router;


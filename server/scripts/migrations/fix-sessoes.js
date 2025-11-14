/**
 * Script para corrigir sessões duplicadas no banco de dados
 * Execute: node server/scripts/fix-sessoes.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');

// Criar pool próprio para o script (não usar o pool compartilhado)
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'advocacia_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function fixSessoes() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Iniciando correção de sessões duplicadas...');
    
    await client.query('BEGIN');

    // 1. Remover constraint UNIQUE do nome se existir
    try {
      await client.query('ALTER TABLE sessoes DROP CONSTRAINT IF EXISTS sessoes_nome_key');
      console.log('✅ Constraint UNIQUE removida');
    } catch (error) {
      console.log('ℹ️  Constraint não existia ou já foi removida');
    }

    // 2. Criar índice único composto
    try {
      await client.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS sessoes_nome_usuario_unique 
        ON sessoes (nome, COALESCE(usuario_id::text, 'GLOBAL'))
      `);
      console.log('✅ Índice único composto criado');
    } catch (error) {
      console.log('ℹ️  Índice já existe');
    }

    // 3. Remover sessões globais duplicadas (manter apenas as que não têm conflito com usuários)
    const result1 = await client.query(`
      DELETE FROM sessoes s1
      WHERE s1.usuario_id IS NULL
      AND EXISTS (
        SELECT 1 FROM sessoes s2 
        WHERE s2.nome = s1.nome 
        AND s2.usuario_id IS NOT NULL
      )
      RETURNING s1.id, s1.nome
    `);
    console.log(`✅ ${result1.rows.length} sessões globais duplicadas removidas`);

    // 4. Se ainda houver sessões globais duplicadas (mesmo nome), manter apenas uma
    const result2 = await client.query(`
      DELETE FROM sessoes s1
      WHERE s1.usuario_id IS NULL
      AND s1.id NOT IN (
        SELECT MIN(id) FROM sessoes 
        WHERE usuario_id IS NULL 
        GROUP BY nome
      )
      RETURNING s1.id, s1.nome
    `);
    console.log(`✅ ${result2.rows.length} sessões globais duplicadas adicionais removidas`);

    // 5. Remover sessões de usuário duplicadas (manter apenas a mais antiga)
    const result3 = await client.query(`
      DELETE FROM sessoes s1
      WHERE s1.usuario_id IS NOT NULL
      AND s1.id NOT IN (
        SELECT MIN(id) FROM sessoes 
        WHERE usuario_id IS NOT NULL
        GROUP BY nome, usuario_id
      )
      RETURNING s1.id, s1.nome, s1.usuario_id
    `);
    console.log(`✅ ${result3.rows.length} sessões de usuário duplicadas removidas`);

    await client.query('COMMIT');
    console.log('✅ Correção concluída com sucesso!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao corrigir sessões:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar
fixSessoes()
  .then(() => {
    console.log('✨ Processo finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });


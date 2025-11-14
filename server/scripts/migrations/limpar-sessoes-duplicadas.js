/**
 * Script para limpar sessões duplicadas existentes
 * Remove sessões globais que já existem como sessões de usuário
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'advocacia_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function limparDuplicatas() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Limpando sessões duplicadas...');
    
    await client.query('BEGIN');

    // Remover sessões globais que já existem como sessões de usuário
    const result = await client.query(`
      DELETE FROM sessoes s1
      WHERE s1.usuario_id IS NULL
      AND EXISTS (
        SELECT 1 FROM sessoes s2 
        WHERE s2.nome = s1.nome 
        AND s2.usuario_id IS NOT NULL
      )
      RETURNING s1.id, s1.nome
    `);
    
    console.log(`✅ ${result.rows.length} sessões globais duplicadas removidas:`);
    result.rows.forEach(row => {
      console.log(`   - ${row.nome} (ID: ${row.id})`);
    });

    // Remover sessões de usuário duplicadas (manter apenas a mais antiga)
    const result2 = await client.query(`
      DELETE FROM sessoes s1
      WHERE s1.usuario_id IS NOT NULL
      AND s1.id NOT IN (
        SELECT MIN(id) FROM sessoes 
        WHERE usuario_id IS NOT NULL
        GROUP BY nome, usuario_id
      )
      RETURNING s1.id, s1.nome, s1.usuario_id
    `);
    
    if (result2.rows.length > 0) {
      console.log(`✅ ${result2.rows.length} sessões de usuário duplicadas removidas`);
    }

    await client.query('COMMIT');
    console.log('✅ Limpeza concluída com sucesso!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao limpar sessões:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

limparDuplicatas()
  .then(() => {
    console.log('✨ Processo finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });




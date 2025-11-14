require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'advocacia_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

const SESSOES_GLOBAIS = ['Criminal', 'Cível', 'Trabalhista', 'Tributário', 'Família'];

async function limparSessoesDuplicadas() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('🧹 Limpando sessões duplicadas de usuários que já existem como globais...\n');

    // Para cada sessão global, encontrar e deletar duplicatas de usuários
    for (const sessaoNome of SESSOES_GLOBAIS) {
      // Buscar sessões globais com este nome
      const globais = await client.query(
        'SELECT id FROM sessoes WHERE nome = $1 AND usuario_id IS NULL',
        [sessaoNome]
      );

      if (globais.rows.length === 0) {
        console.log(`⚠️  Sessão global "${sessaoNome}" não encontrada - pulando`);
        continue;
      }

      // Buscar sessões de usuários com o mesmo nome
      const duplicatas = await client.query(
        'SELECT id, usuario_id FROM sessoes WHERE nome = $1 AND usuario_id IS NOT NULL',
        [sessaoNome]
      );

      if (duplicatas.rows.length > 0) {
        console.log(`\n📋 Sessão "${sessaoNome}":`);
        console.log(`   🌐 Global: ID ${globais.rows[0].id}`);
        console.log(`   👤 Duplicatas de usuários: ${duplicatas.rows.length}`);

        // Verificar se há arquivos associados
        for (const dup of duplicatas.rows) {
          const arquivos = await client.query(
            'SELECT COUNT(*) as count FROM arquivos WHERE sessao_id = $1',
            [dup.id]
          );
          const count = parseInt(arquivos.rows[0].count);

          if (count > 0) {
            // Mover arquivos para a sessão global antes de deletar
            console.log(`   ⚠️  Sessão do usuário ${dup.usuario_id} (ID: ${dup.id}) tem ${count} arquivo(s) - movendo para global`);
            await client.query(
              'UPDATE arquivos SET sessao_id = $1 WHERE sessao_id = $2',
              [globais.rows[0].id, dup.id]
            );
          }

          // Deletar sessão duplicada
          await client.query('DELETE FROM sessoes WHERE id = $1', [dup.id]);
          console.log(`   ✅ Sessão do usuário ${dup.usuario_id} (ID: ${dup.id}) deletada`);
        }
      } else {
        console.log(`\n✅ Sessão "${sessaoNome}" - sem duplicatas`);
      }
    }

    await client.query('COMMIT');
    console.log('\n✨ Limpeza concluída com sucesso!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao limpar sessões:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

limparSessoesDuplicadas()
  .then(() => {
    console.log('\n✅ Processo finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });




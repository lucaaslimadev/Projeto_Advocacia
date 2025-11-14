require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'advocacia_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function criarSessoesGlobais() {
  const client = await pool.connect();
  try {
    console.log('🌐 Criando sessões globais...\n');

    const sessoesPadrao = ['Criminal', 'Cível', 'Trabalhista', 'Tributário', 'Família'];
    let criadas = 0;
    let jaExistentes = 0;

    for (const sessaoNome of sessoesPadrao) {
      // Verificar se já existe sessão global com este nome
      const existing = await client.query(
        'SELECT id FROM sessoes WHERE nome = $1 AND usuario_id IS NULL',
        [sessaoNome]
      );

      if (existing.rows.length > 0) {
        console.log(`   ⏭️  Sessão global "${sessaoNome}" já existe (ID: ${existing.rows[0].id})`);
        jaExistentes++;
      } else {
        try {
          const result = await client.query(
            'INSERT INTO sessoes (nome, usuario_id) VALUES ($1, NULL) RETURNING id, nome',
            [sessaoNome]
          );
          console.log(`   ✅ Sessão global "${sessaoNome}" criada (ID: ${result.rows[0].id})`);
          criadas++;
        } catch (error) {
          if (error.code === '23505') { // Unique violation
            console.log(`   ⚠️  Conflito ao criar "${sessaoNome}" - pode ser por causa do índice único`);
          } else {
            console.error(`   ❌ Erro ao criar "${sessaoNome}":`, error.message);
          }
        }
      }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`   ✅ Criadas: ${criadas}`);
    console.log(`   ⏭️  Já existentes: ${jaExistentes}`);

    // Verificar resultado final
    const todasGlobais = await client.query(
      'SELECT id, nome FROM sessoes WHERE usuario_id IS NULL ORDER BY nome'
    );

    console.log(`\n🌐 Sessões globais no banco (${todasGlobais.rows.length}):`);
    todasGlobais.rows.forEach(s => {
      console.log(`   - ${s.nome} (ID: ${s.id})`);
    });

    if (todasGlobais.rows.length === 0) {
      console.log('\n⚠️  ATENÇÃO: Ainda não há sessões globais!');
      console.log('   Isso pode ser causado pelo índice único que impede duplicatas.');
    }

  } catch (error) {
    console.error('❌ Erro ao criar sessões globais:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

criarSessoesGlobais()
  .then(() => {
    console.log('\n✨ Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });




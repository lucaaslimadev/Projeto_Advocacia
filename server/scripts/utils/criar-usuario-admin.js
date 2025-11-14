require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'advocacia_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function criarUsuarioAdmin() {
  const client = await pool.connect();
  try {
    console.log('👤 Criar Usuário Administrador\n');

    const nome = await question('Nome: ');
    const email = await question('Email: ');
    const senha = await question('Senha (mínimo 6 caracteres): ');

    if (!nome || !email || !senha) {
      console.log('❌ Todos os campos são obrigatórios!');
      return;
    }

    if (senha.length < 6) {
      console.log('❌ Senha deve ter pelo menos 6 caracteres!');
      return;
    }

    // Verificar se email já existe
    const existing = await client.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      console.log('❌ Email já cadastrado!');
      return;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Criar usuário admin
    const result = await client.query(
      'INSERT INTO usuarios (nome, email, senha, role, ativo) VALUES ($1, $2, $3, $4, $5) RETURNING id, nome, email, role',
      [nome, email, hashedPassword, 'admin', true]
    );

    console.log('\n✅ Usuário administrador criado com sucesso!');
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`   Nome: ${result.rows[0].nome}`);
    console.log(`   Email: ${result.rows[0].email}`);
    console.log(`   Role: ${result.rows[0].role}`);

    // Criar sessões padrão
    const sessoesPadrao = ['Criminal', 'Cível', 'Trabalhista', 'Tributário', 'Família'];
    for (const sessaoNome of sessoesPadrao) {
      const existing = await client.query(
        'SELECT id FROM sessoes WHERE nome = $1 AND usuario_id = $2',
        [sessaoNome, result.rows[0].id]
      );
      
      if (existing.rows.length === 0) {
        await client.query(
          'INSERT INTO sessoes (nome, usuario_id) VALUES ($1, $2)',
          [sessaoNome, result.rows[0].id]
        );
      }
    }

    console.log('✅ Sessões padrão criadas!');

  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    throw error;
  } finally {
    client.release();
    rl.close();
    await pool.end();
  }
}

criarUsuarioAdmin()
  .then(() => {
    console.log('\n✨ Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });




require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: 'postgres', // Conectar ao banco padrão primeiro
});

async function setupDatabase() {
  const client = await pool.connect();
  try {
    const dbName = process.env.DB_NAME || 'advocacia_db';
    
    console.log('🔧 Configurando banco de dados...\n');

    // Verificar se o banco existe
    const dbCheck = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (dbCheck.rows.length === 0) {
      console.log(`📦 Criando banco de dados "${dbName}"...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Banco de dados "${dbName}" criado com sucesso!\n`);
    } else {
      console.log(`✅ Banco de dados "${dbName}" já existe.\n`);
    }

    // Fechar conexão com postgres
    client.release();

    // Conectar ao banco criado
    const dbPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: dbName,
    });

    const dbClient = await dbPool.connect();

    try {
      // Executar migrations
      const migrationsDir = path.join(__dirname, '../migrations');
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      console.log('📋 Executando migrations...\n');

      for (const file of migrationFiles) {
        console.log(`   Executando: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        try {
          await dbClient.query(sql);
          console.log(`   ✅ ${file} executado com sucesso`);
        } catch (error) {
          // Ignorar erros de objetos já existentes
          if (error.code === '42P07' || error.code === '42710' || error.code === '23505') {
            console.log(`   ⚠️  ${file} - alguns objetos já existem (ignorado)`);
          } else {
            throw error;
          }
        }
      }

      // Verificar se há sessões globais
      const sessoesGlobais = await dbClient.query(
        'SELECT COUNT(*) as count FROM sessoes WHERE usuario_id IS NULL'
      );
      const count = parseInt(sessoesGlobais.rows[0].count);

      if (count === 0) {
        console.log('\n🌐 Criando sessões globais...');
        const sessoesPadrao = ['Criminal', 'Cível', 'Trabalhista', 'Tributário', 'Família'];
        for (const nome of sessoesPadrao) {
          // Verificar se já existe antes de inserir
          const existing = await dbClient.query(
            'SELECT id FROM sessoes WHERE nome = $1 AND usuario_id IS NULL',
            [nome]
          );
          if (existing.rows.length === 0) {
            await dbClient.query(
              'INSERT INTO sessoes (nome, usuario_id) VALUES ($1, NULL)',
              [nome]
            );
          }
        }
        console.log('✅ Sessões globais criadas!');
      } else {
        console.log(`\n✅ ${count} sessões globais já existem.`);
      }

      // Verificar se há usuário admin
      const adminCheck = await dbClient.query(
        "SELECT COUNT(*) as count FROM usuarios WHERE role = 'admin'"
      );
      const adminCount = parseInt(adminCheck.rows[0].count);

      if (adminCount === 0) {
        console.log('\n👤 Nenhum usuário admin encontrado.');
        console.log('   Você pode criar um usando: node server/scripts/utils/criar-usuario-admin.js');
      } else {
        console.log(`\n✅ ${adminCount} usuário(s) admin encontrado(s).`);
      }

      console.log('\n✨ Banco de dados configurado com sucesso!');
      console.log('\n📝 Próximos passos:');
      console.log('   1. Inicie o servidor: cd server && npm run dev');
      console.log('   2. Inicie o frontend: npm start');

    } finally {
      dbClient.release();
      await dbPool.end();
    }

  } catch (error) {
    console.error('❌ Erro ao configurar banco de dados:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

setupDatabase()
  .then(() => {
    console.log('\n✅ Setup concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });


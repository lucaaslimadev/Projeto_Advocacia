const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'advocacia_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 10, // Reduzido para evitar muitas conexões
  min: 2, // Manter pelo menos 2 conexões ativas
  idleTimeoutMillis: 60000, // 60 segundos - aumentar tempo antes de fechar idle
  connectionTimeoutMillis: 10000, // 10 segundos
  allowExitOnIdle: false,
  statement_timeout: 30000, // 30 segundos para queries
  query_timeout: 30000,
});

// Tratamento de erros do pool
pool.on('error', (err, client) => {
  console.error('❌ Erro inesperado no cliente do pool:', err.message);
  console.error('Código:', err.code);
  // Remover cliente com erro do pool
  if (client) {
    client.release();
  }
});

pool.on('connect', () => {
  console.log('✅ Nova conexão estabelecida com o banco de dados');
});

pool.on('remove', () => {
  console.log('⚠️  Cliente removido do pool');
});

// Health check periódico
let healthCheckInterval;
function startHealthCheck() {
  healthCheckInterval = setInterval(async () => {
    let client;
    try {
      client = await pool.connect();
      await client.query('SELECT 1');
    } catch (error) {
      console.error('⚠️  Health check falhou:', error.message);
    } finally {
      if (client) {
        client.release();
      }
    }
  }, 30000); // A cada 30 segundos
}

// Iniciar health check após 5 segundos
setTimeout(startHealthCheck, 5000);

// Função para verificar conexão com retry
async function testConnection(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      return true;
    } catch (error) {
      console.error(`❌ Tentativa ${i + 1}/${retries} - Erro ao testar conexão:`, error.message);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2s antes de tentar novamente
      }
    }
  }
  return false;
}

// Testar conexão na inicialização
testConnection().then(connected => {
  if (connected) {
    console.log('✅ Conexão com banco de dados estabelecida');
  } else {
    console.error('❌ Falha ao conectar com banco de dados após múltiplas tentativas');
  }
});

// Helper para executar queries com retry automático (usando pool.connect)
pool.queryWithRetry = async function(text, params, retries = 2) {
  for (let i = 0; i < retries; i++) {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query(text, params);
      return result;
    } catch (error) {
      // Se for erro de conexão e ainda houver tentativas
      if ((error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === '57P01') && i < retries - 1) {
        console.warn(`⚠️  Tentativa ${i + 1}/${retries} falhou, tentando novamente...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }
};

module.exports = pool;


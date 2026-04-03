const { Client } = require('pg');

async function createDB() {
  const connectionString = 'postgresql://postgres:Dudu@2006.@localhost:5432/postgres';
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Conectado ao postgres');
    
    // Check if evolution_db exists
    const check = await client.query("SELECT 1 FROM pg_database WHERE datname = 'evolution_db'");
    if (check.rowCount === 0) {
      console.log('🆕 Criando banco evolution_db...');
      await client.query('CREATE DATABASE evolution_db');
      console.log('✅ Banco evolution_db criado!');
    } else {
      console.log('ℹ️ Banco evolution_db já existe.');
    }
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
  }
}

createDB();

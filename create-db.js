// create-db.js
const { Client } = require('pg');
require('dotenv').config();

async function createDb() {
  const connectionString = process.env.DATABASE_CONNECTION_URI || 'postgresql://postgres:Dudu%402006.@localhost:5432/postgres';
  // Use the connection string but point to 'postgres' to create another DB
  const pgUrl = new URL(connectionString);
  pgUrl.pathname = '/postgres'; 

  const client = new Client({ connectionString: pgUrl.toString() });
  await client.connect();
  
  try {
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'bot_db'");
    if (res.rowCount === 0) {
      console.log('🏗️ Criando banco bot_db...');
      await client.query('CREATE DATABASE bot_db');
      console.log('✅ Banco bot_db criado!');
    } else {
      console.log('✨ Banco bot_db já existe.');
    }
  } catch (err) {
    console.error('❌ Erro ao verificar/criar banco:', err.message);
  } finally {
    await client.end();
  }
}

createDb();

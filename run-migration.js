// run-migration.js
require('dotenv').config();
const Database = require('./src-bot/database/Database');
const fs = require('fs');
const path = require('path');

async function run() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('❌ POSTGRES_URL not found in .env');
    process.exit(1);
  }

  const db = new Database(connectionString);
  await db.initialize();
  
  console.log('🚀 Iniciando Migração Trinity...');
  const migrationSql = fs.readFileSync(path.join(__dirname, 'tmp', 'migration-trinity.sql'), 'utf-8');
  
  try {
    await db.pool.query(migrationSql);
    console.log('✅ Migração concluída com sucesso!');
  } catch (err) {
    console.error('❌ Erro na migração:', err.message);
  } finally {
    await db.close();
  }
}

run();

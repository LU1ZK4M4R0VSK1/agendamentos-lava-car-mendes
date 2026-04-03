const { Client } = require('pg');

async function checkTables() {
  const connectionString = 'postgresql://postgres:Dudu@2006.@localhost:5432/postgres';
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Conectado ao bot_db');
    
    console.log('✅ Conectado ao postgres');
    
    const res = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
      ORDER BY table_name;
    `);
    
    console.log('📋 Tabelas encontradas:');
    res.rows.forEach(row => {
      console.log(`- ${row.table_schema}.${row.table_name}`);
    });
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
  }
}

checkTables();

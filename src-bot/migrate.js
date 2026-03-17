// src-bot/migrate.js
const Database = require('./database/Database');
const config = require('./config');

async function migrate() {
  const db = new Database(config.DATABASE_PATH).initialize();
  
  try {
    console.log('Running migration: Add business_hours to organizations...');
    db.db.prepare('ALTER TABLE organizations ADD COLUMN business_hours TEXT').run();
    console.log('✅ Column business_hours added successfully.');
  } catch (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('ℹ️ Column business_hours already exists.');
    } else {
      console.error('❌ Migration failed:', err.message);
    }
  }

  db.close();
}

migrate();

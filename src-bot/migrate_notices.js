// src-bot/migrate_notices.js
const Database = require('./database/Database');
const config = require('./config');

async function migrate() {
  const db = new Database(config.DATABASE_PATH).initialize();
  
  try {
    console.log('Running migration: Add notices columns to organizations...');
    try {
        db.db.prepare('ALTER TABLE organizations ADD COLUMN important_notices TEXT').run();
        console.log('✅ Column important_notices added.');
    } catch(e) { console.log('ℹ️ Column important_notices already exists.'); }

    try {
        db.db.prepare('ALTER TABLE organizations ADD COLUMN notices_updated_at DATETIME').run();
        console.log('✅ Column notices_updated_at added.');
    } catch(e) { console.log('ℹ️ Column notices_updated_at already exists.'); }

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  }

  db.close();
}

migrate();

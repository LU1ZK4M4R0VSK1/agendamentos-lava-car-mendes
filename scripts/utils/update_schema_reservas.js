const Database = require('./src-bot/database/Database');
require('dotenv').config();

(async () => {
  const db = await new Database(process.env.POSTGRES_URL).initialize();
  
  try {
    // Adiciona a coluna last_notification_at para rastrear se já enviamos o lembrete de confirmação
    await db.pool.query(`
      ALTER TABLE service_requests 
      ADD COLUMN IF NOT EXISTS last_notification_at TIMESTAMP WITH TIME ZONE;
    `);
    console.log('✅ Tabela service_requests atualizada com a coluna last_notification_at!');
  } catch (err) {
    console.error('❌ Erro ao atualizar schema:', err.message);
  } finally {
    await db.close();
  }
})();

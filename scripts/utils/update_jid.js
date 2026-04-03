const Database = require('./src-bot/database/Database');
require('dotenv').config();

async function main() {
  const db = await new Database(process.env.POSTGRES_URL).initialize();
  const targetJid = '120363423866241019@g.us';
  const instance = 'pizzaria-tomazina';
  
  await db.pool.query(
    'UPDATE organizations SET admin_group_jid = $1 WHERE instance_name = $2',
    [targetJid, instance]
  );
  
  console.log(`✅ JID atualizado para ${instance}: ${targetJid}`);
  await db.close();
}
main();

const Database = require('./src-bot/database/Database');
require('dotenv').config();

async function main() {
  const db = await new Database(process.env.POSTGRES_URL).initialize();
  const orgs = await db.pool.query('SELECT name, instance_name, admin_group_jid FROM organizations');
  console.log(JSON.stringify(orgs.rows, null, 2));
  await db.close();
}
main();

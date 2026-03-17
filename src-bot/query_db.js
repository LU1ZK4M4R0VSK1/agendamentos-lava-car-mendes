const BetterSqlite3 = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'bot.db');
const db = new BetterSqlite3(dbPath);

const rows = db.prepare("SELECT DISTINCT sender_jid, content FROM messages WHERE sender_jid LIKE '%@g.us' ORDER BY timestamp DESC LIMIT 20;").all();
console.log(JSON.stringify(rows, null, 2));

db.close();

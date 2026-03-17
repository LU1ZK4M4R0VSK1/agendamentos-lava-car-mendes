// src-bot/migrate-to-pg.js
// Migra todos os dados do SQLite (bot.db) para o PostgreSQL
// Execute uma vez: node src-bot/migrate-to-pg.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const path = require('path');
const BetterSqlite3 = require('better-sqlite3');
const { Pool } = require('pg');
const fs = require('fs');

const SQLITE_PATH = process.env.SQLITE_PATH || path.join(__dirname, 'data', 'bot.db');
const POSTGRES_URL = process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/bot_db';

async function migrate() {
  console.log('🔄 Iniciando migração SQLite → PostgreSQL...\n');

  // 1. Conectar ao SQLite
  if (!fs.existsSync(SQLITE_PATH)) {
    console.log('⚠️  Banco SQLite não encontrado em:', SQLITE_PATH);
    console.log('ℹ️  Se não há dados para migrar, execute diretamente: node src-bot/seed.js');
    process.exit(0);
  }

  const sqlite = new BetterSqlite3(SQLITE_PATH, { readonly: true });
  console.log(`📂 SQLite aberto: ${SQLITE_PATH}`);

  // 2. Conectar ao PostgreSQL
  const pool = new Pool({ connectionString: POSTGRES_URL });
  const client = await pool.connect();
  console.log(`🐘 PostgreSQL conectado: ${POSTGRES_URL.replace(/:[^:@]+@/, ':***@')}`);

  try {
    // 3. Criar tabelas no PostgreSQL (schema)
    const schema = fs.readFileSync(path.join(__dirname, 'database', 'schema-pg.sql'), 'utf-8');
    await client.query(schema);
    console.log('✅ Schema PostgreSQL criado\n');

    // 4. Migrar cada tabela (respeitando ordem de FK)
    await client.query('BEGIN');

    // ── ORGANIZATIONS ──
    const orgs = sqlite.prepare('SELECT * FROM organizations').all();
    console.log(`📋 Organizations: ${orgs.length} registros`);
    for (const row of orgs) {
      await client.query(
        `INSERT INTO organizations (id, name, type, phone, instance_name, admin_group_jid, system_prompt, business_hours, timezone, important_notices, notices_updated_at, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (id) DO NOTHING`,
        [row.id, row.name, row.type, row.phone, row.instance_name, row.admin_group_jid, row.system_prompt, row.business_hours, row.timezone || 'America/Sao_Paulo', row.important_notices || null, row.notices_updated_at || null, row.created_at, row.updated_at]
      );
    }
    console.log(`   ✅ ${orgs.length} organizações migradas`);

    // ── CUSTOMERS ──
    const customers = sqlite.prepare('SELECT * FROM customers').all();
    console.log(`👤 Customers: ${customers.length} registros`);
    for (const row of customers) {
      await client.query(
        `INSERT INTO customers (id, remote_jid, push_name, phone, organization_id, first_contact_at, last_contact_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO NOTHING`,
        [row.id, row.remote_jid, row.push_name, row.phone, row.organization_id, row.first_contact_at, row.last_contact_at]
      );
    }
    console.log(`   ✅ ${customers.length} clientes migrados`);

    // ── CONVERSATIONS ──
    const conversations = sqlite.prepare('SELECT * FROM conversations').all();
    console.log(`💬 Conversations: ${conversations.length} registros`);
    for (const row of conversations) {
      await client.query(
        `INSERT INTO conversations (id, customer_id, organization_id, instance_name, status, started_at, last_message_at, closed_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO NOTHING`,
        [row.id, row.customer_id, row.organization_id, row.instance_name, row.status, row.started_at, row.last_message_at, row.closed_at]
      );
    }
    console.log(`   ✅ ${conversations.length} conversas migradas`);

    // ── MESSAGES ──
    const messages = sqlite.prepare('SELECT * FROM messages').all();
    console.log(`✉️  Messages: ${messages.length} registros`);
    for (const row of messages) {
      await client.query(
        `INSERT INTO messages (id, conversation_id, whatsapp_message_id, direction, content, message_type, sender_jid, timestamp, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO NOTHING`,
        [row.id, row.conversation_id, row.whatsapp_message_id, row.direction, row.content, row.message_type, row.sender_jid, row.timestamp, row.created_at]
      );
    }
    console.log(`   ✅ ${messages.length} mensagens migradas`);

    // ── SERVICE REQUESTS ──
    const requests = sqlite.prepare('SELECT * FROM service_requests').all();
    console.log(`📦 Service Requests: ${requests.length} registros`);
    for (const row of requests) {
      await client.query(
        `INSERT INTO service_requests (id, conversation_id, customer_id, organization_id, type, status, details, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO NOTHING`,
        [row.id, row.conversation_id, row.customer_id, row.organization_id, row.type, row.status, row.details, row.created_at, row.updated_at]
      );
    }
    console.log(`   ✅ ${requests.length} pedidos migrados`);

    await client.query('COMMIT');
    console.log('\n🎉 Migração concluída com sucesso!');
    console.log(`\n📊 Resumo:`);
    console.log(`   Organizations: ${orgs.length}`);
    console.log(`   Customers:     ${customers.length}`);
    console.log(`   Conversations: ${conversations.length}`);
    console.log(`   Messages:      ${messages.length}`);
    console.log(`   Requests:      ${requests.length}`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Erro na migração:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    sqlite.close();
  }
}

migrate();

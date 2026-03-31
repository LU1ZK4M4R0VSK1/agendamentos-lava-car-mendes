// src-bot/database/Database.js
// PostgreSQL connection + all query methods (migrated from SQLite/better-sqlite3)

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

class Database {
  constructor(connectionString) {
    this.connectionString = connectionString;
    this.pool = null;
  }

  async initialize() {
    this.pool = new Pool({ connectionString: this.connectionString });

    // Testa a conexão
    const client = await this.pool.connect();
    try {
      const schema = fs.readFileSync(path.join(__dirname, 'schema-pg.sql'), 'utf-8');
      await client.query(schema);
      console.log(`✅ Banco PostgreSQL inicializado`);
    } finally {
      client.release();
    }
    return this;
  }

  async close() {
    if (this.pool) { await this.pool.end(); this.pool = null; }
  }

  // ════════════════════════════════════════════
  // ORGANIZATIONS
  // ════════════════════════════════════════════

  async createOrganization({ name, type, phone, instanceName, adminGroupJid, systemPrompt, businessHours, timezone }) {
    const id = randomUUID();
    const now = new Date().toISOString();
    const bhJson = typeof businessHours === 'object' ? JSON.stringify(businessHours) : (businessHours || null);
    await this.pool.query(
      `INSERT INTO organizations (id, name, type, phone, instance_name, admin_group_jid, system_prompt, business_hours, timezone, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [id, name, type || 'general', phone, instanceName, adminGroupJid, systemPrompt, bhJson, timezone || 'America/Sao_Paulo', now, now]
    );
    return { id, name, type: type || 'general', phone, instanceName, adminGroupJid, systemPrompt, businessHours, timezone: timezone || 'America/Sao_Paulo' };
  }

  async findOrganizationByInstance(instanceName) {
    const { rows } = await this.pool.query('SELECT * FROM organizations WHERE instance_name = $1', [instanceName]);
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      phone: row.phone,
      instanceName: row.instance_name,
      adminGroupJid: row.admin_group_jid,
      systemPrompt: row.system_prompt,
      businessHours: row.business_hours ? JSON.parse(row.business_hours) : null,
      importantNotices: row.important_notices,
      noticesUpdatedAt: row.notices_updated_at,
      timezone: row.timezone
    };
  }

  async findAllOrganizations() {
    const { rows } = await this.pool.query('SELECT * FROM organizations ORDER BY name');
    return rows.map(row => ({
      id: row.id, name: row.name, type: row.type, instanceName: row.instance_name,
      adminGroupJid: row.admin_group_jid,
    }));
  }

  async updateOrganizationNotices(instanceName, notices) {
    const now = notices ? new Date().toISOString() : null;
    await this.pool.query(
      'UPDATE organizations SET important_notices = $1, notices_updated_at = $2 WHERE instance_name = $3',
      [notices, now, instanceName]
    );
  }

  // ════════════════════════════════════════════
  // CUSTOMERS
  // ════════════════════════════════════════════

  async findOrCreateCustomer(remoteJid, organizationId, pushName) {
    const { rows } = await this.pool.query(
      'SELECT * FROM customers WHERE remote_jid = $1 AND organization_id = $2',
      [remoteJid, organizationId]
    );
    let row = rows[0];

    if (row) {
      await this.pool.query(
        'UPDATE customers SET push_name = COALESCE($1, push_name), last_contact_at = $2 WHERE id = $3',
        [pushName, new Date().toISOString(), row.id]
      );
      return { id: row.id, remoteJid: row.remote_jid, pushName: pushName || row.push_name, phone: row.phone };
    }

    const id = randomUUID();
    const phone = remoteJid.split('@')[0];
    const now = new Date().toISOString();
    await this.pool.query(
      `INSERT INTO customers (id, remote_jid, push_name, phone, organization_id, first_contact_at, last_contact_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, remoteJid, pushName, phone, organizationId, now, now]
    );
    return { id, remoteJid, pushName, phone };
  }

  // ════════════════════════════════════════════
  // CONVERSATIONS
  // ════════════════════════════════════════════

  async findActiveConversation(customerId, organizationId) {
    const { rows } = await this.pool.query(
      `SELECT * FROM conversations
       WHERE customer_id = $1 AND organization_id = $2 AND status = 'active'
       ORDER BY last_message_at DESC LIMIT 1`,
      [customerId, organizationId]
    );
    return rows[0] || null;
  }

  async createConversation(customerId, organizationId, instanceName) {
    const id = randomUUID();
    const now = new Date().toISOString();
    await this.pool.query(
      `INSERT INTO conversations (id, customer_id, organization_id, instance_name, status, started_at, last_message_at)
       VALUES ($1, $2, $3, $4, 'active', $5, $6)`,
      [id, customerId, organizationId, instanceName, now, now]
    );
    return { id, customerId, organizationId, status: 'active', startedAt: now };
  }

  async touchConversation(conversationId) {
    await this.pool.query(
      'UPDATE conversations SET last_message_at = $1 WHERE id = $2',
      [new Date().toISOString(), conversationId]
    );
  }

  async closeConversation(conversationId) {
    const now = new Date().toISOString();
    await this.pool.query(
      "UPDATE conversations SET status = 'closed', closed_at = $1 WHERE id = $2",
      [now, conversationId]
    );
  }

  async closeExpiredConversations(timeoutMinutes) {
    const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000).toISOString();
    const now = new Date().toISOString();
    const result = await this.pool.query(
      "UPDATE conversations SET status = 'closed', closed_at = $1 WHERE status = 'active' AND last_message_at < $2",
      [now, cutoff]
    );
    return result.rowCount;
  }

  async findOrCreateConversation(customerId, organizationId, instanceName, timeoutMinutes) {
    let conv = await this.findActiveConversation(customerId, organizationId);

    if (conv) {
      const lastMsg = new Date(conv.last_message_at).getTime();
      const expired = (Date.now() - lastMsg) > timeoutMinutes * 60 * 1000;

      if (expired) {
        await this.closeConversation(conv.id);
        conv = null;
      } else {
        await this.touchConversation(conv.id);
        return { conversation: { id: conv.id }, isNew: false };
      }
    }

    const newConv = await this.createConversation(customerId, organizationId, instanceName);
    return { conversation: newConv, isNew: true };
  }

  // ════════════════════════════════════════════
  // MESSAGES
  // ════════════════════════════════════════════

  async messageExists(whatsappMessageId) {
    const { rows } = await this.pool.query('SELECT 1 FROM messages WHERE whatsapp_message_id = $1', [whatsappMessageId]);
    return rows.length > 0;
  }

  async createMessage({ conversationId, whatsappMessageId, direction, content, messageType, senderJid, timestamp }) {
    const id = randomUUID();
    await this.pool.query(
      `INSERT INTO messages (id, conversation_id, whatsapp_message_id, direction, content, message_type, sender_jid, timestamp, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, conversationId, whatsappMessageId, direction, content, messageType || 'text', senderJid, timestamp || Math.floor(Date.now() / 1000), new Date().toISOString()]
    );
    return id;
  }

  async getConversationHistory(conversationId, limit = 20) {
    const { rows } = await this.pool.query(
      'SELECT direction, content FROM messages WHERE conversation_id = $1 ORDER BY timestamp DESC LIMIT $2',
      [conversationId, limit]
    );
    return rows.reverse();
  }

  // ════════════════════════════════════════════
  // SERVICE REQUESTS
  // ════════════════════════════════════════════

  async createServiceRequest({ conversationId, customerId, organizationId, type, details }) {
    const id = `PED-${Date.now()}`;
    const now = new Date().toISOString();
    const detailsJson = typeof details === 'object' ? JSON.stringify(details) : details;
    await this.pool.query(
      `INSERT INTO service_requests (id, conversation_id, customer_id, organization_id, type, status, details, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8)`,
      [id, conversationId, customerId, organizationId, type || 'general', detailsJson, now, now]
    );
    return id;
  }

  async findServiceRequestById(idOrPartial) {
    let { rows } = await this.pool.query('SELECT * FROM service_requests WHERE id = $1', [idOrPartial]);
    if (rows.length === 0) {
      const result = await this.pool.query(
        "SELECT * FROM service_requests WHERE id LIKE '%' || $1 ORDER BY created_at DESC LIMIT 1",
        [idOrPartial]
      );
      rows = result.rows;
    }
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      conversationId: row.conversation_id,
      customerId: row.customer_id,
      organizationId: row.organization_id,
      type: row.type,
      status: row.status,
      details: row.details,
    };
  }

  async updateServiceRequestStatus(id, newStatus) {
    await this.pool.query(
      'UPDATE service_requests SET status = $1, updated_at = $2 WHERE id = $3',
      [newStatus, new Date().toISOString(), id]
    );
  }

  async findCustomerById(customerId) {
    const { rows } = await this.pool.query('SELECT * FROM customers WHERE id = $1', [customerId]);
    const row = rows[0];
    if (!row) return null;
    return { id: row.id, remoteJid: row.remote_jid, pushName: row.push_name, phone: row.phone };
  }

  async getLastAddressForCustomer(customerId, organizationId) {
    const { rows } = await this.pool.query(
      `SELECT details FROM service_requests
       WHERE customer_id = $1 AND organization_id = $2
       AND details LIKE '%"endereco":"%'
       ORDER BY created_at DESC LIMIT 1`,
      [customerId, organizationId]
    );

    if (rows.length === 0) return null;

    try {
      const details = JSON.parse(rows[0].details);
      return details.endereco || null;
    } catch {
      return null;
    }
  }

  // ════════════════════════════════════════════
  // APPOINTMENTS
  // ════════════════════════════════════════════

  async createAppointment({ customerId, organizationId, serviceType, startTime, endTime }) {
    const id = `APT-${Date.now()}`;
    const now = new Date().toISOString();
    
    // Check conflicts
    const { rows } = await this.pool.query(
      `SELECT id FROM appointments WHERE organization_id = $1 AND start_time = $2 AND status != 'cancelado'`,
      [organizationId, startTime]
    );

    if (rows.length > 0) {
      throw new Error('Horário indispónivel');
    }

    await this.pool.query(
      `INSERT INTO appointments (id, customer_id, organization_id, service_type, start_time, end_time, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'agendado', $7)`,
      [id, customerId, organizationId, serviceType, startTime, endTime, now]
    );
    return id;
  }

  async getAppointmentsByDateRange(organizationId, fromDate, toDate) {
    const { rows } = await this.pool.query(
      `SELECT * FROM appointments 
       WHERE organization_id = $1 
         AND start_time >= $2 
         AND start_time <= $3 
         AND status != 'cancelado' 
       ORDER BY start_time ASC`,
      [organizationId, fromDate, toDate]
    );
    return rows.map(r => ({
      id: r.id,
      customerId: r.customer_id,
      organizationId: r.organization_id,
      serviceType: r.service_type,
      startTime: r.start_time,
      endTime: r.end_time,
      status: r.status,
    }));
  }
}

module.exports = Database;


// src-bot/database/Database.js
// SQLite connection + all query methods (replaces separate repositories)

const BetterSqlite3 = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

class Database {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
  }

  initialize() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    this.db = new BetterSqlite3(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('busy_timeout = 5000');

    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    this.db.exec(schema);

    console.log(`✅ Banco inicializado: ${this.dbPath}`);
    return this;
  }

  close() {
    if (this.db) { this.db.close(); this.db = null; }
  }

  // ════════════════════════════════════════════
  // ORGANIZATIONS
  // ════════════════════════════════════════════

  createOrganization({ name, type, phone, instanceName, adminGroupJid, systemPrompt, businessHours, timezone }) {
    const id = randomUUID();
    const now = new Date().toISOString();
    const bhJson = typeof businessHours === 'object' ? JSON.stringify(businessHours) : (businessHours || null);
    this.db.prepare(
      `INSERT INTO organizations (id, name, type, phone, instance_name, admin_group_jid, system_prompt, business_hours, timezone, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, name, type || 'general', phone, instanceName, adminGroupJid, systemPrompt, bhJson, timezone || 'America/Sao_Paulo', now, now);
    return { id, name, type: type || 'general', phone, instanceName, adminGroupJid, systemPrompt, businessHours, timezone: timezone || 'America/Sao_Paulo' };
  }

  findOrganizationByInstance(instanceName) {
    const row = this.db.prepare('SELECT * FROM organizations WHERE instance_name = ?').get(instanceName);
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

  findAllOrganizations() {
    return this.db.prepare('SELECT * FROM organizations ORDER BY name').all().map(row => ({
      id: row.id, name: row.name, type: row.type, instanceName: row.instance_name,
      adminGroupJid: row.admin_group_jid,
    }));
  }

  updateOrganizationNotices(instanceName, notices) {
    const now = notices ? new Date().toISOString() : null;
    this.db.prepare(
      'UPDATE organizations SET important_notices = ?, notices_updated_at = ? WHERE instance_name = ?'
    ).run(notices, now, instanceName);
  }

  // ════════════════════════════════════════════
  // CUSTOMERS
  // ════════════════════════════════════════════

  findOrCreateCustomer(remoteJid, organizationId, pushName) {
    let row = this.db.prepare(
      'SELECT * FROM customers WHERE remote_jid = ? AND organization_id = ?'
    ).get(remoteJid, organizationId);

    if (row) {
      // Atualiza pushName e lastContact
      this.db.prepare(
        'UPDATE customers SET push_name = COALESCE(?, push_name), last_contact_at = ? WHERE id = ?'
      ).run(pushName, new Date().toISOString(), row.id);
      return { id: row.id, remoteJid: row.remote_jid, pushName: pushName || row.push_name, phone: row.phone };
    }

    const id = randomUUID();
    const phone = remoteJid.split('@')[0];
    const now = new Date().toISOString();
    this.db.prepare(
      `INSERT INTO customers (id, remote_jid, push_name, phone, organization_id, first_contact_at, last_contact_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, remoteJid, pushName, phone, organizationId, now, now);
    return { id, remoteJid, pushName, phone };
  }

  // ════════════════════════════════════════════
  // CONVERSATIONS
  // ════════════════════════════════════════════

  findActiveConversation(customerId, organizationId) {
    return this.db.prepare(
      `SELECT * FROM conversations
       WHERE customer_id = ? AND organization_id = ? AND status = 'active'
       ORDER BY last_message_at DESC LIMIT 1`
    ).get(customerId, organizationId);
  }

  createConversation(customerId, organizationId, instanceName) {
    const id = randomUUID();
    const now = new Date().toISOString();
    this.db.prepare(
      `INSERT INTO conversations (id, customer_id, organization_id, instance_name, status, started_at, last_message_at)
       VALUES (?, ?, ?, ?, 'active', ?, ?)`
    ).run(id, customerId, organizationId, instanceName, now, now);
    return { id, customerId, organizationId, status: 'active', startedAt: now };
  }

  touchConversation(conversationId) {
    this.db.prepare(
      'UPDATE conversations SET last_message_at = ? WHERE id = ?'
    ).run(new Date().toISOString(), conversationId);
  }

  closeConversation(conversationId) {
    const now = new Date().toISOString();
    this.db.prepare(
      "UPDATE conversations SET status = 'closed', closed_at = ? WHERE id = ?"
    ).run(now, conversationId);
  }

  closeExpiredConversations(timeoutMinutes) {
    const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000).toISOString();
    const now = new Date().toISOString();
    return this.db.prepare(
      "UPDATE conversations SET status = 'closed', closed_at = ? WHERE status = 'active' AND last_message_at < ?"
    ).run(now, cutoff).changes;
  }

  /**
   * Busca ou cria conversa ativa. Se a anterior expirou, fecha e cria nova.
   * @returns {{ conversation: object, isNew: boolean }}
   */
  findOrCreateConversation(customerId, organizationId, instanceName, timeoutMinutes) {
    let conv = this.findActiveConversation(customerId, organizationId);

    if (conv) {
      const lastMsg = new Date(conv.last_message_at).getTime();
      const expired = (Date.now() - lastMsg) > timeoutMinutes * 60 * 1000;

      if (expired) {
        this.closeConversation(conv.id);
        conv = null;
      } else {
        this.touchConversation(conv.id);
        return { conversation: { id: conv.id }, isNew: false };
      }
    }

    const newConv = this.createConversation(customerId, organizationId, instanceName);
    return { conversation: newConv, isNew: true };
  }

  // ════════════════════════════════════════════
  // MESSAGES
  // ════════════════════════════════════════════

  messageExists(whatsappMessageId) {
    return !!this.db.prepare('SELECT 1 FROM messages WHERE whatsapp_message_id = ?').get(whatsappMessageId);
  }

  createMessage({ conversationId, whatsappMessageId, direction, content, messageType, senderJid, timestamp }) {
    const id = randomUUID();
    this.db.prepare(
      `INSERT INTO messages (id, conversation_id, whatsapp_message_id, direction, content, message_type, sender_jid, timestamp, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, conversationId, whatsappMessageId, direction, content, messageType || 'text', senderJid, timestamp || Math.floor(Date.now() / 1000), new Date().toISOString());
    return id;
  }

  /** Busca últimas N mensagens para contexto do AI */
  getConversationHistory(conversationId, limit = 20) {
    return this.db.prepare(
      'SELECT direction, content FROM messages WHERE conversation_id = ? ORDER BY timestamp DESC LIMIT ?'
    ).all(conversationId, limit).reverse();
  }

  // ════════════════════════════════════════════
  // SERVICE REQUESTS
  // ════════════════════════════════════════════

  createServiceRequest({ conversationId, customerId, organizationId, type, details }) {
    const id = `PED-${Date.now()}`;
    const now = new Date().toISOString();
    const detailsJson = typeof details === 'object' ? JSON.stringify(details) : details;
    this.db.prepare(
      `INSERT INTO service_requests (id, conversation_id, customer_id, organization_id, type, status, details, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
    ).run(id, conversationId, customerId, organizationId, type || 'general', detailsJson, now, now);
    return id;
  }

  /** Busca pedido por ID — aceita ID parcial (últimos dígitos) */
  findServiceRequestById(idOrPartial) {
    // Primeiro tenta match exato
    let row = this.db.prepare('SELECT * FROM service_requests WHERE id = ?').get(idOrPartial);
    if (!row) {
      // Tenta match parcial (ex: "779142" → "PED-1773180779142")
      row = this.db.prepare("SELECT * FROM service_requests WHERE id LIKE '%' || ? ORDER BY created_at DESC LIMIT 1").get(idOrPartial);
    }
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

  updateServiceRequestStatus(id, newStatus) {
    this.db.prepare(
      'UPDATE service_requests SET status = ?, updated_at = ? WHERE id = ?'
    ).run(newStatus, new Date().toISOString(), id);
  }

  findCustomerById(customerId) {
    const row = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
    if (!row) return null;
    return { id: row.id, remoteJid: row.remote_jid, pushName: row.push_name, phone: row.phone };
  }

  /**
   * Busca o último endereço registrado em um pedido deste cliente nesta organização
   */
  getLastAddressForCustomer(customerId, organizationId) {
    const row = this.db.prepare(
      `SELECT details FROM service_requests 
       WHERE customer_id = ? AND organization_id = ? 
       AND details LIKE '%"endereco":"%' 
       ORDER BY created_at DESC LIMIT 1`
    ).get(customerId, organizationId);

    if (!row) return null;

    try {
      const details = JSON.parse(row.details);
      return details.endereco || null;
    } catch {
      return null;
    }
  }
}

module.exports = Database;

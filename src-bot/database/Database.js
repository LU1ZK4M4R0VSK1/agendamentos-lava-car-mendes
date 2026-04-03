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
    const ssl = this.connectionString.includes('sslmode=require') || process.env.POSTGRES_SSL === 'true'
      ? { rejectUnauthorized: false } 
      : false;
    this.pool = new Pool({ 
      connectionString: this.connectionString,
      ssl
    });

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
    const phone = remoteJid.includes('@') ? remoteJid.split('@')[0] : remoteJid;
    const finalJid = remoteJid.includes('@') ? remoteJid : `${remoteJid}@s.whatsapp.net`;
    const now = new Date().toISOString();
    await this.pool.query(
      `INSERT INTO customers (id, remote_jid, push_name, phone, organization_id, first_contact_at, last_contact_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, finalJid, pushName, phone, organizationId, now, now]
    );
    return { id, remoteJid: finalJid, pushName, phone };
  }

  // ════════════════════════════════════════════
  // VEHICLES
  // ════════════════════════════════════════════

  async findOrCreateVehicle({ customerId, plate, model, color, type }) {
    const { rows } = await this.pool.query(
      'SELECT * FROM vehicles WHERE plate = $1 AND customer_id = $2',
      [plate, customerId]
    );
    let row = rows[0];

    if (row) {
      await this.pool.query(
        'UPDATE vehicles SET model = $1, color = $2, type = $3, updated_at = $4 WHERE id = $5',
        [model, color, type, new Date().toISOString(), row.id]
      );
      return row;
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    await this.pool.query(
      `INSERT INTO vehicles (id, customer_id, plate, model, color, type, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, customerId, plate, model, color, type, now, now]
    );
    return { id, customerId, plate, model, color, type };
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
  // SERVICES (MULTI-TENANT)
  // ════════════════════════════════════════════

  async createOrUpdateService({ id, organizationId, name, durationMinutes, price, capacity = 1, bufferMinutes = 0, active }) {
    const defaultId = id || randomUUID();
    const now = new Date().toISOString();
    
    const { rowCount } = await this.pool.query(
      `UPDATE services 
       SET name = $1, duration_minutes = $2, price = $3, capacity = $4, buffer_minutes = $5, active = $6 
       WHERE id = $7 AND organization_id = $8`,
      [name, durationMinutes, price, capacity, bufferMinutes, active !== false, id, organizationId]
    );

    if (rowCount === 0) {
      await this.pool.query(
        `INSERT INTO services (id, organization_id, name, duration_minutes, price, capacity, buffer_minutes, active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [defaultId, organizationId, name, durationMinutes, price, capacity, bufferMinutes, active !== false, now]
      );
    }
    return defaultId;
  }

  async getServicesByOrganization(organizationId) {
    const { rows } = await this.pool.query(
      `SELECT * FROM services WHERE organization_id = $1 AND active = true ORDER BY name`,
      [organizationId]
    );
    return rows.map(r => ({
      id: r.id,
      organizationId: r.organization_id,
      name: r.name,
      durationMinutes: r.duration_minutes,
      price: r.price,
      capacity: r.capacity,
      bufferMinutes: r.buffer_minutes
    }));
  }

  // ════════════════════════════════════════════
  // APPOINTMENTS
  // ════════════════════════════════════════════

  async createAppointment({ customerId, organizationId, serviceId, vehicleId, startTime, endTime, totalPrice, status = 'agendado' }) {
    const id = `APT-${Date.now()}`;
    const now = new Date().toISOString();
    
    try {
      await this.pool.query(
        `INSERT INTO appointments (id, customer_id, organization_id, service_id, vehicle_id, start_time, end_time, total_price, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [id, customerId, organizationId, serviceId, vehicleId, startTime, endTime, totalPrice, status, now]
      );
      return id;
    } catch (error) {
       if (error.constraint === 'no_overlap' || (error.message && error.message.includes('conflicting key'))) {
          throw new Error('CONFLITO_AGENDA');
       }
       throw error;
    }
  }

  /**
   * Salva um agendamento completo vindo do site (Trinity Flow)
   */
  async saveFullBooking({ organizationId, customer, vehicle, appointment }) {
    // 1. Cliente
    const dbCustomer = await this.findOrCreateCustomer(
      customer.phone, 
      organizationId, 
      customer.name
    );

    // 2. Veículo
    const dbVehicle = await this.findOrCreateVehicle({
      customerId: dbCustomer.id,
      plate: vehicle.plate,
      model: vehicle.model,
      color: vehicle.color,
      type: vehicle.type
    });

    // 3. Agendamento
    const appointmentId = await this.createAppointment({
      customerId: dbCustomer.id,
      organizationId,
      serviceId: appointment.serviceId,
      vehicleId: dbVehicle.id,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      totalPrice: appointment.totalPrice,
      status: 'agendado'
    });

    return {
      appointmentId,
      customerId: dbCustomer.id,
      vehicleId: dbVehicle.id
    };
  }

  async getAppointmentsByRange(organizationId, start, end) {
    const { rows } = await this.pool.query(
      `SELECT * FROM appointments 
       WHERE organization_id = $1 
         AND start_time < $3 
         AND end_time > $2 
         AND status = 'agendado'`,
      [organizationId, start, end]
    );
    return rows.map(r => ({
      id: r.id,
      customerId: r.customer_id,
      organizationId: r.organization_id,
      serviceId: r.service_id,
      startTime: r.start_time,
      endTime: r.end_time,
      status: r.status,
    }));
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
      serviceId: r.service_id,
      startTime: r.start_time,
      endTime: r.end_time,
      status: r.status,
    }));
  }

  // ════════════════════════════════════════════
  // ADMIN / DASHBOARD METHODS
  // ════════════════════════════════════════════

  async getAdminDashboardData(organizationId) {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(now.setHours(23, 59, 59, 999)).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // 1. Stats
    const statsQuery = await this.pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE start_time >= $2 AND start_time <= $3 AND status != 'cancelado') as count_today,
        SUM(total_price) FILTER (WHERE start_time >= $2 AND start_time <= $3 AND status != 'cancelado') as revenue_today,
        COUNT(*) FILTER (WHERE status = 'agendado') as total_pending,
        SUM(total_price) FILTER (WHERE start_time >= $4 AND status != 'cancelado') as revenue_month
       FROM appointments 
       WHERE organization_id = $1`,
      [organizationId, startOfDay, endOfDay, startOfMonth]
    );
    const stats = statsQuery.rows[0];

    // 2. Next Appointments (Próximos)
    const nextQuery = await this.pool.query(
      `SELECT a.*, c.push_name as customer_name, v.plate, v.model, s.name as service_name
       FROM appointments a
       JOIN customers c ON a.customer_id = c.id
       LEFT JOIN vehicles v ON a.vehicle_id = v.id
       JOIN services s ON a.service_id = s.id
       WHERE a.organization_id = $1 
         AND a.start_time >= $2
         AND a.status IN ('agendado', 'em_andamento')
       ORDER BY a.start_time ASC
       LIMIT 10`,
      [organizationId, new Date().toISOString()]
    );

    return {
      stats: {
        today_count: parseInt(stats.count_today || 0),
        today_revenue: parseFloat(stats.revenue_today || 0),
        pending_count: parseInt(stats.total_pending || 0),
        month_revenue: parseFloat(stats.revenue_month || 0)
      },
      upcoming: nextQuery.rows.map(r => ({
        id: r.id,
        time: r.start_time,
        client: r.customer_name,
        service: r.service_name,
        plate: r.plate || 'N/A',
        model: r.model || 'N/A',
        status: r.status
      }))
    };
  }

  async getAdminAgenda(organizationId, dateStr) {
    const startOfDay = `${dateStr}T00:00:00.000Z`;
    const endOfDay = `${dateStr}T23:59:59.999Z`;

    const { rows } = await this.pool.query(
      `SELECT a.*, c.push_name as customer_name, c.phone, v.plate, v.model, v.type as vehicle_type, s.name as service_name
       FROM appointments a
       JOIN customers c ON a.customer_id = c.id
       LEFT JOIN vehicles v ON a.vehicle_id = v.id
       JOIN services s ON a.service_id = s.id
       WHERE a.organization_id = $1 
         AND a.start_time >= $2 
         AND a.start_time <= $3
       ORDER BY a.start_time ASC`,
      [organizationId, startOfDay, endOfDay]
    );

    return rows.map(r => ({
      id: r.id,
      startTime: r.start_time,
      endTime: r.end_time,
      client: r.customer_name,
      phone: r.phone,
      service: r.service_name,
      plate: r.plate,
      model: r.model,
      vehicleType: r.type,
      totalPrice: parseFloat(r.total_price),
      status: r.status
    }));
  }

  async getAdminCustomers(organizationId) {
    const { rows } = await this.pool.query(
      `SELECT c.*, 
        COUNT(a.id) as total_appointments,
        MAX(a.start_time) as last_visit
       FROM customers c
       LEFT JOIN appointments a ON c.id = a.customer_id
       WHERE c.organization_id = $1
       GROUP BY c.id
       ORDER BY last_visit DESC NULLS LAST`,
      [organizationId]
    );
    return rows;
  }

  async updateAppointmentStatus(appointmentId, organizationId, newStatus) {
    const { rowCount } = await this.pool.query(
      'UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3',
      [newStatus, appointmentId, organizationId]
    );
    return rowCount > 0;
  }
}

module.exports = Database;


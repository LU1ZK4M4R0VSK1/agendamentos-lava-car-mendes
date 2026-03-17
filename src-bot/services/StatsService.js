// src-bot/services/StatsService.js

class StatsService {
  /**
   * @param {object} deps
   * @param {import('../database/Database')} deps.db
   */
  constructor({ db }) {
    this.db = db;
  }

  /**
   * Retorna estatísticas para uma organização e período
   * @param {string} organizationId 
   * @param {'dia'|'semana'|'mes'|'tudo'} period 
   */
  getStats(organizationId, period) {
    const whereOrg = 'organization_id = ?';
    let timeFilter = '';
    const now = new Date();

    if (period === 'dia') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      timeFilter = `AND created_at >= '${startOfDay}'`;
    } else if (period === 'semana') {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
      timeFilter = `AND created_at >= '${startOfWeek}'`;
    } else if (period === 'mes') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      timeFilter = `AND created_at >= '${startOfMonth}'`;
    }

    // 1. Clientes atendidos (quem recebeu mensagem do bot no período)
    const customersQuery = `
      SELECT COUNT(DISTINCT c.id) as count
      FROM customers c
      JOIN conversations conv ON conv.customer_id = c.id
      JOIN messages m ON m.conversation_id = conv.id
      WHERE c.organization_id = ? AND m.direction = 'outbound' ${timeFilter.replace('created_at', 'm.created_at')}
    `;
    const customersCount = this.db.db.prepare(customersQuery).get(organizationId).count;

    // 2. Pedidos gerados
    const ordersQuery = `
      SELECT COUNT(*) as count
      FROM service_requests
      WHERE organization_id = ? ${timeFilter}
    `;
    const ordersCount = this.db.db.prepare(ordersQuery).get(organizationId).count;

    // 3. Tempo médio de resposta (simplificado: média entre inbound e outbound subsequente)
    // Nota: SQLite não lida nativamente com timestamps de forma trivial pra subtração complexa sem strftime, 
    // mas guardamos 'timestamp' como INTEGER (época).
    let timeFilterTimestamp = '';
    const nowTs = Math.floor(Date.now() / 1000);
    if (period === 'dia') timeFilterTimestamp = `AND m1.timestamp >= ${nowTs - 86400}`;
    else if (period === 'semana') timeFilterTimestamp = `AND m1.timestamp >= ${nowTs - 604800}`;
    else if (period === 'mes') timeFilterTimestamp = `AND m1.timestamp >= ${nowTs - 2592000}`;

    const avgTimeQuery = `
      SELECT AVG(m2.timestamp - m1.timestamp) as avg_seconds
      FROM messages m1
      JOIN messages m2 ON m2.conversation_id = m1.conversation_id 
        AND m2.timestamp > m1.timestamp
      JOIN conversations conv ON conv.id = m1.conversation_id
      WHERE conv.organization_id = ? 
        AND m1.direction = 'inbound' 
        AND m2.direction = 'outbound'
        AND m2.id = (
          SELECT id FROM messages 
          WHERE conversation_id = m1.conversation_id 
            AND direction = 'outbound' 
            AND timestamp > m1.timestamp 
          ORDER BY timestamp ASC LIMIT 1
        )
        ${timeFilterTimestamp}
    `;
    const avgSeconds = this.db.db.prepare(avgTimeQuery).get(organizationId).avg_seconds || 0;

    return {
      customersCount,
      ordersCount,
      avgResponseTime: Math.round(avgSeconds),
    };
  }
}

module.exports = StatsService;

// src-bot/services/StatsService.js
// Estatísticas — PostgreSQL (async)

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
  async getStats(organizationId, period) {
    let timeFilter = '';
    const params = [organizationId];
    const now = new Date();

    if (period === 'dia') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      timeFilter = `AND created_at >= $2`;
      params.push(startOfDay);
    } else if (period === 'semana') {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
      timeFilter = `AND created_at >= $2`;
      params.push(startOfWeek);
    } else if (period === 'mes') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      timeFilter = `AND created_at >= $2`;
      params.push(startOfMonth);
    }

    // 1. Clientes atendidos
    const customersQuery = `
      SELECT COUNT(DISTINCT c.id) as count
      FROM customers c
      JOIN conversations conv ON conv.customer_id = c.id
      JOIN messages m ON m.conversation_id = conv.id
      WHERE c.organization_id = $1 AND m.direction = 'outbound' ${timeFilter.replace('created_at', 'm.created_at')}
    `;
    const customersResult = await this.db.pool.query(customersQuery, params);
    const customersCount = parseInt(customersResult.rows[0].count, 10);

    // 2. Pedidos gerados
    const ordersQuery = `
      SELECT COUNT(*) as count
      FROM service_requests
      WHERE organization_id = $1 ${timeFilter}
    `;
    const ordersResult = await this.db.pool.query(ordersQuery, params);
    const ordersCount = parseInt(ordersResult.rows[0].count, 10);

    // 3. Tempo médio de resposta
    let timeFilterTimestamp = '';
    const tsParams = [organizationId];
    const nowTs = Math.floor(Date.now() / 1000);
    if (period === 'dia') { timeFilterTimestamp = `AND m1.timestamp >= $2`; tsParams.push(nowTs - 86400); }
    else if (period === 'semana') { timeFilterTimestamp = `AND m1.timestamp >= $2`; tsParams.push(nowTs - 604800); }
    else if (period === 'mes') { timeFilterTimestamp = `AND m1.timestamp >= $2`; tsParams.push(nowTs - 2592000); }

    const avgTimeQuery = `
      SELECT AVG(m2.timestamp - m1.timestamp) as avg_seconds
      FROM messages m1
      JOIN messages m2 ON m2.conversation_id = m1.conversation_id 
        AND m2.timestamp > m1.timestamp
      JOIN conversations conv ON conv.id = m1.conversation_id
      WHERE conv.organization_id = $1 
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
    const avgResult = await this.db.pool.query(avgTimeQuery, tsParams);
    const avgSeconds = parseFloat(avgResult.rows[0].avg_seconds) || 0;

    return {
      customersCount,
      ordersCount,
      avgResponseTime: Math.round(avgSeconds),
    };
  }
}

module.exports = StatsService;

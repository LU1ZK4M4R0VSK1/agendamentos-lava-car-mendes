// src-bot/admin.routes.js
const { Router } = require('express');

function createAdminRoutes(db) {
  const router = Router();

  /**
   * Middleware de "Autenticação" Simples para o MVP
   * Em produção, trocar por JWT ou similar.
   */
  const simpleAuth = (req, res, next) => {
    const apiKey = req.headers['x-admin-key'];
    if (apiKey && apiKey === config.ADMIN_API_KEY) {
      return next();
    }
    console.warn(`🔐 Acesso negado: Tentativa de acesso admin sem chave válida.`);
    res.status(401).json({ error: 'Não autorizado. Chave de API Admin inválida.' });
  };

  /**
   * Dados do Dashboard (Stats + Próximos)
   * GET /api/admin/dashboard?org=posto3l
   */
  router.get('/api/admin/dashboard', simpleAuth, async (req, res) => {
    try {
      const { org: instanceName } = req.query;
      const organization = await db.findOrganizationByInstance(instanceName || 'posto3l');
      if (!organization) return res.status(404).json({ error: 'Org não encontrada' });

      const data = await db.getAdminDashboardData(organization.id);
      res.json(data);
    } catch (err) {
      console.error('❌ Erro dashboard:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Agenda do Dia
   * GET /api/admin/agenda?org=posto3l&date=2024-04-01
   */
  router.get('/api/admin/agenda', simpleAuth, async (req, res) => {
    try {
      const { org: instanceName, date } = req.query;
      const organization = await db.findOrganizationByInstance(instanceName || 'posto3l');
      if (!organization) return res.status(404).json({ error: 'Org não encontrada' });

      const targetDate = date || new Date().toISOString().split('T')[0];
      const agenda = await db.getAdminAgenda(organization.id, targetDate);
      res.json(agenda);
    } catch (err) {
      console.error('❌ Erro agenda:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Lista de Clientes (CRM)
   * GET /api/admin/customers?org=posto3l
   */
  router.get('/api/admin/customers', simpleAuth, async (req, res) => {
    try {
      const { org: instanceName } = req.query;
      const organization = await db.findOrganizationByInstance(instanceName || 'posto3l');
      if (!organization) return res.status(404).json({ error: 'Org não encontrada' });

      const customers = await db.getAdminCustomers(organization.id);
      res.json(customers);
    } catch (err) {
      console.error('❌ Erro clientes:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Atualizar Status de um Agendamento
   * PATCH /api/admin/appointments/:id/status
   */
  router.patch('/api/admin/appointments/:id/status', simpleAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, org: instanceName } = req.body;
      
      const organization = await db.findOrganizationByInstance(instanceName || 'posto3l');
      if (!organization) return res.status(404).json({ error: 'Org não encontrada' });

      const success = await db.updateAppointmentStatus(id, organization.id, status);
      if (success) {
        res.json({ success: true, message: `Status alterado para ${status}` });
      } else {
        res.status(404).json({ error: 'Agendamento não encontrado' });
      }
    } catch (err) {
      console.error('❌ Erro update status:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = createAdminRoutes;

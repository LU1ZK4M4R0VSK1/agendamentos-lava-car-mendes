// src-bot/booking.routes.js
const { Router } = require('express');
const dayjs = require('dayjs');

function createBookingRoutes(db) {
  const router = Router();

  /**
   * Endpoint público para buscar horários disponíveis
   * GET /api/public/available-slots
   */
  router.get('/api/public/available-slots', async (req, res) => {
    try {
      const { organization_id, date, service_id } = req.query;
      const AppointmentService = require('./services/AppointmentService');
      const aptService = new AppointmentService(db);
      const slots = await aptService.getAvailableSlots(organization_id, date, service_id);
      res.json(slots);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Endpoint público para receber agendamentos do site
   * POST /api/public/bookings
   */
  router.post('/api/public/bookings', async (req, res) => {
    try {
      const { organization_id, customer, vehicle, appointment } = req.body;

      if (!organization_id || !customer || !vehicle || !appointment) {
        return res.status(400).json({ error: 'Dados incompletos' });
      }

      // 1. Validar organização
      const org = await db.findOrganizationByInstance(organization_id);
      if (!org) {
        return res.status(404).json({ error: 'Organização não encontrada' });
      }

      // 2. Calcular horários
      // O site envia "date" (ISO) e "time" (HH:mm)
      const tz = org.timezone || 'America/Sao_Paulo';
      const start = dayjs(`${appointment.date.split('T')[0]} ${appointment.time}`).toISOString();
      
      // Busca a duração do serviço para calcular o fim
      const services = await db.getServicesByOrganization(org.id);
      const service = services.find(s => s.id === appointment.service_id);
      
      // Fallback se o ID não bater (ex: 'simples' vs 'svc_1')
      // Se não achar pelo ID exato, tenta achar pelo nome ou usa 60 min
      const effectiveService = service || services[0]; 
      const duration = effectiveService ? effectiveService.durationMinutes : 60;
      const end = dayjs(start).add(duration, 'minute').toISOString();

      // 3. Salvar no Banco via Transação Lógica
      const result = await db.saveFullBooking({
        organizationId: org.id,
        customer: {
          name: customer.name,
          phone: customer.phone
        },
        vehicle: {
          plate: vehicle.plate,
          model: vehicle.model,
          color: vehicle.color,
          type: vehicle.type // hatch, sedan, suv
        },
        appointment: {
          serviceId: effectiveService.id,
          startTime: start,
          endTime: end,
          totalPrice: appointment.total_price
        }
      });

      console.log(`✅ Novo agendamento via site: ${result.appointmentId} para ${org.name}`);
      
      res.status(201).json({
        success: true,
        booking_id: result.appointmentId,
        message: 'Agendamento realizado com sucesso!'
      });

    } catch (err) {
      console.error('❌ Erro ao processar agendamento do site:', err.message);
      if (err.message === 'CONFLITO_AGENDA') {
        return res.status(409).json({ error: 'Horário já ocupado' });
      }
      res.status(500).json({ error: 'Erro interno ao salvar agendamento' });
    }
  });

  return router;
}

module.exports = createBookingRoutes;

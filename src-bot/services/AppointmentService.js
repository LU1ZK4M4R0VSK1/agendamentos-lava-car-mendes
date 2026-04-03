// src-bot/services/AppointmentService.js
// Lida com agendamentos e horários disponíveis

class AppointmentService {
  /**
   * @param {import('../database/Database')} db
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Obtém os horários disponíveis (Grid de 15 minutos) para uma data e serviço específicos.
   * Funcionalidade Obrigatória via Especificação SaaS
   */
  async getAvailableSlots(organizationId, dateStr, serviceId) {
    const dayjs = require('dayjs');
    const utc = require('dayjs/plugin/utc');
    const timezone = require('dayjs/plugin/timezone');
    dayjs.extend(utc);
    dayjs.extend(timezone);

    const org = await this.db.findOrganizationByInstance(organizationId);
    if (!org) return [];

    const realOrgId = org.id;
    const tz = org.timezone || 'America/Sao_Paulo';
    
    // Busca serviço e appointments
    const services = await this.db.getServicesByOrganization(realOrgId);
    const service = services.find(s => s.id === serviceId);
    if (!service) return [];

    const totalDuration = service.durationMinutes + (service.bufferMinutes || 0);

    const targetDate = dayjs.tz(dateStr, tz);
    const startOfDay = targetDate.startOf('day');
    const endOfDay = targetDate.endOf('day');

    const appointments = await this.db.getAppointmentsByRange(
      realOrgId,
      startOfDay.toISOString(),
      endOfDay.toISOString()
    );

    const daysMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayOfWeek = daysMap[targetDate.day()];
    const bh = org.businessHours ? org.businessHours[dayOfWeek] : null;

    if (!bh || bh.closed) return [];

    const openHour = parseInt(bh.open.split(':')[0], 10);
    const openMinute = parseInt(bh.open.split(':')[1] || 0, 10);
    const closeHour = parseInt(bh.close.split(':')[0], 10);
    const closeMinute = parseInt(bh.close.split(':')[1] || 0, 10);

    let startScan = targetDate.hour(openHour).minute(openMinute).second(0).millisecond(0);
    const endScan = targetDate.hour(closeHour).minute(closeMinute).second(0).millisecond(0);

    const availableSlots = [];
    const nowLocal = dayjs().tz(tz);
    const isToday = targetDate.isSame(nowLocal, 'day');

    // Cria o grid de 15 minutos
    while (startScan.isBefore(endScan)) {
      const slotStart = startScan;
      const slotEnd = slotStart.add(totalDuration, 'minute');

      let isValid = true;
      
      // Se for hoje, tem que ser no futuro
      if (isToday && slotStart.isBefore(nowLocal)) {
         isValid = false;
      }

      // Slot end passed close time?
      if (slotEnd.isAfter(endScan)) {
         isValid = false;
      }

      // Conflito no banco de dados (Range Overlap)
      if (isValid) {
        const isOccupied = appointments.some(app => {
          const appStart = dayjs(app.startTime).tz(tz);
          const appEnd = dayjs(app.endTime).tz(tz);
          // Overlap condition: start < appEnd AND end > appStart
          return slotStart.isBefore(appEnd) && slotEnd.isAfter(appStart);
        });
        if (isOccupied) isValid = false;
      }

      if (isValid) {
        availableSlots.push(slotStart.format('HH:mm'));
      }

      // Pula de 15 em 15!
      startScan = startScan.add(15, 'minute');
    }

    return availableSlots;
  }

  /**
   * Gera o Contexto Dinâmico para o Model
   */
  async generateAvailabilityContext(organization) {
    if (!organization.businessHours) return 'Sem horários ou serviços configurados.';

    const services = await this.db.getServicesByOrganization(organization.id);
    if (!services || services.length === 0) return 'Nenhum serviço configurado nesta unidade.';

    let contextStr = "SERVIÇOS DISPONÍVEIS:\n";
    services.forEach(srv => {
      contextStr += `* ID: ${srv.id} | ${srv.name} | ${srv.durationMinutes} min | R$ ${srv.price}\n`;
    });

    const dayjs = require('dayjs');
    const numDays = 3;
    const startOfToday = dayjs();
    
    // Para simplificar o contexto e não estourar tokens, pegaremos a grade 
    // de disponibilidade do MENOR serviço (já que este representa os blocos livres brutos).
    // A IA é instruída a encaixar.
    const smallestService = services.reduce((prev, curr) => (prev.durationMinutes < curr.durationMinutes ? prev : curr));

    contextStr += `\nHORÁRIOS LIVRES BASES (calculados via ${smallestService.name}):\n`;

    for (let i = 0; i < numDays; i++) {
        const target = startOfToday.add(i, 'day');
        // Hack the org config temporarily to pass down inside `getAvailableSlots`
        organization.timezone = organization.timezone || 'America/Sao_Paulo';
        const slots = await this.getAvailableSlots(organization.id, target.toISOString(), smallestService.id);
        
        const isToday = i === 0;
        const labelDay = isToday ? 'Hoje' : (i === 1 ? 'Amanhã' : target.format('dddd'));
        const dateStr = target.format('DD/MM/YYYY');

        if (slots.length > 0) {
            contextStr += `${labelDay} (${dateStr}): ${slots.join(', ')}\n`;
        } else {
            contextStr += `${labelDay} (${dateStr}): Sem horários\n`;
        }
    }

    contextStr += "\nREGRAS:\n* Sempre usar service_id\n* Nunca inventar serviços\n* Nunca inventar horários\n* Responder em no máximo 2 frases\n* Ser direto e breve";
    return contextStr;
  }
}

module.exports = AppointmentService;

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
   * Gera a lista de horários livres em formato de string para a IA entender.
   */
  async generateAvailabilityContext(organization) {
    if (!organization.businessHours) return 'Sem horários configurados.';

    const now = new Date();
    // Ajusta para o fuso, simplificado pegando UTC -3 = America/Sao_Paulo (o certo seria moment ou dayjs)
    // Estamos assumindo que a data do servidor é razoavelmente perto.
    // Vamos gerar pros próximos 3 dias para não inchar muito o prompt
    
    // Dayjs
    const dayjs = require('dayjs');
    const utc = require('dayjs/plugin/utc');
    const timezone = require('dayjs/plugin/timezone');
    dayjs.extend(utc);
    dayjs.extend(timezone);

    const tz = organization.timezone || 'America/Sao_Paulo';
    const numDays = 3;
    let contextStr = "--- HORÁRIOS DISPONÍVEIS ---\n";
    
    const startOfToday = dayjs().tz(tz).startOf('day');
    const endWindow = startOfToday.add(numDays, 'day');

    // Busca ocupados
    const appointments = await this.db.getAppointmentsByDateRange(
      organization.id,
      startOfToday.toISOString(),
      endWindow.toISOString()
    );

    const daysMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

    for (let i = 0; i < numDays; i++) {
        const currentDate = startOfToday.add(i, 'day');
        const dayOfWeek = daysMap[currentDate.day()];
        const todayBh = organization.businessHours[dayOfWeek];
        
        const isToday = i === 0;
        const dateStr = currentDate.format('DD/MM/YYYY');
        const labelDay = isToday ? 'Hoje' : (i === 1 ? 'Amanhã' : currentDate.format('dddd'));

        if (!todayBh || todayBh.closed) {
            contextStr += `${labelDay} (${dateStr}): Fechado\n`;
            continue;
        }

        const openHour = parseInt(todayBh.open.split(':')[0], 10);
        const closeHour = parseInt(todayBh.close.split(':')[0], 10);
        
        let availableSlots = [];
        
        // Vamos de 1 em 1 hora
        for (let h = openHour; h < closeHour; h++) {
            const slotStart = currentDate.hour(h).minute(0).second(0).millisecond(0);
            
            // Se for hoje e a hora já passou, skip
            if (isToday && slotStart.isBefore(dayjs().tz(tz))) {
                continue;
            }

            // Checa conflito
            const isOccupied = appointments.some(app => {
                const appStart = dayjs(app.startTime).tz(tz);
                return appStart.isSame(slotStart);
            });

            if (!isOccupied) {
                availableSlots.push(slotStart.format('HH:mm'));
            }
        }

        if (availableSlots.length > 0) {
            contextStr += `${labelDay} (${dateStr}): ${availableSlots.join(', ')}\n`;
        } else {
            contextStr += `${labelDay} (${dateStr}): Sem horários livres\n`;
        }
    }

    return contextStr;
  }
}

module.exports = AppointmentService;

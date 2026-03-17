// src-bot/services/BusinessHoursService.js

class BusinessHoursService {
  /**
   * Verifica se o restaurante está aberto agora e calcula o próximo horário.
   * @param {object} businessHours JSON de horários
   * @param {string} timezone Fuso horário (ex: 'America/Sao_Paulo')
   */
  check(businessHours, timezone = 'America/Sao_Paulo') {
    if (!businessHours || typeof businessHours !== 'object') {
      return { isOpen: true, message: 'Horário de funcionamento não configurado.' };
    }

    const now = new Date();
    // Obtém hora local da organização usando Intl
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: false,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    const parts = formatter.formatToParts(now);
    const getPart = (type) => parts.find(p => p.type === type).value;
    
    const currentDay = getPart('weekday').toLowerCase(); // 'sun', 'mon', etc.
    const currentH = parseInt(getPart('hour'));
    const currentM = parseInt(getPart('minute'));
    const currentTimeStr = `${currentH.toString().padStart(2, '0')}:${currentM.toString().padStart(2, '0')}`;

    const hours = businessHours[currentDay];

    if (!hours || hours.closed) {
      return { 
        isOpen: false, 
        currentTime: currentTimeStr,
        status: 'FECHADO',
        message: 'Estamos fechados hoje.',
        nextOpening: this._findNextOpening(businessHours, now, timezone)
      };
    }

    const [openH, openM] = hours.open.split(':').map(Number);
    const [closeH, closeM] = hours.close.split(':').map(Number);

    const currentTotalM = currentH * 60 + currentM;
    const openTotalM = openH * 60 + openM;
    let closeTotalM = closeH * 60 + closeM;

    // Se o horário de fechamento for menor que o de abertura, assumimos que fecha no dia seguinte
    if (closeTotalM < openTotalM) {
      closeTotalM += 24 * 60;
    }

    // Se agora for depois da meia-noite mas antes do fechamento do dia anterior (atendimento noturno)
    // Precisamos checar também o dia anterior se ele fechava "amanhã"
    // Mas para o MVP, vamos focar no dia atual simplificado.
    
    const isOpen = currentTotalM >= openTotalM && currentTotalM <= closeTotalM;

    return {
      isOpen,
      currentTime: currentTimeStr,
      status: isOpen ? 'ABERTO' : 'FECHADO',
      schedule: `${hours.open} às ${hours.close}`,
      nextOpening: isOpen ? null : this._findNextOpening(businessHours, now, timezone)
    };
  }

  _findNextOpening(businessHours, now, timezone) {
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    
    for (let i = 0; i < 7; i++) {
        const nextDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
        const dayName = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short' }).format(nextDate).toLowerCase();
        const hours = businessHours[dayName];

        if (hours && !hours.closed) {
            const [openH, openM] = hours.open.split(':').map(Number);
            
            if (i === 0) {
                // Checa se ainda vai abrir hoje
                const formatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour12: false, hour: '2-digit', minute: '2-digit' });
                const [currH, currM] = formatter.format(now).split(':').map(Number);
                if (currH * 60 + currM < openH * 60 + openM) {
                    return { day: 'hoje', time: hours.open };
                }
            } else {
                const label = i === 1 ? 'amanhã' : new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(nextDate);
                return { day: label, time: hours.open };
            }
        }
    }
    return null;
  }

  getAIPromptContext(businessHours, timezone) {
    const info = this.check(businessHours, timezone);
    let context = `--- INFO DE TEMPO ---\n`;
    context += `Agora são: ${info.currentTime} (${timezone})\n`;
    context += `Status: ${info.status}\n`;
    
    if (info.schedule) context += `Horário de Hoje: ${info.schedule}\n`;
    
    if (!info.isOpen && info.nextOpening) {
      context += `Próxima Abertura: ${info.nextOpening.day} às ${info.nextOpening.time}\n`;
      context += `DIRETIVA: Informe o cliente que estamos fechados, mas seja gentil e diga que ele pode deixar o pedido dele pronto/agendado para quando abrirmos.\n`;
    }
    
    return context;
  }
}

module.exports = BusinessHoursService;

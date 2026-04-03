// src-bot/services/ConfirmationService.js
const axios = require('axios');
const dayjs = require('dayjs');

class ConfirmationService {
  constructor(db, config) {
    this.db = db;
    this.config = config;
  }

  /**
   * Procura agendamentos em ~4 horas e envia mensagem de confirmação
   */
  async checkAndSendConfirmations() {
    const now = dayjs();
    const fourHoursFromNow = now.add(4, 'hour');
    
    // Janela de 1 hora para garantir que pegamos todos mesmo com o delay do setInterval
    const startWindow = fourHoursFromNow.subtract(30, 'minute').toISOString();
    const endWindow = fourHoursFromNow.add(30, 'minute').toISOString();

    if (this.config.DEBUG) {
        console.log(`🔍 Checando confirmações entre ${startWindow} e ${endWindow}`);
    }

    const { rows: appointments } = await this.db.pool.query(
      `SELECT a.*, c.remote_jid, c.push_name, o.instance_name, s.name as service_name
       FROM appointments a
       JOIN customers c ON a.customer_id = c.id
       JOIN organizations o ON a.organization_id = o.id
       JOIN services s ON a.service_id = s.id
       WHERE a.start_time BETWEEN $1 AND $2
         AND a.status = 'agendado'
         AND a.confirmation_sent_at IS NULL`,
      [startWindow, endWindow]
    );

    for (const apt of appointments) {
      try {
        const timeStr = dayjs(apt.start_time).format('HH:mm');
        const message = `Olá ${apt.push_name || 'cliente'}! 🚗\n\nIdentificamos que você tem um agendamento para *${apt.service_name}* hoje às *${timeStr}*.\n\nVocê confirma o seu comparecimento? (Responda com *Sim* ou *Não*)`;

        await this._sendWhatsApp(apt.instance_name, apt.remote_jid, message);

        await this.db.pool.query(
          'UPDATE appointments SET confirmation_sent_at = NOW() WHERE id = $1',
          [apt.id]
        );

        if (this.config.DEBUG) console.log(`✉️ Confirmação enviada para ${apt.remote_jid} (Apt: ${apt.id})`);
      } catch (err) {
        console.error(`❌ Erro ao enviar confirmação para ${apt.id}:`, err.message);
      }
    }
  }

  async _sendWhatsApp(instanceName, to, text) {
    try {
      await axios.post(
        `${this.config.EVOLUTION_API_URL}/message/sendText/${instanceName}`,
        {
          number: to,
          options: { delay: this.config.MESSAGE_DELAY_MS, presence: 'composing' },
          text,
        },
        { headers: { apikey: this.config.EVOLUTION_APIKEY } }
      );
    } catch (err) {
       throw new Error(`Evolution API Error: ${err.response?.data?.message || err.message}`);
    }
  }
}

module.exports = ConfirmationService;

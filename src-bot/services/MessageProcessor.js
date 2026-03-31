// src-bot/services/MessageProcessor.js
// Extrai pedidos e limpa tags da resposta do Gemini

class MessageProcessor {
  /**
   * Extrai dados de [PEDIDO_FECHADO] da resposta
   * @param {string} raw
   * @returns {object|null}
   */
  extractOrder(raw) {
    const match = raw.match(/\[\s*PEDIDO[_\s]?FECHADO\s*\]([\s\S]*?)\[\s*\/\s*PEDIDO[_\s]?FECHADO\s*\]/i);
    if (!match) return null;

    const order = {};
    for (const line of match[1].trim().split('\n')) {
      const i = line.indexOf(':');
      if (i > 0) {
        const key = line.substring(0, i).trim().toLowerCase().replace(/[_\s]/g, '');
        const val = line.substring(i + 1).trim();
        if (key && val) order[key] = val;
      }
    }
    return Object.keys(order).length > 0 ? order : null;
  }

  /**
   * Detecta se a IA solicitou o envio do cardápio
   * @param {string} raw
   * @returns {boolean}
   */
  detectMenuRequest(raw) {
    return /\[\s*ENVIAR[_\s]?CARDAPIO\s*\]/i.test(raw);
  }

  /**
   * Extrai dados de [AGENDAMENTO_FECHADO] da resposta
   * @param {string} raw
   * @returns {object|null}
   */
  extractAppointment(raw) {
    const match = raw.match(/\[\s*AGENDAMENTO[_\s]?FECHADO\s*\]([\s\S]*?)\[\s*\/\s*AGENDAMENTO[_\s]?FECHADO\s*\]/i);
    if (!match) return null;

    const apt = {};
    for (const line of match[1].trim().split('\n')) {
      const i = line.indexOf(':');
      if (i > 0) {
        const key = line.substring(0, i).trim().toLowerCase().replace(/\s/g, '');
        const val = line.substring(i + 1).trim();
        if (key && val) apt[key] = val;
      }
    }
    return Object.keys(apt).length > 0 ? apt : null;
  }

  /**
   * Remove todas as tags de analytics e controle da resposta
   * @param {string} raw
   * @returns {string}
   */
  clean(raw) {
    return raw
      .replace(/\[\s*PEDIDO[_\s]?FECHADO\s*\][\s\S]*?\[\s*\/\s*PEDIDO[_\s]?FECHADO\s*\]/gi, '')
      .replace(/\[\s*AGENDAMENTO[_\s]?FECHADO\s*\][\s\S]*?\[\s*\/\s*AGENDAMENTO[_\s]?FECHADO\s*\]/gi, '')
      .replace(/\[\s*ANALYTICS\s*\][\s\S]*?\[\s*\/\s*ANALYTICS\s*\]/gi, '')
      .replace(/\[\s*NAO[_\s]?TEMOS\s*\][\s\S]*?\[\s*\/\s*NAO[_\s]?TEMOS\s*\]/gi, '')
      .replace(/\[\s*ENVIAR[_\s]?CARDAPIO\s*\]/gi, '')
      .trim();
  }
}


module.exports = MessageProcessor;

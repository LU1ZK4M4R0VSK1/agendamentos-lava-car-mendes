// src-bot/domain/Message.js
// Entidade Message — simplificada

const { randomUUID } = require('crypto');

class Message {
  constructor({ id, conversationId, whatsappMessageId, direction, content, messageType, senderJid, timestamp }) {
    this.id = id || randomUUID();
    this.conversationId = conversationId;
    this.whatsappMessageId = whatsappMessageId || null;
    this.direction = direction; // 'inbound' | 'outbound'
    this.content = content || null;
    this.messageType = messageType || 'text';
    this.senderJid = senderJid || null;
    this.timestamp = timestamp || Math.floor(Date.now() / 1000);
  }
}

module.exports = Message;

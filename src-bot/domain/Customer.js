// src-bot/domain/Customer.js
// Entidade Customer — simplificada

const { randomUUID } = require('crypto');

class Customer {
  constructor({ id, remoteJid, pushName, phone, organizationId }) {
    this.id = id || randomUUID();
    this.remoteJid = remoteJid;
    this.pushName = pushName || null;
    this.phone = phone || (remoteJid ? remoteJid.split('@')[0] : null);
    this.organizationId = organizationId;
  }
}

module.exports = Customer;

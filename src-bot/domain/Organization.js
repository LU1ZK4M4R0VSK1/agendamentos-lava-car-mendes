// src-bot/domain/Organization.js
// Entidade Organization — mantida

const { randomUUID } = require('crypto');

class Organization {
  constructor({ id, name, type, phone, instanceName, systemPrompt, timezone }) {
    this.id = id || randomUUID();
    this.name = name;
    this.type = type || 'general';
    this.phone = phone || null;
    this.instanceName = instanceName;
    this.systemPrompt = systemPrompt || null;
    this.timezone = timezone || 'America/Sao_Paulo';
  }
}

module.exports = Organization;

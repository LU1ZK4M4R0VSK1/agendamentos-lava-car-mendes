// src-bot/domain/Conversation.js
// Entidade Conversation — simplificada (sem stage/sentiment)

const { randomUUID } = require('crypto');

class Conversation {
  constructor({ id, customerId, organizationId, instanceName, status, startedAt, lastMessageAt, closedAt }) {
    this.id = id || randomUUID();
    this.customerId = customerId;
    this.organizationId = organizationId;
    this.instanceName = instanceName || null;
    this.status = status || 'active';
    this.startedAt = startedAt || new Date().toISOString();
    this.lastMessageAt = lastMessageAt || new Date().toISOString();
    this.closedAt = closedAt || null;
  }

  isExpired(timeoutMinutes) {
    return (Date.now() - new Date(this.lastMessageAt).getTime()) > timeoutMinutes * 60 * 1000;
  }
}

module.exports = Conversation;

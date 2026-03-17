// src-bot/domain/ServiceRequest.js
// Entidade genérica para pedidos e solicitações — simplificada

class ServiceRequest {
  constructor({ id, conversationId, customerId, organizationId, type, status, details, createdAt }) {
    this.id = id || `PED-${Date.now()}`;
    this.conversationId = conversationId;
    this.customerId = customerId;
    this.organizationId = organizationId;
    this.type = type || 'general';
    this.status = status || 'pending';
    this.details = typeof details === 'object' ? JSON.stringify(details) : (details || null);
    this.createdAt = createdAt || new Date().toISOString();
  }

  getDetails() {
    if (!this.details) return {};
    try { return JSON.parse(this.details); } catch { return { raw: this.details }; }
  }
}

module.exports = ServiceRequest;

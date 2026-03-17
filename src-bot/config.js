// src-bot/config.js
// Configurações centralizadas do MVP

const path = require('path');

const config = {
  PORT: process.env.BOT_PORT || 3001,
  DEBUG: process.env.BOT_DEBUG !== 'false',

  // Evolution API
  EVOLUTION_API_URL: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
  EVOLUTION_APIKEY: process.env.EVOLUTION_APIKEY || 'teste123api',

  // Gemini
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  GEMINI_TEMPERATURE: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
  GEMINI_MAX_TOKENS: parseInt(process.env.GEMINI_MAX_TOKENS || '1500', 10),

  // Banco de Dados
  DATABASE_PATH: process.env.DATABASE_PATH || path.join(__dirname, 'data', 'bot.db'),

  // Sessão de Conversa
  CONVERSATION_TIMEOUT_MINUTES: parseInt(process.env.CONVERSATION_TIMEOUT_MINUTES || '30', 10),

  // Envio de Mensagens
  MESSAGE_DELAY_MS: parseInt(process.env.MESSAGE_DELAY_MS || '500', 10),

  // Grupo Admin (JID do grupo WhatsApp para comandos de pedido)
  ADMIN_GROUP_JID: process.env.ADMIN_GROUP_JID || '120363426806631355@g.us',
};

module.exports = config;

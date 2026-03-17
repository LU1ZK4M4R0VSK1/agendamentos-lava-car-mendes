// src-bot/index.js
// Entry point — MVP simplificado

require('dotenv').config();
const express = require('express');
const config = require('./config');
const Database = require('./database/Database');
const AIService = require('./services/AIService');
const MessageProcessor = require('./services/MessageProcessor');
const StatsService = require('./services/StatsService');
const BusinessHoursService = require('./services/BusinessHoursService');
const WebhookHandler = require('./services/WebhookHandler');
const createRoutes = require('./webhook.routes');

function main() {
  console.log('🚀 Iniciando Bot MVP...');
  console.log(`📍 Config: Model=${config.GEMINI_MODEL}, Key=${config.GEMINI_API_KEY ? config.GEMINI_API_KEY.substring(0, 8) + '...' : 'MISSING'}`);

  // 1. Banco
  const db = new Database(config.DATABASE_PATH).initialize();

  // 2. Serviços
  const aiService = new AIService({
    apiKey: config.GEMINI_API_KEY,
    model: config.GEMINI_MODEL,
    temperature: config.GEMINI_TEMPERATURE,
    maxTokens: config.GEMINI_MAX_TOKENS,
    debug: config.DEBUG,
  });

  const messageProcessor = new MessageProcessor();
  const statsService = new StatsService({ db });
  const businessHoursService = new BusinessHoursService();
  const webhookHandler = new WebhookHandler({ db, aiService, messageProcessor, statsService, businessHoursService, config });

  // 3. Express
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use(createRoutes(webhookHandler));

  // 4. Limpeza periódica de conversas expiradas (a cada 5 min)
  setInterval(() => {
    const closed = db.closeExpiredConversations(config.CONVERSATION_TIMEOUT_MINUTES);
    if (closed > 0 && config.DEBUG) console.log(`🧹 ${closed} conversa(s) expirada(s) fechada(s)`);
  }, 5 * 60 * 1000);

  // 5. Start
  app.listen(config.PORT, () => {
    console.log(`🤖 Bot rodando em http://localhost:${config.PORT}/webhook`);
    console.log(`❤️  Health: http://localhost:${config.PORT}/health`);

    const orgs = db.findAllOrganizations();
    if (orgs.length === 0) {
      console.log('\n⚠️  Nenhuma organização. Execute: node src-bot/seed.js');
    } else {
      console.log(`\n📋 Organizações (${orgs.length}):`);
      orgs.forEach(o => console.log(`   • ${o.name} (${o.instanceName})`));
    }
  });

  // Graceful shutdown
  const shutdown = () => { db.close(); process.exit(0); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();

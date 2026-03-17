// src-bot/webhook.routes.js
// Rota do webhook + health check

const { Router } = require('express');

function createRoutes(webhookHandler) {
  const router = Router();

  router.post('/webhook', async (req, res) => {
    res.sendStatus(200); // Responde imediatamente
    try {
      await webhookHandler.handle(req.body);
    } catch (err) {
      console.error('❌ Webhook erro:', err.message);
    }
  });

  router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return router;
}

module.exports = createRoutes;

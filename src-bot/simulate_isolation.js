const axios = require('axios');

const BOT_URL = 'http://localhost:3001/webhook';

async function sendMockWebhook(instance, from, text) {
  const payload = {
    event: 'messages.upsert',
    instance: instance,
    data: {
      key: {
        remoteJid: from + '@s.whatsapp.net',
        fromMe: false,
        id: 'SIMULATION_' + Date.now(),
      },
      pushName: 'Cliente Teste',
      message: {
        conversation: text,
      },
      messageType: 'conversation',
    },
  };

  try {
    console.log(`📤 Enviando para [${instance}]: "${text}"`);
    await axios.post(BOT_URL, payload);
  } catch (err) {
    console.error(`❌ Erro ao enviar webhook: ${err.message}`);
  }
}

async function runSimulation() {
  console.log('🚀 Iniciando simulação de isolamento multitenant...\n');

  // Teste 1: Aero Lanches (Sara) pede cardápio
  console.log('--- Teste Aero Lanches ---');
  await sendMockWebhook('aero-lanches', '5511999999999', 'Olá, gostaria de ver o cardápio do Aero Lanches');

  // Aguarda mais tempo para o processamento e rate limit
  await new Promise(r => setTimeout(r, 20000));

  // Teste 2: Pizzaria do Zé (Zé) pede cardápio
  console.log('\n--- Teste Pizzaria do Zé ---');
  await sendMockWebhook('pizzaria-ze', '5511888888888', 'E aí Zé, manda o cardápio da pizzaria aí!');

  await new Promise(r => setTimeout(r, 20000));

  console.log('\n✅ Simulação enviada. Verifique os logs do bot para confirmar o isolamento.');
}

runSimulation();

const axios = require('axios');
const fs = require('fs');

async function setupInstances() {
  const baseURL = 'http://localhost:8081/instance';
  const apikey = 'teste123api';
  const instances = [
    { name: 'ebot-monitor', qr: true },
    { name: 'pizzaria-tomazina', qr: true }
  ];

  for (const inst of instances) {
    try {
      console.log(`🆕 Criando ${inst.name}...`);
      await axios.post(`${baseURL}/create`, {
        instanceName: inst.name,
        token: inst.name,
        qrcode: inst.qr,
        integration: 'WHATSAPP-BAILEYS'
      }, { headers: { apikey } });
    } catch (e) {
      console.log(`❌ Erro ao criar ${inst.name}: ${e.message}`);
    }
  }

  // Esperar e pegar QR de ebot-monitor primeiro
  const monitorName = 'ebot-monitor';
  console.log(`🔌 Aguardando QR para ${monitorName}...`);
  for (let i = 1; i <= 20; i++) {
    try {
      const res = await axios.get(`${baseURL}/connect/${monitorName}`, { headers: { apikey } });
      if (res.data.qrcode?.base64) {
        fs.writeFileSync('d:/evolution-api/src-bot/monitor_qr_final.txt', res.data.qrcode.base64);
        console.log('✅ QR_READY_MONITOR');
        break;
      }
      console.log(`⏳ Iteração ${i}...`);
    } catch (e) {}
    await new Promise(r => setTimeout(r, 4000));
  }
}

setupInstances();

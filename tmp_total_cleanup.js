const axios = require('axios');

async function clearAndFresh() {
  const baseURL = 'http://localhost:8081/instance';
  const apikey = 'teste123api';
  const names = ['monitor-bot', 'monitor-alfa', 'monitor-master', 'evolution-monitor', 'monitor-final'];

  console.log('🗑️ Iniciando limpeza total...');
  for (const name of names) {
    try {
      console.log('Deletando ' + name + '...');
      await axios.delete(`${baseURL}/delete/${name}`, { headers: { apikey } });
    } catch (e) {}
  }

  console.log('⏳ Aguardando limpeza do banco...');
  await new Promise(r => setTimeout(r, 10000));

  console.log('🆕 Criando ebot-monitor...');
  const instanceName = 'ebot-monitor';
  await axios.post(`${baseURL}/create`, {
    instanceName,
    token: instanceName,
    qrcode: true,
    integration: 'WHATSAPP-BAILEYS'
  }, { headers: { apikey } });

  console.log('🔌 Aguardando QR ( eb-monitor )...');
  const url = `${baseURL}/connect/${instanceName}`;
  
  let success = false;
  for (let i = 1; i <= 20; i++) {
    try {
      const res = await axios.get(url, { headers: { apikey } });
      if (res.data.qrcode?.base64) {
        require('fs').writeFileSync('d:/evolution-api/src-bot/monitor_qr_final.txt', res.data.qrcode.base64);
        console.log('✅ QR_READY');
        success = true;
        break;
      }
      console.log('⏳ Iteração ' + i + '...');
    } catch (e) {
      console.log('❌ Erro: ' + e.message);
    }
    await new Promise(r => setTimeout(r, 4000));
  }
}

clearAndFresh();

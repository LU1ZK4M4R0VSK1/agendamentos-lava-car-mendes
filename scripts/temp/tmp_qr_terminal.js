const axios = require('axios');
const qrcode = require('qrcode-terminal');

async function showQR() {
  const baseURL = 'http://localhost:8081/instance';
  const apikey = 'teste123api';
  const instanceName = 'ebot-monitor';

  console.log('🔍 Buscando QR para ' + instanceName + '...');
  
  try {
    const res = await axios.get(`${baseURL}/connect/${instanceName}`, { headers: { apikey } });
    if (res.data.qrcode?.code) {
      console.log('\n✅ ESCANEIE O QR CODE ABAIXO NO WHATSAPP:\n');
      qrcode.generate(res.data.qrcode.code, { small: true });
      console.log('\n----------------------------------------\n');
    } else {
      console.log('⏳ QR não está pronto. Tente novamente em alguns segundos.');
    }
  } catch (e) {
    console.error('❌ Erro:', e.message);
  }
}

showQR();

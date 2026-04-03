const axios = require('axios');
const qrcode = require('qrcode-terminal');

async function finalSetup() {
  const baseURL = 'http://localhost:8081/instance';
  const apikey = 'teste123api';
  const name = 'monitor';

  console.log('🔌 Buscando QR para monitor (Terminal)...');
  for (let i = 1; i <= 30; i++) {
    try {
      const res = await axios.get(`${baseURL}/connect/${name}`, { headers: { apikey } });
      if (res.data.qrcode?.code) {
        console.log('\n✅ ESCANEIE ABAIXO ( INSTANCIA MONITOR ):\n');
        qrcode.generate(res.data.qrcode.code, { small: true });
        console.log('\n----------------------------------------\n');
        return;
      }
      console.log(`⏳ Iteração ${i}...`);
    } catch (e) {}
    await new Promise(r => setTimeout(r, 4000));
  }
}

finalSetup();

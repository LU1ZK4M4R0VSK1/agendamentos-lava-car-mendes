const axios = require('axios');
const qrcode = require('qrcode-terminal');

async function finalTerminals() {
  const baseURL = 'http://localhost:8081/instance';
  const apikey = 'teste123api';
  const names = ['monitor', 'pizzaria-tomazina'];

  console.log('🔌 Buscando QR Codes (Terminal)...');
  
  for (const name of names) {
    let success = false;
    console.log(`\n🔍 Verificando ${name}...`);
    for (let i = 1; i <= 20; i++) {
        try {
            const res = await axios.get(`${baseURL}/connect/${name}`, { headers: { apikey } });
            if (res.data.qrcode?.code) {
                console.log(`\n✅ ESCANEIE PARA: [ ${name} ]\n`);
                qrcode.generate(res.data.qrcode.code, { small: true });
                console.log('\n----------------------------------------\n');
                success = true;
                break;
            }
        } catch (e) {}
        await new Promise(r => setTimeout(r, 3000));
    }
    if (!success) console.log(`⏳ ${name} não ficou pronto a tempo.`);
  }
}

finalTerminals();

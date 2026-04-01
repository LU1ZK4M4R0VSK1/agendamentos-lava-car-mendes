const axios = require('axios');
const qrcode = require('qrcode-terminal');

async function waitAndShow() {
  const baseURL = 'http://localhost:8081/instance';
  const apikey = 'teste123api';
  const instances = ['ebot-monitor', 'pizzaria-tomazina'];

  console.log('🔄 Aguardando QR Codes no terminal...');

  let readyCount = 0;
  while (readyCount < instances.length) {
    for (const name of instances) {
      try {
        const res = await axios.get(`${baseURL}/connect/${name}`, { headers: { apikey } });
        if (res.data.qrcode?.code) {
          console.log(`\n✅ QR CODE PARA: [ ${name} ]\n`);
          qrcode.generate(res.data.qrcode.code, { small: true });
          console.log('\n----------------------------------------\n');
          readyCount++;
          // Removendo da lista após mostrar
          instances.splice(instances.indexOf(name), 1);
        } else {
          console.log(`⏳ ${name}: Aguardando inicialização...`);
        }
      } catch (e) {
        // console.log(`❌ ${name}: ${e.message}`);
      }
    }
    if (readyCount < 2) await new Promise(r => setTimeout(r, 4000));
  }
}

waitAndShow();

const axios = require('axios');
const fs = require('fs');

async function retryAndFix() {
  const baseURL = 'http://localhost:8081/instance';
  const apikey = 'teste123api';
  const instanceName = 'evolution-monitor';
  const htmlPath = 'C:/Users/Dudu/.gemini/antigravity/brain/4b9e3ba0-1d36-4102-a031-c521b36b9649/QR-MONITOR-ALFA.html';

  console.log('🔄 Aguardando QR para ' + instanceName + '...');

  let success = false;
  let attempts = 0;
  const maxAttempts = 20;

  while (!success && attempts < maxAttempts) {
    attempts++;
    try {
      const res = await axios.get(`${baseURL}/connect/${instanceName}`, { headers: { apikey } });
      if (res.data.qrcode?.base64) {
        let html = fs.readFileSync(htmlPath, 'utf8');
        html = html.replace(/src="data:image\/png;base64,[^"]+"/, `src="${res.data.qrcode.base64}"`);
        fs.writeFileSync(htmlPath, html);
        console.log('✅ QR_FIXED_IN_HTML_ATTEMPT_' + attempts);
        success = true;
      } else {
        console.log('⏳ Iteração ' + attempts + ': QR não gerado...');
        // Force reconnect if it's stuck
        if (attempts === 5) {
            console.log('🔌 Forçando tentativa de conexão...');
            await axios.get(`${baseURL}/connect/${instanceName}`, { headers: { apikey } });
        }
      }
    } catch (e) {
      console.log('❌ Erro: ' + e.message);
    }
    if (!success) await new Promise(r => setTimeout(r, 3000));
  }
}

retryAndFix();

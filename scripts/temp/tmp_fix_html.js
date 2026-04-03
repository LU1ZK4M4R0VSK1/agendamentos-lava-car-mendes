const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function refreshAndFixHTML() {
  const url = 'http://localhost:8081/instance/connect/evolution-monitor';
  const apikey = 'teste123api';
  const htmlPath = 'C:/Users/Dudu/.gemini/antigravity/brain/4b9e3ba0-1d36-4102-a031-c521b36b9649/QR-MONITOR-ALFA.html';

  try {
    const res = await axios.get(url, { headers: { apikey } });
    if (res.data.qrcode?.base64) {
      const base64 = res.data.qrcode.base64;
      let htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      // Replace the src content
      htmlContent = htmlContent.replace(/src="data:image\/png;base64,[^"]+"/, `src="${base64}"`);
      
      fs.writeFileSync(htmlPath, htmlContent);
      console.log('✅ HTML_UPDATED_WITH_FRESH_QR');
    } else {
      console.log('❌ QR_NOT_READY');
    }
  } catch (err) {
    console.error('ERROR', err.message);
  }
}

refreshAndFixHTML();

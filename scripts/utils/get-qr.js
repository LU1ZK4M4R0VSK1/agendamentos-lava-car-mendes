const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function getQr() {
  try {
    const response = await axios.get('http://localhost:8081/instance/connect/pizzaria-tomazina', {
      headers: { 'apikey': 'teste123api' }
    });
    
    if (response.data && response.data.base64) {
      const base64Data = response.data.base64.replace(/^data:image\/png;base64,/, "");
      const filePath = path.join('C:\\Users\\Dudu\\.gemini\\antigravity\\brain\\0d84e988-673a-497c-98d2-34432553ce85', 'qrcode.png');
      fs.writeFileSync(filePath, base64Data, 'base64');
      console.log('Success: ' + filePath);
    } else {
      console.error('No base64 found in response');
    }
  } catch (err) {
    console.error('Error fetching QR:', err.message);
  }
}

getQr();

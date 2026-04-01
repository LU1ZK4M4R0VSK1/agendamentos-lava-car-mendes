const axios = require('axios');
const fs = require('fs');

async function getQRCode() {
  const url = 'http://localhost:8081/instance/connect/monitor-bot';
  const apikey = 'teste123api';

  try {
    const res = await axios.get(url, { headers: { apikey } });
    if (res.data.qrcode?.base64) {
      console.log('QR_CODE_READY');
      fs.writeFileSync('d:/evolution-api/src-bot/monitor_qr.txt', res.data.qrcode.base64);
    } else {
      console.log('QR_CODE_NOT_READY:' + JSON.stringify(res.data));
    }
  } catch (err) {
    console.error('❌ Erro ao obter QR Code:', err.response?.data || err.message);
  }
}

getQRCode();

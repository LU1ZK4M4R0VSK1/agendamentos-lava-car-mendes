const axios = require('axios');
const fs = require('fs');

async function getQRCode() {
  const url = 'http://localhost:8081/instance/connect/monitor-master';
  const apikey = 'teste123api';

  try {
    const res = await axios.get(url, { headers: { apikey } });
    if (res.data.qrcode?.base64) {
      // Remove data:image/png;base64, prefix if present
      const base64 = res.data.qrcode.base64.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync('d:/evolution-api/src-bot/monitor_qr_base64.txt', base64);
      console.log('SAVED_SUCCESSFULLY');
    } else {
      console.log('NOT_READY');
    }
  } catch (err) {
    console.error('ERROR', err.message);
  }
}

getQRCode();

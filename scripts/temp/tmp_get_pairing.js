const axios = require('axios');

async function getPairingCode() {
  const url = 'http://localhost:8081/instance/connect/monitor';
  const apikey = 'teste123api';
  const params = {
    number: '554191736878'
  };

  try {
    const res = await axios.get(url, { headers: { apikey }, params });
    if (res.data.pairingCode) {
        console.log('NOVO_CODIGO:' + res.data.pairingCode);
    } else {
        console.log('RESULTADO:' + JSON.stringify(res.data));
    }
  } catch (err) {
    console.error('❌ Erro ao conectar:', err.response?.data || err.message);
  }
}

getPairingCode();

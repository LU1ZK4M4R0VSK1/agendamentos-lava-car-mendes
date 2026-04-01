const axios = require('axios');

async function createInstance() {
  const url = 'http://localhost:8081/instance/create';
  const apikey = 'teste123api';
  const body = {
    instanceName: 'monitor',
    token: 'monitor',
    number: '554191736878',
    qrcode: false,
    integration: 'WHATSAPP-BAILEYS'
  };

  try {
    const res = await axios.post(url, body, { headers: { apikey } });
    console.log('✅ Instância monitor criada:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    if (err.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️  Instância já existe.');
        return;
    }
    console.error('❌ Erro ao criar instância:', err.response?.data || err.message);
  }
}

createInstance();

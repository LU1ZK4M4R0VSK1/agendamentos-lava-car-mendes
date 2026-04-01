const axios = require('axios');

async function listModels(key) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  try {
    const res = await axios.get(url);
    console.log(`✅ Chave ${key.substring(0, 10)}... Modelos encontrados:`);
    console.log(JSON.stringify(res.data.models.map(m => m.name), null, 2));
    return true;
  } catch (err) {
    console.log(`❌ Chave ${key.substring(0, 10)}... Erro ao listar: ${err.response?.status || err.message}`);
    if (err.response?.data) {
      console.log('Data:', JSON.stringify(err.response.data, null, 2));
    }
    return false;
  }
}

const userKey = 'AIzaSyCHhQkHqxeNpShS_x8kVxxAH_7m-aCb4Xw';
listModels(userKey);

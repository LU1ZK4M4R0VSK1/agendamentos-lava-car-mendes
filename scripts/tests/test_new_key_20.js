const axios = require('axios');

async function testKey(key) {
  const model = 'gemini-2.0-flash'; // Usando o que apareceu na lista
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: 'Oi, responda apenas com OK se estiver funcionando.' }] }]
  };

  try {
    const res = await axios.post(url, body);
    console.log(`✅ Chave ${key.substring(0, 10)}... Funcionando com ${model}!`);
    console.log(`Resposta: ${res.data.candidates?.[0]?.content?.parts?.[0]?.text}`);
    return true;
  } catch (err) {
    console.log(`❌ Chave ${key.substring(0, 10)}... Erro: ${err.response?.status || err.message}`);
    if (err.response?.data) {
      console.log('Data:', JSON.stringify(err.response.data, null, 2));
    }
    return false;
  }
}

const userKey = 'AIzaSyCHhQkHqxeNpShS_x8kVxxAH_7m-aCb4Xw';
testKey(userKey);

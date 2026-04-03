const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testKey(key) {
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Oi, responda apenas com OK se estiver funcionando.');
    console.log(`✅ Chave ${key.substring(0, 10)}... Funcionando!`);
    console.log(`Respost: ${result.response.text()}`);
    return true;
  } catch (error) {
    console.log(`❌ Chave ${key.substring(0, 10)}... Erro: ${error.message}`);
    if (error.response?.data) {
        console.log('Data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

const userKey = 'AIzaSyBH4PFyajju8vde7H_B9OGPWdQcdHaRM0U';
testKey(userKey);

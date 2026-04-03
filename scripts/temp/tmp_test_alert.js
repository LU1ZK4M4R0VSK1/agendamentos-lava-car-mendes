const axios = require('axios');
require('dotenv').config();

async function testAlert() {
  const url = `http://localhost:8081/message/sendText/monitor`;
  const apikey = 'teste123api';
  const groupJid = '120363424115940241@g.us';

  console.log('🧪 Iniciando teste de alerta para:', groupJid);

  try {
    const response = await axios.post(
      url,
      {
        number: groupJid,
        text: '🧪 *TESTE DE MONITORAMENTO:* O sistema de alertas proativos está ATIVO e OPERALIONAL! \n\n🛡️ Segurança do Servidor confirmada.',
        options: { delay: 500, presence: 'composing' }
      },
      { headers: { apikey } }
    );
    console.log('✅ Alerta enviado com sucesso!');
    console.log('📦 Resposta:', JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error('❌ Falha ao enviar alerta:', err.response ? err.response.data : err.message);
  }
}

testAlert();

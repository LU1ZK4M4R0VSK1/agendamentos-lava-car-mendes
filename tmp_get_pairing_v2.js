const axios = require('axios');

async function getPairingCode() {
  const instanceName = 'monitor';
  const url = `http://localhost:8081/instance/connect/${instanceName}`;
  const apikey = 'teste123api';
  const number = '554191736878';

  console.log(`🔌 Solicitando Código de Pareamento para ${instanceName} (${number})...`);

  try {
    // Primeiro, garantir que a instância saiba o número
    const res = await axios.get(url, { 
      headers: { apikey }, 
      params: { number } 
    });

    console.log('⏳ Aguardando processamento do código...');
    
    // Pequeno loop para pegar o código se não vier de primeira
    for (let i = 1; i <= 5; i++) {
        await new Promise(r => setTimeout(r, 4000));
        const check = await axios.get(url, { headers: { apikey } });
        if (check.data.qrcode?.pairingCode) {
            console.log('\n✅ CÓDIGO DE PAREAMENTO WHATSAPP:\n');
            console.log('      [ ' + check.data.qrcode.pairingCode + ' ]');
            console.log('\n----------------------------------------\n');
            console.log('👉 No seu WhatsApp:');
            console.log('1. Vá em Aparelhos Conectados');
            console.log('2. Clique em Conectar um Aparelho');
            console.log('3. Clique em "Conectar com número de telefone" (embaixo)');
            console.log('4. Digite o código acima.');
            return;
        }
        console.log(`⏳ Tentativa ${i}...`);
    }

    console.log('❌ O código não foi gerado. Resposta:', JSON.stringify(res.data));
  } catch (err) {
    console.error('❌ Erro:', err.response?.data || err.message);
  }
}

getPairingCode();

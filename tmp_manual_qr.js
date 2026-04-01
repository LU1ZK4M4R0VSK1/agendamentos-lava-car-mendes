const qrcodeTerminal = require('qrcode-terminal');
const fs = require('fs');

try {
    const data = JSON.parse(fs.readFileSync('d:\\evolution-api\\pairing_res.json', 'utf8'));
    const code = data.code;
    
    if (code) {
        console.log('\n📱 LEIA ESTE QR CODE NO SEU WHATSAPP (INSTÂNCIA MONITOR):\n');
        qrcodeTerminal.generate(code, { small: true });
        console.log('\n--------------------------------------------------\n');
        console.log('👉 Se este falhar, me avise.');
    } else {
        console.log('❌ Nenhum código QR encontrado no JSON.');
    }
} catch (err) {
    console.error('❌ Erro:', err.message);
}

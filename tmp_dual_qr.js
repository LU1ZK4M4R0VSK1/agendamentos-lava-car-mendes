const qrcodeTerminal = require('qrcode-terminal');
const fs = require('fs');

function showQR(file, label) {
    try {
        if (!fs.existsSync(file)) return;
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        const code = data.code;
        
        if (code) {
            console.log(`\n📱 QR CODE: ${label}\n`);
            qrcodeTerminal.generate(code, { small: true });
        }
    } catch (err) {}
}

console.log('\n🚀 EVOLUTION API - CONEXÃO 2026 🚀\n');
showQR('d:\\evolution-api\\pairing_res.json', 'INSTÂNCIA MONITOR');
console.log('\n--------------------------------------------------\n');
showQR('d:\\evolution-api\\tomazina_res.json', 'PIZZARIA TOMAZINA');
console.log('\n--------------------------------------------------\n');
console.log('👉 Leia no seu WhatsApp em: Aparelhos Conectados > Conectar um Aparelho');

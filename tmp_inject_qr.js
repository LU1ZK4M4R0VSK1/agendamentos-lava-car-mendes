const fs = require('fs');
const path = require('path');

const htmlPath = 'C:\\Users\\Dudu\\.gemini\\antigravity\\brain\\4b9e3ba0-1d36-4102-a031-c521b36b9649\\TELA-CHEIA-QR.html';
const monitorJson = 'd:\\evolution-api\\pairing_res.json';
const tomazinaJson = 'd:\\evolution-api\\tomazina_res.json';

try {
    let html = fs.readFileSync(htmlPath, 'utf8');

    if (fs.existsSync(monitorJson)) {
        const monData = JSON.parse(fs.readFileSync(monitorJson, 'utf8'));
        if (monData.base64) {
            html = html.replace('{{QR_MONITOR}}', monData.base64);
        }
    }

    if (fs.existsSync(tomazinaJson)) {
        const tomData = JSON.parse(fs.readFileSync(tomazinaJson, 'utf8'));
        if (tomData.base64) {
            html = html.replace('{{QR_TOMAZINA}}', tomData.base64);
        }
    }

    fs.writeFileSync(htmlPath, html);
    console.log('✅ QR Codes injetados com sucesso em TELA-CHEIA-QR.html');
} catch (err) {
    console.error('❌ Erro na injeção:', err.message);
}

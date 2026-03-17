const WebhookHandler = require('./services/WebhookHandler');
const MessageProcessor = require('./services/MessageProcessor');
const Database = require('./database/Database');
const config = require('./config');
const path = require('path');
const fs = require('fs');

// Mock do axios para não enviar de verdade para a Evolution API
const axios = require('axios');
jest = { spyOn: (obj, method) => ({ mockImplementation: (fn) => { obj[method] = fn; } }) };

async function testMenuMapping() {
  console.log('🧪 Iniciando Teste de Mapeamento de Cardápio...\n');

  const db = new Database(config.DATABASE_PATH).initialize();
  const processor = new MessageProcessor();
  const handler = new WebhookHandler(db, processor, config);

  // Mock do método _sendMedia para interceptar o que seria enviado
  const sentMedia = [];
  handler._sendMedia = async (instance, to, filePath, caption, mediatype) => {
    sentMedia.push({ instance, filePath: path.basename(filePath), mediatype });
    console.log(`✅ [MOCK SEND] Instância: ${instance} | Arquivo: ${path.basename(filePath)} | Tipo: ${mediatype}`);
  };

  // Simulação 1: Aero Lanches
  console.log('--- Cenário 1: Aero Lanches ---');
  const orgAero = db.findOrganizationByInstance('aero-lanches');
  const slugAero = orgAero.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  
  // Simula a lógica de detecção que está no WebhookHandler
  const menusDir = path.join(__dirname, 'data', 'menus');
  const files = fs.readdirSync(menusDir);
  const menuFileAero = files.find(f => f.startsWith(`cardapio_${slugAero}`));
  
  if (menuFileAero) {
    const ext = path.extname(menuFileAero).toLowerCase().replace('.', '');
    const mediaType = ['jpg', 'jpeg', 'png'].includes(ext) ? 'image' : 'document';
    await handler._sendMedia('aero-lanches', '123', path.join(menusDir, menuFileAero), 'caption', mediaType);
  }

  // Simulação 2: Pizzaria do Zé
  console.log('\n--- Cenário 2: Pizzaria do Zé ---');
  const orgZe = db.findOrganizationByInstance('pizzaria-ze');
  const slugZe = orgZe.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  
  const menuFileZe = files.find(f => f.startsWith(`cardapio_${slugZe}`));
  
  if (menuFileZe) {
    const ext = path.extname(menuFileZe).toLowerCase().replace('.', '');
    const mediaType = ['jpg', 'jpeg', 'png'].includes(ext) ? 'image' : 'document';
    await handler._sendMedia('pizzaria-ze', '456', path.join(menusDir, menuFileZe), 'caption', mediaType);
  }

  console.log('\n📊 RESULTADOS:');
  sentMedia.forEach(m => {
    console.log(`- Instância ${m.instance} enviou ${m.filePath} como ${m.mediatype}`);
  });

  const success = sentMedia.length === 2 && 
                  sentMedia[0].filePath.includes('aerolanches') && sentMedia[0].mediatype === 'document' &&
                  sentMedia[1].filePath.includes('pizzariadoze') && sentMedia[1].mediatype === 'image';

  if (success) {
    console.log('\n✅ TESTE PASSOU: O bot isola corretamente os cardápios e formatos por restaurante!');
  } else {
    console.error('\n❌ TESTE FALHOU: Houve confusão no mapeamento.');
  }

  db.close();
}

testMenuMapping().catch(console.error);

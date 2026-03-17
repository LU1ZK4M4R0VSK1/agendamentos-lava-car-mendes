#!/usr/bin/env node
// src-bot/onboard-client.js
// ============================================
// KAMA TECH — Entrevista de Onboarding
// Cadastra novo cliente com perguntas guiadas
// Uso: node src-bot/onboard-client.js
// ============================================

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const readline = require('readline');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const Database = require('./database/Database');

// Templates disponíveis
const TEMPLATES = {
  assertiva: require('./prompts/assertiva'),
  numerica: require('./prompts/numerica'),
  amigavel: require('./prompts/amigavel'),
  formal: require('./prompts/formal'),
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

// Helpers de formatação
const header = (text) => {
  console.log('\n' + '─'.repeat(50));
  console.log(`  ${text}`);
  console.log('─'.repeat(50));
};

const info = (text) => console.log(`  💡 ${text}`);
const ok = (text) => console.log(`  ✅ ${text}`);

// ============================================
// ENTREVISTA
// ============================================

async function interview() {
  console.log('\n' + '═'.repeat(50));
  console.log('  🚀 KAMA TECH — Onboarding de Novo Cliente');
  console.log('  Vou te fazer algumas perguntas para configurar');
  console.log('  o bot do seu cliente. Vamos lá!');
  console.log('═'.repeat(50));

  const client = {};

  // ── 1. DADOS BÁSICOS ──
  header('📛 DADOS DO CLIENTE');

  client.name = await ask('\n  Qual o nome do restaurante/empresa?\n  > ');
  if (!client.name) { console.log('❌ Nome é obrigatório.'); process.exit(1); }

  client.type = await ask('\n  Que tipo de negócio é?\n  (1) 🍕 Restaurante/Lanchonete\n  (2) 🏥 Clínica/Serviço\n  (3) 🏢 Empresa geral\n  > ') || '1';
  client.type = { '1': 'restaurant', '2': 'service', '3': 'general' }[client.type] || 'restaurant';
  ok(`Tipo: ${client.type}`);

  client.address = await ask('\n  Qual o endereço ou bairro do cliente?\n  (A IA usa isso pra informar localização)\n  > ') || '';

  client.phone = await ask('\n  Telefone do cliente (fixo ou celular, opcional):\n  > ') || null;

  // ── 2. INSTÂNCIA ──
  header('🔗 IDENTIFICAÇÃO DA INSTÂNCIA');

  const slug = client.name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  info(`Sugestão automática: "${slug}"`);

  client.instanceName = await ask(`\n  Nome da instância (slug único, sem espaços):\n  [Enter para usar "${slug}"]\n  > `) || slug;
  ok(`Instância: ${client.instanceName}`);

  // ── 3. HORÁRIOS ──
  header('🕐 HORÁRIOS DE FUNCIONAMENTO');
  info('Formato: HH:MM (ex: 18:00). Deixe vazio = fechado nesse dia.');

  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const labels = ['Segunda-feira', 'Terça-feira ', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira ', 'Sábado      ', 'Domingo     '];
  client.businessHours = {};

  // Pergunta se todos os dias são iguais
  const sameHours = await ask('\n  Os horários são iguais todos os dias? (s/n) [n]: ') || 'n';

  if (sameHours.toLowerCase() === 's') {
    const open = await ask('  Abre às: ');
    const close = await ask('  Fecha às: ');
    if (open && close) {
      for (const day of days) client.businessHours[day] = { open, close };
      ok(`Todos os dias: ${open} às ${close}`);

      const closedDay = await ask('\n  Algum dia é fechado? (ex: "seg" ou "seg,dom" ou Enter para nenhum)\n  > ') || '';
      if (closedDay) {
        const map = { seg: 'mon', ter: 'tue', qua: 'wed', qui: 'thu', sex: 'fri', sab: 'sat', dom: 'sun' };
        closedDay.split(',').forEach(d => {
          const key = map[d.trim().toLowerCase()];
          if (key) { client.businessHours[key] = { closed: true }; ok(`${d.trim()} = fechado`); }
        });
      }
    }
  } else {
    console.log('');
    for (let i = 0; i < days.length; i++) {
      const open = await ask(`  ${labels[i]} — Abre às (vazio=fechado): `);
      if (open) {
        const close = await ask(`  ${labels[i]} — Fecha às: `);
        client.businessHours[days[i]] = { open, close };
      } else {
        client.businessHours[days[i]] = { closed: true };
        info(`${labels[i].trim()} = fechado`);
      }
    }
  }

  // ── 4. CARDÁPIO E PRODUTOS ──
  header('📋 CARDÁPIO E PRODUTOS');

  client.categories = await ask('\n  O que o cliente vende? (separado por vírgula)\n  Ex: pizzas, lanches, bebidas, sobremesas\n  > ') || 'produtos em geral';
  ok(`Categorias: ${client.categories}`);

  const hasMenu = await ask('\n  O cliente tem cardápio em arquivo? (PDF, PNG, JPG)\n  (s/n) [n]: ') || 'n';
  client.hasMenu = hasMenu.toLowerCase() === 's';

  if (client.hasMenu) {
    client.menuPath = await ask('  Caminho do arquivo do cardápio:\n  (ex: C:\\Users\\Dudu\\Desktop\\cardapio.pdf)\n  > ');

    if (client.menuPath && fs.existsSync(client.menuPath)) {
      const ext = path.extname(client.menuPath);
      const destName = `cardapio_${client.instanceName.replace(/-/g, '')}${ext}`;
      const destPath = path.join(__dirname, 'data', 'menus', destName);
      fs.copyFileSync(client.menuPath, destPath);
      ok(`Cardápio copiado para: src-bot/data/menus/${destName}`);
      info('A IA vai enviar esse cardápio quando o cliente pedir.');
    } else {
      info('Arquivo não encontrado. Copie manualmente depois para src-bot/data/menus/');
    }
  } else {
    info('Sem cardápio em arquivo. A IA vai descrever os itens via texto.');
  }

  // ── 5. DELIVERY E PAGAMENTO ──
  header('🛵 DELIVERY E PAGAMENTO');

  const deliveryOptions = await ask('\n  Como o cliente entrega?\n  (1) 🛵 Delivery + Retirada\n  (2) 🛵 Só delivery\n  (3) 🏪 Só retirada no local\n  > ') || '1';
  client.deliveryMode = { '1': 'ambos', '2': 'delivery', '3': 'retirada' }[deliveryOptions] || 'ambos';

  client.paymentMethods = await ask('\n  Formas de pagamento aceitas? (separado por vírgula)\n  Ex: PIX, cartão de crédito, cartão de débito, dinheiro\n  > ') || 'PIX, cartão, dinheiro';
  ok(`Pagamento: ${client.paymentMethods}`);

  const hasFee = await ask('\n  Tem taxa de entrega? (s/n) [n]: ') || 'n';
  if (hasFee.toLowerCase() === 's') {
    client.deliveryFee = await ask('  Valor da taxa (ex: R$ 5,00): ') || '';
  }

  // ── 6. PERSONALIDADE DA IA ──
  header('🤖 PERSONALIDADE DA ATENDENTE');

  console.log('\n  Escolha o estilo de atendimento:\n');
  console.log('  (1) 🎯 Assertiva — Respostas curtas, máximo 2 frases. Rápida.');
  console.log('      Ex: "Olá! O que vai pedir hoje?"');
  console.log('');
  console.log('  (2) 🔢 Numérica — Atende com opções numéricas (1, 2, 3...)');
  console.log('      Ex: "*1* Ver cardápio | *2* Fazer pedido | *3* Horários"');
  console.log('');
  console.log('  (3) 💛 Amigável — Simpática, calorosa, usa emojis');
  console.log('      Ex: "Oii! 😄 Que bom ter você aqui! O que vai ser?"');
  console.log('');
  console.log('  (4) 👔 Formal — Profissional, sem gírias. Para serviços.');
  console.log('      Ex: "Boa tarde. Sou Ana, como posso ajudá-lo?"');
  console.log('');
  console.log('  (5) ✏️  Personalizado — Digitar prompt manualmente');

  const choice = await ask('\n  > ') || '1';
  const templateKey = { '1': 'assertiva', '2': 'numerica', '3': 'amigavel', '4': 'formal' }[choice];

  if (choice === '5') {
    console.log('\n  ✏️  Digite o prompt do sistema.');
    console.log('  (Cada linha é uma parte do prompt. Linha vazia para finalizar)\n');
    const lines = [];
    let line;
    while ((line = await ask('  | ')) !== '') lines.push(line);
    client.systemPrompt = lines.join('\n');
  } else {
    const template = TEMPLATES[templateKey || 'assertiva'];
    client.systemPrompt = template.generate(client.name, client.type);
    ok(`Template "${template.name}" aplicado`);
  }

  // Nome da atendente
  const attendantName = await ask('\n  Nome da atendente virtual: [já definido pelo template, Enter para manter]\n  > ');
  if (attendantName) {
    // Substitui o nome no prompt
    client.systemPrompt = client.systemPrompt.replace(/\*\*\w+\*\*,?\s*(atendente|assistente|dono)/gi, `**${attendantName}**, $1`);
    ok(`Nome da atendente: ${attendantName}`);
  }

  // ── 7. INFORMAÇÕES EXTRAS PRO PROMPT ──
  header('📝 INFORMAÇÕES EXTRAS');

  info('Essas informações são injetadas no prompt da IA.\n');

  if (client.address) {
    client.systemPrompt += `\n\n## Localização\nEndereço: ${client.address}`;
  }

  if (client.categories) {
    client.systemPrompt += `\n\n## O que vendemos\n${client.categories.split(',').map(c => `* ${c.trim()}`).join('\n')}`;
  }

  if (client.deliveryMode) {
    const modeText = { ambos: 'delivery e retirada', delivery: 'somente delivery', retirada: 'somente retirada no local' }[client.deliveryMode];
    client.systemPrompt += `\n\n## Entregas\nModalidade: ${modeText}`;
    if (client.deliveryFee) {
      client.systemPrompt += `\nTaxa de entrega: ${client.deliveryFee}`;
    }
  }

  if (client.paymentMethods) {
    client.systemPrompt += `\n\n## Formas de Pagamento\n${client.paymentMethods.split(',').map(p => `* ${p.trim()}`).join('\n')}`;
  }

  const extras = await ask('  Alguma observação especial?\n  (ex: "não temos pizza de calabresa", "promoção terça 2x1")\n  [Enter para pular]\n  > ');
  if (extras) {
    client.systemPrompt += `\n\n## Observações Importantes\n${extras}`;
  }

  // ── 8. GRUPO ADMIN ──
  header('👥 GRUPO ADMIN (WhatsApp)');
  info('O grupo admin recebe notificações de pedidos e permite comandos.');
  info('Se não souber o JID agora, pode configurar depois.\n');

  client.adminGroupJid = await ask('  JID do grupo admin (ou Enter para pular):\n  > ') || null;
  if (!client.adminGroupJid) {
    info('Sem grupo admin. Configure depois via .env ou banco.');
    info('Para descobrir o JID, envie uma mensagem no grupo com o bot conectado.');
  }

  // ── 9. CONFIRMAÇÃO FINAL ──
  header('📋 RESUMO DO CLIENTE');
  console.log(`
  Nome:           ${client.name}
  Tipo:           ${client.type}
  Instância:      ${client.instanceName}
  Endereço:       ${client.address || '(não informado)'}
  Telefone:       ${client.phone || '(não informado)'}
  Categorias:     ${client.categories}
  Cardápio:       ${client.hasMenu ? 'Sim (arquivo copiado)' : 'Não'}
  Delivery:       ${client.deliveryMode}
  Pagamento:      ${client.paymentMethods}
  ${client.deliveryFee ? `Taxa entrega:   ${client.deliveryFee}` : ''}
  Personalidade:  ${templateKey || 'personalizada'}
  Grupo Admin:    ${client.adminGroupJid || '(não configurado)'}
  `);

  const confirm = await ask('  ✅ Confirmar e cadastrar? (s/n) [s]: ') || 's';
  if (confirm.toLowerCase() !== 's') {
    console.log('\n  ❌ Cancelado.\n');
    process.exit(0);
  }

  return client;
}

// ============================================
// CADASTRO
// ============================================

async function register(client) {
  header('⏳ CADASTRANDO...');

  // 1. Banco de dados
  const db = await new Database(config.POSTGRES_URL).initialize();

  const existing = await db.findOrganizationByInstance(client.instanceName);
  if (existing) {
    info(`Instância "${client.instanceName}" já existe. Atualizando...`);
    await db.pool.query(
      `UPDATE organizations SET name=$1, system_prompt=$2, business_hours=$3, timezone=$4, admin_group_jid=$5, phone=$6 WHERE instance_name=$7`,
      [client.name, client.systemPrompt, JSON.stringify(client.businessHours), 'America/Sao_Paulo', client.adminGroupJid, client.phone, client.instanceName]
    );
  } else {
    await db.createOrganization({
      name: client.name,
      type: client.type,
      phone: client.phone,
      instanceName: client.instanceName,
      adminGroupJid: client.adminGroupJid,
      systemPrompt: client.systemPrompt,
      businessHours: client.businessHours,
      timezone: 'America/Sao_Paulo',
    });
  }
  ok('Organização salva no PostgreSQL');

  // 2. Instância na Evolution API
  console.log('');
  try {
    await axios.post(
      `${config.EVOLUTION_API_URL}/instance/create`,
      {
        instanceName: client.instanceName,
        integration: 'WHATSAPP-BAILEYS',
        token: client.instanceName,
        qrcode: true,
        webhook: {
          url: `http://localhost:${config.PORT}/webhook`,
          byEvents: false,
          base64: false,
          events: ['MESSAGES_UPSERT'],
        },
      },
      { headers: { apikey: config.EVOLUTION_APIKEY } }
    );
    ok('Instância criada na Evolution API');
    info(`QR Code: ${config.EVOLUTION_API_URL}/instance/connect/${client.instanceName}`);
  } catch (err) {
    if (err.response?.data?.message?.includes?.('already')) {
      info('Instância já existe na Evolution API.');
    } else {
      info(`Evolution API não disponível (${err.message}).`);
      info('Crie a instância manualmente quando a API estiver rodando.');
    }
  }

  // 3. Resumo final
  console.log('\n' + '═'.repeat(50));
  console.log('  ✅ ONBOARDING CONCLUÍDO!');
  console.log('═'.repeat(50));
  console.log(`
  PRÓXIMOS PASSOS:

  1. 📱 Conecte o WhatsApp do cliente:
     Acesse: ${config.EVOLUTION_API_URL}/instance/connect/${client.instanceName}
     Ou painel: http://localhost:3000

  2. 🔗 Configure o webhook (se não automático):
     URL: http://localhost:${config.PORT}/webhook
     Events: MESSAGES_UPSERT

  3. 💬 Envie "oi" para o número conectado para testar

  ${client.hasMenu ? '' : `4. 📄 (Opcional) Adicione o cardápio depois em:
     src-bot/data/menus/cardapio_${client.instanceName.replace(/-/g, '')}.pdf`}
  `);

  await db.close();
  rl.close();
}

// ============================================
// MAIN
// ============================================

async function main() {
  const client = await interview();
  await register(client);
}

main().catch(err => {
  console.error('\n  ❌ Erro:', err.message);
  process.exit(1);
});

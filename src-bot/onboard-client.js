#!/usr/bin/env node
// src-bot/onboard-client.js
// ============================================
// SCRIPT DE ONBOARDING AUTOMÁTICO — KAMA TECH
// Cadastra novo cliente, cria instância na Evolution API e gera QR Code
// Uso: node src-bot/onboard-client.js
// ============================================

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const readline = require('readline');
const axios = require('axios');
const config = require('./config');
const Database = require('./database/Database');

// Templates de prompt disponíveis
const PROMPT_TEMPLATES = {
  assertiva: require('./prompts/assertiva'),
  numerica: require('./prompts/numerica'),
  amigavel: require('./prompts/amigavel'),
  formal: require('./prompts/formal'),
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

async function main() {
  console.log('\n' + '═'.repeat(50));
  console.log('  🚀 KAMA TECH — Onboarding de Novo Cliente');
  console.log('═'.repeat(50) + '\n');

  // 1. Coletar dados do cliente
  const name = await ask('📛 Nome do restaurante/empresa: ');
  const type = await ask('📂 Tipo (restaurant/service/general) [restaurant]: ') || 'restaurant';
  const phone = await ask('📞 Telefone do cliente (opcional): ') || null;
  const instanceName = await ask('🔗 Nome da instância (slug, ex: aero-lanches): ');

  if (!name || !instanceName) {
    console.log('❌ Nome e instância são obrigatórios.');
    process.exit(1);
  }

  const adminGroupJid = await ask('👥 JID do grupo admin WhatsApp (opcional, enter para pular): ') || null;
  const timezone = await ask('🕐 Timezone [America/Sao_Paulo]: ') || 'America/Sao_Paulo';

  // 2. Horários de funcionamento
  console.log('\n📅 Horários de funcionamento (formato HH:MM, deixe vazio = fechado):');
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const dayLabels = ['Segunda', 'Terça  ', 'Quarta ', 'Quinta ', 'Sexta  ', 'Sábado ', 'Domingo'];
  const businessHours = {};

  for (let i = 0; i < days.length; i++) {
    const open = await ask(`  ${dayLabels[i]} - Abre às: `);
    if (open) {
      const close = await ask(`  ${dayLabels[i]} - Fecha às: `);
      businessHours[days[i]] = { open, close };
    } else {
      businessHours[days[i]] = { closed: true };
    }
  }

  // 3. Escolher personalidade da IA
  console.log('\n🤖 Personalidades disponíveis:');
  console.log('  1. assertiva  — Respostas curtas e diretas (recomendado para restaurantes)');
  console.log('  2. numerica   — Atende com opções numéricas (1, 2, 3...)');
  console.log('  3. amigavel   — Conversa fluida e simpática');
  console.log('  4. formal     — Tom profissional e corporativo');
  console.log('  5. custom     — Digitar prompt personalizado');

  const promptChoice = await ask('\nEscolha (1-5) [1]: ') || '1';
  let systemPrompt;

  if (promptChoice === '5') {
    console.log('\n✏️  Digite o prompt do sistema (termine com uma linha vazia):');
    const lines = [];
    let line;
    while ((line = await ask('')) !== '') lines.push(line);
    systemPrompt = lines.join('\n');
  } else {
    const templateKey = { '1': 'assertiva', '2': 'numerica', '3': 'amigavel', '4': 'formal' }[promptChoice] || 'assertiva';
    const template = PROMPT_TEMPLATES[templateKey];
    systemPrompt = template.generate(name, type);
    console.log(`\n✅ Template "${templateKey}" aplicado para "${name}"`);
  }

  // 4. Confirmar
  console.log('\n' + '─'.repeat(50));
  console.log('📋 RESUMO DO CLIENTE:');
  console.log(`  Nome: ${name}`);
  console.log(`  Tipo: ${type}`);
  console.log(`  Instância: ${instanceName}`);
  console.log(`  Timezone: ${timezone}`);
  console.log(`  Grupo Admin: ${adminGroupJid || '(não configurado)'}`);
  console.log('─'.repeat(50));

  const confirm = await ask('\n✅ Confirmar cadastro? (s/n) [s]: ') || 's';
  if (confirm.toLowerCase() !== 's') {
    console.log('❌ Cancelado.');
    process.exit(0);
  }

  // 5. Cadastrar no banco
  console.log('\n⏳ Cadastrando no banco de dados...');
  const db = await new Database(config.POSTGRES_URL).initialize();

  const existing = await db.findOrganizationByInstance(instanceName);
  if (existing) {
    console.log(`⚠️  Instância "${instanceName}" já existe. Atualizando...`);
    await db.pool.query(
      'UPDATE organizations SET name = $1, system_prompt = $2, business_hours = $3, timezone = $4, admin_group_jid = $5 WHERE instance_name = $6',
      [name, systemPrompt, JSON.stringify(businessHours), timezone, adminGroupJid, instanceName]
    );
  } else {
    await db.createOrganization({
      name, type, phone, instanceName, adminGroupJid, systemPrompt, businessHours, timezone,
    });
  }
  console.log('✅ Organização salva no PostgreSQL');

  // 6. Criar instância na Evolution API
  console.log('\n⏳ Criando instância na Evolution API...');
  try {
    const response = await axios.post(
      `${config.EVOLUTION_API_URL}/instance/create`,
      {
        instanceName: instanceName,
        integration: 'WHATSAPP-BAILEYS',
        token: instanceName,
        qrcode: true,
        webhook: {
          url: `http://localhost:${config.PORT}/webhook`,
          byEvents: false,
          base64: false,
          headers: {},
          events: ['MESSAGES_UPSERT'],
        },
      },
      { headers: { apikey: config.EVOLUTION_APIKEY } }
    );

    console.log('✅ Instância criada na Evolution API');

    // 7. Mostrar QR Code
    if (response.data?.qrcode?.base64) {
      console.log('\n📱 QR CODE gerado! Abra no navegador:');
      console.log(`   http://localhost:8080/instance/connect/${instanceName}`);
      console.log('\n   Ou acesse o painel: http://localhost:3000');
    } else {
      console.log('\n📱 Para conectar o WhatsApp:');
      console.log(`   GET ${config.EVOLUTION_API_URL}/instance/connect/${instanceName}`);
    }
  } catch (err) {
    if (err.response?.status === 403 || err.response?.status === 401) {
      console.log('⚠️  Erro de autenticação na Evolution API. Verifique a EVOLUTION_APIKEY.');
    } else if (err.response?.data?.message?.includes?.('already')) {
      console.log('ℹ️  Instância já existe na Evolution API. Conecte via QR Code:');
      console.log(`   ${config.EVOLUTION_API_URL}/instance/connect/${instanceName}`);
    } else {
      console.log(`⚠️  Evolution API não disponível (${err.message}). Crie a instância manualmente depois.`);
    }
    console.log('\n📋 Dados salvos no banco. Quando a API estiver disponível, crie a instância manualmente.');
  }

  // 8. Resumo final
  console.log('\n' + '═'.repeat(50));
  console.log('  ✅ ONBOARDING CONCLUÍDO');
  console.log('═'.repeat(50));
  console.log(`\n  Próximos passos:`);
  console.log(`  1. Conecte o WhatsApp via QR Code`);
  console.log(`  2. Configure o webhook: ${config.EVOLUTION_API_URL}/webhook/set/${instanceName}`);
  console.log(`     URL: http://localhost:${config.PORT}/webhook`);
  console.log(`     Events: MESSAGES_UPSERT`);
  console.log(`  3. Envie uma mensagem de teste para o número conectado`);
  console.log(`  4. (Opcional) Coloque o cardápio em: src-bot/data/menus/cardapio_${instanceName.replace(/-/g, '')}.pdf`);
  console.log('');

  await db.close();
  rl.close();
}

main().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});

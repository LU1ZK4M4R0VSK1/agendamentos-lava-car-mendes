// src-bot/seed.js
// Cadastra organizações iniciais (PostgreSQL)

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const config = require('./config');
const Database = require('./database/Database');

const ORGANIZATIONS = [
  {
    name: 'Aero Lanches',
    type: 'restaurant',
    phone: null,
    instanceName: 'aero-lanches',
    adminGroupJid: '120363426806631355@g.us', // Grupo Aero Lanches
    timezone: 'America/Sao_Paulo',
    businessHours: {
      mon: { open: '18:00', close: '23:00' },
      tue: { open: '18:00', close: '23:00' },
      wed: { open: '18:00', close: '23:00' },
      thu: { open: '18:00', close: '23:00' },
      fri: { open: '18:00', close: '23:59' },
      sat: { open: '18:00', close: '23:59' },
      sun: { open: '18:00', close: '22:00' }
    },
    systemPrompt: `Você é **Sara**, atendente virtual do restaurante **Aero Lanches**, localizado no bairro **Abranches**. Seu atendimento acontece pelo **WhatsApp**.

## Identidade
* Nome: Sara
* Função: Atendente virtual do Aero Lanches
* Estilo: simpática, porém extremamente breve, direta e assertiva.
* Linguagem: português brasileiro simples e muito curto. Vá direto ao ponto.
* Nunca diga que é uma IA.
* **REGRA DE OURO**: Responda em no máximo 2 frases curtas. Não enrole.

## O que vendemos
* Pizzas
* Lanches
* Bebidas

## Fluxo de Atendimento
1. Cumprimente o cliente
2. Apresente opções (🍕 Pizzas, 🍔 Lanches, 🥤 Bebidas)
3. Colete: nome, itens, endereço, forma de pagamento
4. Confirme o pedido

## Regras
* Nunca invente preços
* Se não souber, diga que vai verificar
* Seja educada mesmo se o cliente for rude
* Foque apenas em atendimento e vendas. Peça uma informação por vez.
* **ENVIO DE CARDÁPIO**: Se o cliente pedir o cardápio, responda brevemente (ex: "Claro, segue o cardápio. O que deseja pedir?") e OBRIGATORIAMENTE inclua a tag [ENVIAR_CARDAPIO] no final da resposta.

## Marcações (INVISÍVEIS PARA O CLIENTE)

Adicione no final de CADA resposta:

[ANALYTICS]
etapa: {saudacao|cardapio|escolhendo_itens|coletando_nome|coletando_endereco|coletando_pagamento|confirmacao|pos_venda|duvidas|reclamacao}
sentimento: {positivo|neutro|impaciente|irritado|confuso}
[/ANALYTICS]

Sempre que o cliente pedir o cardápio:
[ENVIAR_CARDAPIO]

Quando confirmar um pedido COMPLETO:

[PEDIDO_FECHADO]
cliente: {nome}
telefone: {número ou "não informado"}
itens: {lista dos itens}
endereco: {endereço}
tipo_entrega: {delivery ou retirada}
pagamento: {forma de pagamento}
observacoes: {observações}
[/PEDIDO_FECHADO]

SEMPRE inclua [ANALYTICS] em toda resposta.`,
  },
  {
    name: 'Pizzaria do Zé',
    type: 'restaurant',
    phone: null,
    instanceName: 'pizzaria-ze',
    adminGroupJid: '120363406246512070@g.us', // Grupo Pizzaria do Zé Real
    timezone: 'America/Sao_Paulo',
    businessHours: {
      mon: { closed: true },
      tue: { open: '18:00', close: '23:00' },
      wed: { open: '18:00', close: '23:00' },
      thu: { open: '18:00', close: '23:00' },
      fri: { open: '18:00', close: '23:30' },
      sat: { open: '18:00', close: '23:30' },
      sun: { open: '18:00', close: '22:00' }
    },
    systemPrompt: `Você é **Zé**, dono da **Pizzaria do Zé**.
Seu estilo é brincalhão, usa gírias de pizzaiolo, mas é muito eficiente.

## Regras
* Se pedirem o cardápio, use a tag [ENVIAR_CARDAPIO].
* Foque em vender as pizzas da casa.

[ANALYTICS]
etapa: saudacao
sentimento: positivo
[/ANALYTICS]`,
  },
  {
    name: 'Posto3l Lava Car',
    type: 'lavacar',
    phone: null,
    instanceName: 'posto3l',
    adminGroupJid: null, // Pode configurar depois
    timezone: 'America/Sao_Paulo',
    businessHours: {
      mon: { open: '06:00', close: '18:00' },
      tue: { open: '06:00', close: '18:00' },
      wed: { open: '06:00', close: '18:00' },
      thu: { open: '06:00', close: '18:00' },
      fri: { open: '06:00', close: '18:00' },
      sat: { open: '06:00', close: '18:00' },
      sun: { open: '06:00', close: '18:00' }
    },
    services: [
      { id: 'svc_1', name: 'Lavagem Externa', durationMinutes: 30, bufferMinutes: 15, price: 35.00, active: true },
      { id: 'svc_2', name: 'Lavagem Interna', durationMinutes: 30, bufferMinutes: 15, price: 45.00, active: true },
      { id: 'svc_3', name: 'Lavagem Completa', durationMinutes: 60, bufferMinutes: 15, price: 70.00, active: true }
    ],
    systemPrompt: `Você é o atendente do **Posto3l Lava Car**. 
Seu atendimento acontece pelo WhatsApp e você ajuda agendamentos de lavagem de carros.

## Identidade
* Estilo: simples, direto e breve.
* Máximo 1 ou 2 frases por resposta.
* Sem enrolação, sempre objetivo.
* Nunca invente horários ou invente preços! Apenas ofereça horários e valores que constam na lista dinamicamente injetada abaixo das regras.
* Se os horários não estiverem no contexto, diga que precisa verificar o sistema.

## Funções principais
1. Identificar a intenção de agendamento e qual serviço da lista o cliente deseja.
2. Perguntar data se não informada.
3. Oferecer os TRÊS primeiros horários disponíveis para a data escolhida baseando-se no contexto injetado HORÁRIOS LIVRES BASES.
4. Confirmar o agendamento informando o NOME do serviço, data, hora e valor.
5. Sempre confirmar antes de finalizar agendamento.

## Exemplo de respostas
* "Bom dia! Qual dia você quer lavar o carro? Quer a lavagem externa, interna ou completa?"
* "Temos 08:00, 08:15 ou 08:30 para amanhã. Qual prefere?"
* "Tudo certo! Lavagem Completa agendada para 09:00. Fica R$ 70,00. Te esperamos!"

## Marcações (INVISÍVEIS PARA O CLIENTE)
Quando confirmar um agendamento COMPLETO e finalizado (com cliente concordando), adicione obrigatoriamente SEMPRE:

[AGENDAMENTO_FECHADO]
data: {YYYY-MM-DD}
hora: {HH:mm}
service_id: {ID do serviço}
[/AGENDAMENTO_FECHADO]

⚠️ NUNCA use o nome do serviço como identificador em service_id! Use apenas a string exata do ID. Nunca forneça esta tag antes de confirmar com o cliente a data e hora desejada.`,
  },
];

async function seed() {
  console.log('🌱 Executando seed (PostgreSQL)...\n');
  const db = await new Database(config.POSTGRES_URL).initialize();

  for (const data of ORGANIZATIONS) {
    let orgData;
    const existing = await db.findOrganizationByInstance(data.instanceName);
    if (existing) {
      // Atualiza o prompt e horários se já existir
      await db.pool.query(
        'UPDATE organizations SET type = $1, system_prompt = $2, business_hours = $3, timezone = $4 WHERE instance_name = $5',
        [data.type || 'general', data.systemPrompt, JSON.stringify(data.businessHours), data.timezone || 'America/Sao_Paulo', data.instanceName]
      );
      console.log(`  🔄 ${data.name} atualizada`);
      orgData = existing;
    } else {
      orgData = await db.createOrganization(data);
      console.log(`  ✅ ${data.name} criada (${data.instanceName})`);
    }

    // Processa os Services se existirem para a organização (Multi-Tenant SaaS)
    if (data.services && data.services.length > 0) {
        for (const srv of data.services) {
            await db.createOrUpdateService({
                id: srv.id,
                organizationId: orgData.id,
                name: srv.name,
                durationMinutes: srv.durationMinutes,
                bufferMinutes: srv.bufferMinutes,
                price: srv.price,
                active: srv.active
            });
        }
        console.log(`     ↳ ${data.services.length} serviços persistidos (Buffers aplicados).`);
    }
  }

  console.log('\n🌱 Seed concluído!');
  await db.close();
}

seed().catch(err => {
  console.error('❌ Erro no seed:', err.message);
  process.exit(1);
});

// bot-gemini-webhook.js
// Integração Evolution API + Gemini via webhook Express (Com Analytics e Persona)
// Responde automaticamente mensagens recebidas no WhatsApp

const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const fs = require('fs');

// ============================================
// CONFIGURAÇÃO DO BOT - EDITE AQUI!
// ============================================
const CONFIG = {
  GEMINI_API_KEY: 'COLOQUE_SUA_CHAVE_GEMINI_AQUI',
  MODEL: 'gemini-2.5-flash',

  EVOLUTION_API_URL: 'http://localhost:8080',
  EVOLUTION_APIKEY: 'COLOQUE_SUA_APIKEY_EVOLUTION_AQUI',
  PORT: 3001,

  TELEGRAM_ENABLED: false,
  TELEGRAM_BOT_TOKEN: 'SEU_TOKEN_AQUI',
  TELEGRAM_ADMIN_CHAT_ID: 'SEU_CHAT_ID_AQUI',

  DATA_FILE: 'dados-vendas.json',
  DEBUG: true,

  SYSTEM_PROMPT: `Você é **Sara**, atendente virtual do restaurante **Aero Lanches**, localizado no bairro **Abranches**. Seu atendimento acontece pelo **WhatsApp** e sua função é ajudar clientes de forma rápida, educada e clara.

## Identidade

* Nome: Sara
* Função: Atendente virtual do Aero Lanches
* Estilo: simpática, educada, objetiva e prestativa
* Linguagem: português brasileiro simples, natural e amigável

Sempre fale como uma atendente real do restaurante.

## Sobre o Aero Lanches

O Aero Lanches vende:

* Pizzas
* Lanches
* Bebidas

Os clientes normalmente entram em contato para:

* ver o cardápio
* fazer pedidos
* perguntar preços
* perguntar sobre entrega
* saber localização
* tempo de entrega

## Comportamento da Atendente

* Cumprimente o cliente de forma educada.
* Pergunte como pode ajudar.
* Seja rápida e direta.
* Use mensagens curtas.
* Use poucos emojis (ex: 🍕🥤).
* Nunca diga que é uma IA.
* Sempre fale como parte da equipe do Aero Lanches.

Exemplo de saudação:

"Olá! 😊
Bem-vindo ao *Aero Lanches*.
Eu sou a Sara e vou te ajudar com seu pedido.

Você gostaria de ver o cardápio ou fazer um pedido?"

## Fluxo de Atendimento

### Quando o cliente quer ver o cardápio

Apresente as categorias:

"Temos:
🍕 Pizzas
🍔 Lanches
🥤 Bebidas

Qual você gostaria de ver?"

### Quando o cliente quer fazer pedido

Peça as informações necessárias:

1. Nome do cliente
2. Itens do pedido
3. Endereço para entrega (se for delivery)
4. Forma de pagamento

Exemplo:

"Perfeito! Vou anotar seu pedido 😊
Pode me informar:

* Seu nome
* O que deseja pedir
* Endereço para entrega
* Forma de pagamento"

### Quando perguntarem sobre entrega

Responda informando que o pedido é para delivery ou retirada.

Exemplo:

"Trabalhamos com delivery e também retirada no local.
Qual você prefere?"

### Quando perguntarem localização

Responda:

"O Aero Lanches fica no bairro **Abranches**.
Se quiser, posso te enviar a localização pelo mapa."

### Quando o cliente finalizar o pedido

Confirme tudo:

"Pedido confirmado! ✅

Resumo do pedido:
[Itens]

Agora nossa equipe vai preparar.
Logo seu pedido será enviado. 🍕"

## Regras Importantes

* Nunca invente preços.
* Se não souber algo, diga que vai verificar com a equipe.
* Sempre incentive o cliente a fazer o pedido.
* Seja educada mesmo se o cliente for rude.
* Não fale sobre política, assuntos pessoais ou temas fora do restaurante.
* Foque apenas em atendimento e vendas.

## Objetivo

Seu principal objetivo é:

* ajudar o cliente
* facilitar o pedido
* aumentar as vendas do Aero Lanches
* oferecer um atendimento rápido e agradável

## IMPORTANTE - Marcações de Analytics (INVISÍVEIS PARA O CLIENTE)

Você DEVE adicionar marcações especiais no final de CADA resposta para nosso sistema de analytics.
Essas marcações são removidas antes de exibir ao cliente.

### 1. ETAPA DA CONVERSA (obrigatório em toda resposta)
Adicione sempre no final:

[ANALYTICS]
etapa: {etapa atual - use: saudacao, cardapio, escolhendo_itens, coletando_nome, coletando_endereco, coletando_pagamento, confirmacao, pos_venda, duvidas, reclamacao}
sentimento: {analise o humor do cliente com base na ÚLTIMA mensagem dele}
[/ANALYTICS]

REGRAS PARA SENTIMENTO (seja preciso):
- **positivo**: cliente agradece, elogia, usa emojis felizes, está animado
- **neutro**: mensagens objetivas sem emoção clara, perguntas simples
- **impaciente**: cliente RECLAMA de tempo, demora, menciona "demoram", "demora", "rápido", "quando chega", cobra prazo
- **irritado**: cliente usa palavras fortes, reclama com raiva, usa caps lock, xinga, ameaça
- **confuso**: cliente faz muitas perguntas, não entende, pede para repetir

EXEMPLOS DE IMPACIENTE:
- "vocês demoram muito" → impaciente
- "demora muito pra chegar?" → impaciente  
- "quanto tempo demora?" → impaciente (preocupação com tempo)
- "é muito lento" → impaciente

### 2. ITEM NÃO DISPONÍVEL (quando cliente pedir algo que não temos)
Se o cliente perguntar por algo que NÃO vendemos ou NÃO temos, adicione:

[NAO_TEMOS]
item: {o que o cliente pediu}
categoria: {tipo do item: pizza, lanche, bebida, sobremesa, outro}
motivo: {indisponivel, nao_vendemos, sem_estoque}
[/NAO_TEMOS]

### 3. PEDIDO FECHADO (quando a venda for concluída)
Quando confirmar um pedido COMPLETO:

[PEDIDO_FECHADO]
cliente: {nome do cliente}
telefone: {número se informado, ou "não informado"}
itens: {lista dos itens pedidos}
endereco: {endereço completo}
tipo_entrega: {delivery ou retirada}
pagamento: {forma de pagamento}
observacoes: {qualquer observação do pedido}
[/PEDIDO_FECHADO]

Lembre-se: SEMPRE inclua [ANALYTICS] em toda resposta, mesmo que não tenha as outras marcações.`
};

const app = express();
app.use(bodyParser.json({ limit: '2mb' }));

// Memória de conversas por número (para o bot lembrar o histórico)
const conversations = {};

// Função para enviar mensagem via Evolution API
async function sendWhatsappMessage(instanceName, to, message) {
  try {
    await axios.post(
      `${CONFIG.EVOLUTION_API_URL}/message/sendText/${instanceName}`,
      {
        number: to,
        options: { delay: 1200, presence: "composing" },
        text: message
      },
      {
        headers: { apikey: CONFIG.EVOLUTION_APIKEY },
      }
    );
  } catch (err) {
    if (CONFIG.DEBUG) console.error('Erro ao enviar mensagem:', err.response?.data || err.message);
  }
}

// Funções de Extração (Regex)
function extrairPedido(resposta) {
  const regexPatterns = [
    /\[PEDIDO_FECHADO\]([\s\S]*?)\[\/PEDIDO_FECHADO\]/i,
    /\[PEDIDO FECHADO\]([\s\S]*?)\[\/PEDIDO FECHADO\]/i,
    /\[\s*PEDIDO_FECHADO\s*\]([\s\S]*?)\[\s*\/\s*PEDIDO_FECHADO\s*\]/i,
  ];
  let match = null;
  for (const regex of regexPatterns) {
    match = resposta.match(regex);
    if (match) break;
  }
  if (match) {
    const conteudo = match[1].trim();
    const pedido = { id: `PED-${Date.now()}`, data: new Date().toLocaleDateString('pt-BR'), hora: new Date().getHours() };
    const linhas = conteudo.split('\n');
    linhas.forEach(linha => {
      const colonIndex = linha.indexOf(':');
      if (colonIndex > 0) {
        const chave = linha.substring(0, colonIndex).trim();
        const valor = linha.substring(colonIndex + 1).trim();
        if (chave && valor) {
          const key = chave.toLowerCase().replace(/[_\s]/g, '');
          pedido[key] = valor;
        }
      }
    });
    return pedido;
  }
  return null;
}

function limparMarcacao(resposta) {
  return resposta
    .replace(/\[\s*PEDIDO[_\s]?FECHADO\s*\][\s\S]*?\[\s*\/\s*PEDIDO[_\s]?FECHADO\s*\]/gi, '')
    .replace(/\[\s*ANALYTICS\s*\][\s\S]*?\[\s*\/\s*ANALYTICS\s*\]/gi, '')
    .replace(/\[\s*NAO[_\s]?TEMOS\s*\][\s\S]*?\[\s*\/\s*NAO[_\s]?TEMOS\s*\]/gi, '')
    .trim();
}

async function notificarAdmin(pedido) {
  if (!CONFIG.TELEGRAM_ENABLED) return;
  try {
    const mensagem = `🔔 *NOVA VENDA!*\n\n📦 *Pedido:* ${pedido.id}\n👤 *Cliente:* ${pedido.cliente || 'Não informado'}\n📞 *Telefone:* ${pedido.telefone || 'Não informado'}\n🛒 *Itens:*\n${pedido.itens || 'Não especificado'}\n📍 *Endereço:* ${pedido.endereco || 'Retirada'}\n🚚 *Tipo:* ${pedido.tipoentrega || 'Não informado'}\n💳 *Pagamento:* ${pedido.pagamento || 'Não informado'}\n📝 *Obs:* ${pedido.observacoes || 'Nenhuma'}\n⏰ ${pedido.data} às ${pedido.hora}h`;
    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
    await axios.post(url, { chat_id: CONFIG.TELEGRAM_ADMIN_CHAT_ID, text: mensagem, parse_mode: 'Markdown' });
  } catch (error) {
    if (CONFIG.DEBUG) console.log(`\n⚠️ Erro ao enviar notificação: ${error.message}`);
  }
}

// Interação com o Gemini
async function askGemini(from, userMessage) {
  if (!conversations[from]) {
    conversations[from] = [];
  }

  conversations[from].push({ role: 'user', parts: [{ text: userMessage }] });

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;
    const response = await axios.post(url, {
      contents: conversations[from],
      systemInstruction: { parts: [{ text: CONFIG.SYSTEM_PROMPT }] },
      generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
    });

    const assistantMessage = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!assistantMessage) throw new Error("Sem resposta do Gemini");

    conversations[from].push({ role: 'model', parts: [{ text: assistantMessage }] });

    const pedido = extrairPedido(assistantMessage);
    const mensagemLimpa = limparMarcacao(assistantMessage);

    if (pedido) {
      if (CONFIG.DEBUG) console.log(`📦 VENDA DETECTADA: ${pedido.id}`);
      await notificarAdmin(pedido);
    }

    return mensagemLimpa;
  } catch (err) {
    if (CONFIG.DEBUG) console.log(`❌ [DEBUG] Erro Gemini: ${err.message}`);
    conversations[from].pop(); // Remover do histórico em caso de erro
    return 'Desculpe, tive um problema e não consegui entender agora.';
  }
}

// Webhook
app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    // Suporte para padrão webhooks Evolution v1/v2
    if (body.event === 'messages.upsert' && body.data) {
      const { instance, data } = body;
      const key = data.key;
      const fromMe = key.fromMe;
      const remoteJid = key.remoteJid;

      if (fromMe || (remoteJid && remoteJid.includes('@g.us'))) {
        return res.sendStatus(200); // Ignorar próprias mensagens ou de grupos
      }

      const messageData = data.message;
      if (!messageData) return res.sendStatus(200);

      const text = messageData.conversation || messageData.extendedTextMessage?.text;

      if (text && remoteJid) {
        if (CONFIG.DEBUG) console.log(`💬 Mensagem recebida de ${remoteJid}: ${text}`);
        const resposta = await askGemini(remoteJid, text);
        if (CONFIG.DEBUG) console.log(`🤖 Resposta gerada: ${resposta}`);
        await sendWhatsappMessage(instance, remoteJid, resposta);
      }
    }
    // Fallback pra formato antigo se necessário
    else if (body.message && body.from && !body.isSelf) {
      const text = body.message;
      const from = body.from;
      const instance = body.instanceName;

      if (CONFIG.DEBUG) console.log(`💬 Mensagem recebida de ${from} (formato antigo): ${text}`);
      const resposta = await askGemini(from, text);
      if (CONFIG.DEBUG) console.log(`🤖 Resposta gerada: ${resposta}`);
      await sendWhatsappMessage(instance, from, resposta);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Erro no webhook:', err.message);
    res.sendStatus(500);
  }
});

app.listen(CONFIG.PORT, () => {
  console.log(`🤖 Webhook Gemini rodando em http://localhost:${CONFIG.PORT}/webhook`);
  console.log(`✅ Log de debug ativado: ${CONFIG.DEBUG}`);
});

// Instruções:
// 1. Configure sua chave Gemini e API Key Evolution nas constantes acima.
// 2. Rode: node bot-gemini-webhook.js
// 3. Configure o webhook do Evolution API (Messages Upsert) para sua porta 3001.

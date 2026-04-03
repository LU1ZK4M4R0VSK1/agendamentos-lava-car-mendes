/**
 * Script para testar o bot com Gemini (GRATUITO)
 * Execute: node test-bot-gemini.js
 * 
 * Obtenha sua API Key gratuita em: https://aistudio.google.com/app/apikey
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURAÇÃO DO BOT - EDITE AQUI!
// ============================================
const CONFIG = {
  // Use the API key testing
  GEMINI_API_KEY: 'AIzaSyDfR5Y3d6I4mnvVzfobYSvCGMbH6QEHFf4',
  MODEL: 'gemini-2.5-flash',
  
  TELEGRAM_ENABLED: false, 
  TELEGRAM_BOT_TOKEN: 'SEU_TOKEN_AQUI',
  TELEGRAM_ADMIN_CHAT_ID: 'SEU_CHAT_ID_AQUI',
  
  DATA_FILE: 'dados-agendamentos.json',
  DEBUG: false,
  
  SYSTEM_PROMPT: `Você é o atendente do **Posto3l Lava Car**. 
Seu atendimento acontece pelo WhatsApp e você ajuda agendamentos de lavagem de carros.

## Identidade
* Estilo: simples, direto e breve.
* Máximo 1 ou 2 frases por resposta.
* Sem enrolação, sempre objetivo.
* Nunca invente horários! Apenas ofereça horários que constam na lista de "HORÁRIOS DISPONÍVEIS" abaixo.

--- HORÁRIOS DISPONÍVEIS ---
Hoje (${new Date().toLocaleDateString('pt-BR')}): 08:00, 09:00, 14:00, 15:00, 16:00
Amanhã: 08:00, 09:00, 10:00, 11:00, 13:00, 14:00
---------------------------

## Nossos Serviços e Valores
* **Lavagem Externa:** R$ 35,00
* **Lavagem Interna:** R$ 45,00
* **Lavagem Completa:** R$ 70,00

## Funções principais
1. Identificar qual tipo de lavagem o cliente deseja.
2. Perguntar data e horário desejado baseando-se nas disponibilidades fornecidas acima.
3. Confirmar o agendamento informando serviço, data, hora e valor final.

## Marcações (INVISÍVEIS PARA O CLIENTE)
Quando confirmar um agendamento COMPLETO e finalizado, adicione:

[AGENDAMENTO_FECHADO]
data: {YYYY-MM-DD}
hora: {HH:mm}
servico: {lavagem simples, completa, etc}
[/AGENDAMENTO_FECHADO]

[ANALYTICS]
etapa: confirmacao
sentimento: positivo
[/ANALYTICS]`
};

// ============================================
// SISTEMA DE ANALYTICS E RELATÓRIOS
// ============================================

// Estrutura de dados para relatórios futuros
let analyticsData = {
  vendas: [],
  sessoes: [],
  abandonos: [],        // Conversas que não fecharam venda
  itensNaoDisponíveis: [], // Itens que clientes pediram e não temos
  sentimentos: [],      // Histórico de sentimentos
  metricas: {
    totalVendas: 0,
    totalSessoes: 0,
    totalAbandonos: 0,
    clientesUnicos: new Set(),
    vendasPorHora: {},
    vendasPorDia: {},
    vendasPorDiaSemana: {},
    itensMaisVendidos: {},
    formasPagamento: {},
    tiposEntrega: { delivery: 0, retirada: 0 },
    // MÉTRICAS PREMIUM
    abandonoPorEtapa: {},     // Onde clientes desistem
    sentimentoGeral: { positivo: 0, neutro: 0, impaciente: 0, irritado: 0, confuso: 0 },
    itensNaoTemos: {},        // Oportunidades de negócio
    alertasIrritacao: []      // Clientes irritados (para ação imediata)
  }
};

// Carrega dados existentes se houver
function carregarDados() {
  console.log('\n🔄 [DEBUG] Iniciando carregarDados()...');
  console.log(`   Arquivo: ${CONFIG.DATA_FILE}`);
  console.log(`   Existe: ${fs.existsSync(CONFIG.DATA_FILE)}`);
  
  try {
    if (fs.existsSync(CONFIG.DATA_FILE)) {
      const rawData = fs.readFileSync(CONFIG.DATA_FILE, 'utf8');
      console.log(`   Tamanho do arquivo: ${rawData.length} bytes`);
      
      const data = JSON.parse(rawData);
      
      // Carrega vendas
      analyticsData.vendas = data.vendas || [];
      analyticsData.sessoes = data.sessoes || [];
      analyticsData.abandonos = data.abandonos || [];
      analyticsData.itensNaoDisponíveis = data.itensNaoDisponiveis || [];
      analyticsData.sentimentos = data.sentimentos || [];
      
      // Carrega métricas premium se existirem
      if (data.metricasPremium) {
        analyticsData.metricas.abandonoPorEtapa = data.metricasPremium.abandonoPorEtapa || {};
        analyticsData.metricas.sentimentoGeral = data.metricasPremium.sentimentoGeral || { positivo: 0, neutro: 0, impaciente: 0, irritado: 0, confuso: 0 };
        analyticsData.metricas.itensNaoTemos = data.metricasPremium.itensNaoTemos || {};
        analyticsData.metricas.alertasIrritacao = data.metricasPremium.alertasIrritacao || [];
      }
      
      // Recalcula métricas básicas
      analyticsData.metricas.totalVendas = analyticsData.vendas.length;
      analyticsData.metricas.totalAbandonos = analyticsData.abandonos.length;
      analyticsData.vendas.forEach(v => {
        if (v.cliente) analyticsData.metricas.clientesUnicos.add(v.cliente.toLowerCase());
      });
      
      console.log(`✅ [DEBUG] Dados carregados com sucesso:`);
      console.log(`   - Vendas: ${analyticsData.vendas.length}`);
      console.log(`   - Sessões: ${analyticsData.sessoes.length}`);
      console.log(`   - Abandonos: ${analyticsData.abandonos.length}`);
      console.log(`   - Sentimentos: ${analyticsData.sentimentos.length}`);
      console.log(`   - Itens não disponíveis: ${analyticsData.itensNaoDisponíveis.length}`);
    } else {
      console.log('📊 [DEBUG] Arquivo não existe. Iniciando com dados vazios.');
    }
  } catch (e) {
    console.log(`❌ [DEBUG] ERRO ao carregar dados: ${e.message}`);
    console.log('📊 Iniciando novo arquivo de dados');
  }
}

// Salva dados no arquivo JSON
function salvarDados() {
  if (CONFIG.DEBUG) console.log('\n💾 [DEBUG] Iniciando salvarDados()...');
  
  try {
    const dataToSave = {
      vendas: analyticsData.vendas,
      sessoes: analyticsData.sessoes,
      abandonos: analyticsData.abandonos,
      itensNaoDisponiveis: analyticsData.itensNaoDisponíveis,
      sentimentos: analyticsData.sentimentos.slice(-100), // Últimos 100
      ultimaAtualizacao: new Date().toISOString(),
      resumo: {
        totalVendas: analyticsData.vendas.length,
        totalAbandonos: analyticsData.abandonos.length,
        clientesUnicos: [...analyticsData.metricas.clientesUnicos].length,
        taxaConversao: analyticsData.sessoes.length > 0 
          ? ((analyticsData.vendas.length / analyticsData.sessoes.length) * 100).toFixed(1) + '%'
          : '0%'
      },
      metricasPremium: {
        abandonoPorEtapa: analyticsData.metricas.abandonoPorEtapa,
        sentimentoGeral: analyticsData.metricas.sentimentoGeral,
        itensNaoTemos: analyticsData.metricas.itensNaoTemos,
        alertasIrritacao: analyticsData.metricas.alertasIrritacao.slice(-20)
      }
    };
    
    const jsonString = JSON.stringify(dataToSave, null, 2);
    fs.writeFileSync(CONFIG.DATA_FILE, jsonString);
    
    if (CONFIG.DEBUG) {
      console.log(`✅ [DEBUG] Dados salvos com sucesso!`);
      console.log(`   - Arquivo: ${CONFIG.DATA_FILE}`);
      console.log(`   - Tamanho: ${jsonString.length} bytes`);
      console.log(`   - Vendas salvas: ${dataToSave.vendas.length}`);
      console.log(`   - Abandonos salvos: ${dataToSave.abandonos.length}`);
    }
  } catch (e) {
    console.log(`❌ [DEBUG] ERRO ao salvar dados: ${e.message}`);
    console.log(`   Stack: ${e.stack}`);
  }
}

// Extrai dados do pedido da marcação do bot (REGEX ROBUSTO)
function extrairPedido(resposta) {
  // Regex mais robusto: ignora espaços extras, quebras de linha, variações
  const regexPatterns = [
    /\[PEDIDO_FECHADO\]([\s\S]*?)\[\/PEDIDO_FECHADO\]/i,
    /\[PEDIDO FECHADO\]([\s\S]*?)\[\/PEDIDO FECHADO\]/i,
    /\[\s*PEDIDO_FECHADO\s*\]([\s\S]*?)\[\s*\/\s*PEDIDO_FECHADO\s*\]/i,
  ];
  
  let match = null;
  for (const regex of regexPatterns) {
    match = resposta.match(regex);
    if (match) {
      if (CONFIG.DEBUG) console.log(`\n🎯 [DEBUG] Tag PEDIDO_FECHADO encontrada!`);
      break;
    }
  }
  
  if (match) {
    const conteudo = match[1].trim();
    if (CONFIG.DEBUG) {
      console.log(`   Conteúdo extraído:`);
      console.log(`   "${conteudo.substring(0, 200)}..."`);
    }
    
    const pedido = {
      id: `PED-${Date.now()}`,
      dataHora: new Date().toISOString(),
      timestamp: Date.now(),
      hora: new Date().getHours(),
      diaSemana: new Date().toLocaleDateString('pt-BR', { weekday: 'long' }),
      data: new Date().toLocaleDateString('pt-BR')
    };
    
    // Parse dos campos (mais robusto)
    const linhas = conteudo.split('\n');
    linhas.forEach(linha => {
      const colonIndex = linha.indexOf(':');
      if (colonIndex > 0) {
        const chave = linha.substring(0, colonIndex).trim();
        const valor = linha.substring(colonIndex + 1).trim();
        if (chave && valor) {
          // Normaliza a chave (remove underscores, espaços, lowercase)
          const key = chave.toLowerCase().replace(/[_\s]/g, '');
          pedido[key] = valor;
          if (CONFIG.DEBUG) console.log(`   Campo: ${key} = "${valor}"`);
        }
      }
    });
    
    return pedido;
  }
  
  if (CONFIG.DEBUG) {
    // Verifica se tem algo parecido que não bateu
    if (resposta.toLowerCase().includes('pedido') && 
        (resposta.includes('[') || resposta.includes('fechado'))) {
      console.log(`\n⚠️ [DEBUG] Possível tag não detectada. Trecho suspeito:`);
      const idx = resposta.toLowerCase().indexOf('pedido');
      console.log(`   "${resposta.substring(Math.max(0, idx-20), idx+100)}"`);
    }
  }
  
  return null;
}

// Remove a marcação da mensagem exibida ao cliente (REGEX ROBUSTO)
function limparMarcacao(resposta) {
  return resposta
    // Remove todas as variações de PEDIDO_FECHADO
    .replace(/\[\s*PEDIDO[_\s]?FECHADO\s*\][\s\S]*?\[\s*\/\s*PEDIDO[_\s]?FECHADO\s*\]/gi, '')
    // Remove todas as variações de ANALYTICS
    .replace(/\[\s*ANALYTICS\s*\][\s\S]*?\[\s*\/\s*ANALYTICS\s*\]/gi, '')
    // Remove todas as variações de NAO_TEMOS
    .replace(/\[\s*NAO[_\s]?TEMOS\s*\][\s\S]*?\[\s*\/\s*NAO[_\s]?TEMOS\s*\]/gi, '')
    .trim();
}

// Extrai dados de analytics (etapa e sentimento) - REGEX ROBUSTO
function extrairAnalytics(resposta) {
  const regexPatterns = [
    /\[ANALYTICS\]([\s\S]*?)\[\/ANALYTICS\]/i,
    /\[\s*ANALYTICS\s*\]([\s\S]*?)\[\s*\/\s*ANALYTICS\s*\]/i,
  ];
  
  let match = null;
  for (const regex of regexPatterns) {
    match = resposta.match(regex);
    if (match) {
      if (CONFIG.DEBUG) console.log(`\n📊 [DEBUG] Tag ANALYTICS encontrada!`);
      break;
    }
  }
  
  if (match) {
    const conteudo = match[1].trim();
    const analytics = {};
    
    const linhas = conteudo.split('\n');
    linhas.forEach(linha => {
      const colonIndex = linha.indexOf(':');
      if (colonIndex > 0) {
        const chave = linha.substring(0, colonIndex).trim();
        const valor = linha.substring(colonIndex + 1).trim();
        if (chave && valor) {
          const key = chave.toLowerCase().replace(/[_\s]/g, '');
          analytics[key] = valor.toLowerCase();
          if (CONFIG.DEBUG) console.log(`   ${key}: ${valor}`);
        }
      }
    });
    
    return analytics;
  }
  
  if (CONFIG.DEBUG && resposta.toLowerCase().includes('analytics')) {
    console.log(`\n⚠️ [DEBUG] Possível tag ANALYTICS não detectada`);
  }
  
  return null;
}

// Extrai itens não disponíveis - REGEX ROBUSTO
function extrairNaoTemos(resposta) {
  const regexPatterns = [
    /\[NAO_TEMOS\]([\s\S]*?)\[\/NAO_TEMOS\]/i,
    /\[NAO TEMOS\]([\s\S]*?)\[\/NAO TEMOS\]/i,
    /\[\s*NAO[_\s]?TEMOS\s*\]([\s\S]*?)\[\s*\/\s*NAO[_\s]?TEMOS\s*\]/i,
  ];
  
  let match = null;
  for (const regex of regexPatterns) {
    match = resposta.match(regex);
    if (match) {
      if (CONFIG.DEBUG) console.log(`\n💡 [DEBUG] Tag NAO_TEMOS encontrada!`);
      break;
    }
  }
  
  if (match) {
    const conteudo = match[1].trim();
    const itemNaoTemos = {
      timestamp: Date.now(),
      dataHora: new Date().toISOString(),
      data: new Date().toLocaleDateString('pt-BR'),
      hora: new Date().getHours()
    };
    
    const linhas = conteudo.split('\n');
    linhas.forEach(linha => {
      const colonIndex = linha.indexOf(':');
      if (colonIndex > 0) {
        const chave = linha.substring(0, colonIndex).trim();
        const valor = linha.substring(colonIndex + 1).trim();
        if (chave && valor) {
          const key = chave.toLowerCase().replace(/[_\s]/g, '');
          itemNaoTemos[key] = valor;
          if (CONFIG.DEBUG) console.log(`   ${key}: ${valor}`);
        }
      }
    });
    
    return itemNaoTemos;
  }
  return null;
}

// Registra analytics da conversa
function registrarAnalytics(analytics, sessaoId) {
  if (!analytics) return;
  
  const registro = {
    ...analytics,
    timestamp: Date.now(),
    sessaoId: sessaoId
  };
  
  analyticsData.sentimentos.push(registro);
  
  // Atualiza contador de sentimento
  if (analytics.sentimento) {
    const sent = analytics.sentimento.toLowerCase();
    if (analyticsData.metricas.sentimentoGeral[sent] !== undefined) {
      analyticsData.metricas.sentimentoGeral[sent]++;
    }
    
    // Alerta de cliente irritado
    if (sent === 'irritado' || sent === 'impaciente') {
      analyticsData.metricas.alertasIrritacao.push({
        sentimento: sent,
        etapa: analytics.etapa,
        dataHora: new Date().toISOString(),
        sessaoId: sessaoId
      });
    }
  }
}

// Registra item não disponível (oportunidade de negócio)
function registrarItemNaoDisponivel(itemNaoTemos) {
  if (!itemNaoTemos) return;
  
  analyticsData.itensNaoDisponíveis.push(itemNaoTemos);
  
  // Contador por item
  const item = itemNaoTemos.item?.toLowerCase() || 'desconhecido';
  analyticsData.metricas.itensNaoTemos[item] = (analyticsData.metricas.itensNaoTemos[item] || 0) + 1;
  
  console.log(`\n💡 [OPORTUNIDADE] Cliente pediu: "${itemNaoTemos.item}" - Não temos!`);
}

// Registra abandono de conversa
function registrarAbandono(sessao, ultimaEtapa) {
  if (sessao.vendaFechada) return; // Não é abandono se fechou venda
  
  const abandono = {
    sessaoId: sessao.id,
    etapa: ultimaEtapa || 'desconhecida',
    mensagens: sessao.mensagens,
    dataHora: new Date().toISOString(),
    duracao: Date.now() - new Date(sessao.inicio).getTime()
  };
  
  analyticsData.abandonos.push(abandono);
  analyticsData.metricas.totalAbandonos++;
  
  // Contador por etapa
  const etapa = ultimaEtapa || 'desconhecida';
  analyticsData.metricas.abandonoPorEtapa[etapa] = (analyticsData.metricas.abandonoPorEtapa[etapa] || 0) + 1;
}

// Registra a venda e atualiza métricas
function registrarVenda(pedido) {
  if (CONFIG.DEBUG) {
    console.log(`\n✅ [DEBUG] registrarVenda() chamada!`);
    console.log(`   ID: ${pedido.id}`);
    console.log(`   Cliente: ${pedido.cliente}`);
  }
  
  analyticsData.vendas.push(pedido);
  analyticsData.metricas.totalVendas++;
  
  if (CONFIG.DEBUG) {
    console.log(`   Total de vendas agora: ${analyticsData.vendas.length}`);
  }
  
  // Cliente único
  if (pedido.cliente) {
    analyticsData.metricas.clientesUnicos.add(pedido.cliente.toLowerCase());
  }
  
  // Vendas por hora
  const hora = pedido.hora;
  analyticsData.metricas.vendasPorHora[hora] = (analyticsData.metricas.vendasPorHora[hora] || 0) + 1;
  
  // Vendas por dia da semana
  const diaSemana = pedido.diaSemana;
  analyticsData.metricas.vendasPorDia[diaSemana] = (analyticsData.metricas.vendasPorDia[diaSemana] || 0) + 1;
  
  // Vendas por data
  const data = pedido.data;
  analyticsData.metricas.vendasPorDia[data] = (analyticsData.metricas.vendasPorDia[data] || 0) + 1;
  
  // Tipo de entrega
  if (pedido.tipoentrega) {
    const tipo = pedido.tipoentrega.toLowerCase();
    if (tipo.includes('delivery') || tipo.includes('entrega')) {
      analyticsData.metricas.tiposEntrega.delivery++;
    } else {
      analyticsData.metricas.tiposEntrega.retirada++;
    }
  }
  
  // Forma de pagamento
  if (pedido.pagamento) {
    const pag = pedido.pagamento.toLowerCase();
    analyticsData.metricas.formasPagamento[pag] = (analyticsData.metricas.formasPagamento[pag] || 0) + 1;
  }
  
  // Itens vendidos (básico)
  if (pedido.itens) {
    const itens = pedido.itens.toLowerCase();
    // Palavras-chave comuns
    ['pizza', 'lanche', 'hamburguer', 'refrigerante', 'suco', 'água', 'batata'].forEach(item => {
      if (itens.includes(item)) {
        analyticsData.metricas.itensMaisVendidos[item] = (analyticsData.metricas.itensMaisVendidos[item] || 0) + 1;
      }
    });
  }
  
  // Salva no arquivo
  salvarDados();
  
  return pedido;
}

// Envia notificação para o admin via Telegram
async function notificarAdmin(pedido) {
  if (!CONFIG.TELEGRAM_ENABLED) {
    console.log('\n📱 [NOTIFICAÇÃO DESATIVADA] Configure o Telegram para receber alertas');
    return;
  }
  
  try {
    const mensagem = `🔔 *NOVA VENDA!*

📦 *Pedido:* ${pedido.id}
👤 *Cliente:* ${pedido.cliente || 'Não informado'}
📞 *Telefone:* ${pedido.telefone || 'Não informado'}

🛒 *Itens:*
${pedido.itens || 'Não especificado'}

📍 *Endereço:* ${pedido.endereco || 'Retirada'}
🚚 *Tipo:* ${pedido.tipoentrega || 'Não informado'}
💳 *Pagamento:* ${pedido.pagamento || 'Não informado'}

📝 *Obs:* ${pedido.observacoes || 'Nenhuma'}

⏰ ${pedido.data} às ${pedido.hora}h`;

    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CONFIG.TELEGRAM_ADMIN_CHAT_ID,
        text: mensagem,
        parse_mode: 'Markdown'
      })
    });
    
    console.log('\n✅ Notificação enviada para o admin!');
  } catch (error) {
    console.log(`\n⚠️ Erro ao enviar notificação: ${error.message}`);
  }
}

// Exibe relatório rápido
function exibirRelatorio() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO COMPLETO DE ANALYTICS');
  console.log('='.repeat(60));
  
  // Métricas básicas
  const totalSessoes = analyticsData.sessoes.length || 1;
  const taxaConversao = ((analyticsData.vendas.length / totalSessoes) * 100).toFixed(1);
  
  console.log('\n📈 RESUMO GERAL');
  console.log('-'.repeat(40));
  console.log(`   Vendas fechadas: ${analyticsData.vendas.length}`);
  console.log(`   Conversas abandonadas: ${analyticsData.abandonos.length}`);
  console.log(`   Taxa de conversão: ${taxaConversao}%`);
  console.log(`   Clientes únicos: ${analyticsData.metricas.clientesUnicos.size}`);
  
  // MÉTRICA PREMIUM 1: Abandono por etapa
  console.log('\n🚪 ABANDONO POR ETAPA (Onde clientes desistem)');
  console.log('-'.repeat(40));
  if (Object.keys(analyticsData.metricas.abandonoPorEtapa).length > 0) {
    const totalAbandonos = Object.values(analyticsData.metricas.abandonoPorEtapa).reduce((a, b) => a + b, 0);
    Object.entries(analyticsData.metricas.abandonoPorEtapa)
      .sort((a, b) => b[1] - a[1])
      .forEach(([etapa, qtd]) => {
        const percent = ((qtd / totalAbandonos) * 100).toFixed(0);
        console.log(`   ${etapa}: ${qtd} (${percent}%)`);
      });
  } else {
    console.log('   Nenhum abandono registrado ainda');
  }
  
  // MÉTRICA PREMIUM 2: Análise de Sentimento
  console.log('\n😊 ANÁLISE DE SENTIMENTO');
  console.log('-'.repeat(40));
  const sent = analyticsData.metricas.sentimentoGeral;
  const totalSent = sent.positivo + sent.neutro + sent.impaciente + sent.irritado + sent.confuso;
  if (totalSent > 0) {
    console.log(`   😊 Positivo: ${sent.positivo} (${((sent.positivo/totalSent)*100).toFixed(0)}%)`);
    console.log(`   😐 Neutro: ${sent.neutro} (${((sent.neutro/totalSent)*100).toFixed(0)}%)`);
    console.log(`   😤 Impaciente: ${sent.impaciente} (${((sent.impaciente/totalSent)*100).toFixed(0)}%)`);
    console.log(`   😠 Irritado: ${sent.irritado} (${((sent.irritado/totalSent)*100).toFixed(0)}%)`);
    console.log(`   😕 Confuso: ${sent.confuso} (${((sent.confuso/totalSent)*100).toFixed(0)}%)`);
    
    // Alertas de irritação
    const alertasRecentes = analyticsData.metricas.alertasIrritacao.slice(-5);
    if (alertasRecentes.length > 0) {
      console.log('\n   ⚠️ ALERTAS RECENTES:');
      alertasRecentes.forEach(a => {
        console.log(`      - Cliente ${a.sentimento} na etapa "${a.etapa}"`);
      });
    }
  } else {
    console.log('   Nenhum dado de sentimento ainda');
  }
  
  // MÉTRICA PREMIUM 3: Itens não disponíveis (Oportunidades)
  console.log('\n💡 OPORTUNIDADES DE NEGÓCIO (Itens pedidos que não temos)');
  console.log('-'.repeat(40));
  if (Object.keys(analyticsData.metricas.itensNaoTemos).length > 0) {
    Object.entries(analyticsData.metricas.itensNaoTemos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([item, qtd]) => {
        console.log(`   "${item}": ${qtd} pedidos`);
      });
    console.log('\n   💰 INSIGHT: Considere adicionar esses itens ao cardápio!');
  } else {
    console.log('   Nenhum item não disponível registrado');
  }
  
  // Métricas de vendas
  if (analyticsData.vendas.length > 0) {
    console.log('\n⏰ HORÁRIOS DE PICO');
    console.log('-'.repeat(40));
    if (Object.keys(analyticsData.metricas.vendasPorHora).length > 0) {
      Object.entries(analyticsData.metricas.vendasPorHora)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([hora, qtd]) => console.log(`   ${hora}h: ${qtd} vendas`));
    }
    
    console.log('\n💳 FORMAS DE PAGAMENTO');
    console.log('-'.repeat(40));
    if (Object.keys(analyticsData.metricas.formasPagamento).length > 0) {
      Object.entries(analyticsData.metricas.formasPagamento)
        .sort((a, b) => b[1] - a[1])
        .forEach(([forma, qtd]) => console.log(`   ${forma}: ${qtd}`));
    }
    
    console.log('\n🚚 TIPO DE ENTREGA');
    console.log('-'.repeat(40));
    console.log(`   Delivery: ${analyticsData.metricas.tiposEntrega.delivery}`);
    console.log(`   Retirada: ${analyticsData.metricas.tiposEntrega.retirada}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📁 Dados salvos em: ' + CONFIG.DATA_FILE);
  console.log('='.repeat(60) + '\n');
}

// ============================================
// CÓDIGO DO TESTE
// ============================================

const conversationHistory = [];
let sessaoAtual = {
  id: `SESSAO-${Date.now()}`,
  inicio: new Date().toISOString(),
  mensagens: 0,
  vendaFechada: false,
  ultimaEtapa: 'saudacao'
};

async function sendToGemini(userMessage) {
  conversationHistory.push({ role: 'user', parts: [{ text: userMessage }] });
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: conversationHistory,
        systemInstruction: {
          parts: [{ text: CONFIG.SYSTEM_PROMPT }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1500, // Aumentado para evitar truncamento das tags
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Erro ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Resposta vazia do Gemini');
    }
    
    const assistantMessage = data.candidates[0].content.parts[0].text;
    
    // ============================================
    // LOG DA RESPOSTA BRUTA (DEBUG)
    // ============================================
    if (CONFIG.DEBUG) {
      console.log('\n' + '='.repeat(60));
      console.log('🔍 [DEBUG] RESPOSTA BRUTA DO GEMINI:');
      console.log('='.repeat(60));
      console.log(assistantMessage);
      console.log('='.repeat(60));
      
      // Verifica se tem as tags esperadas
      const temPedido = assistantMessage.toLowerCase().includes('pedido_fechado') || 
                        assistantMessage.toLowerCase().includes('pedido fechado');
      const temAnalytics = assistantMessage.toLowerCase().includes('analytics');
      const temNaoTemos = assistantMessage.toLowerCase().includes('nao_temos') ||
                          assistantMessage.toLowerCase().includes('nao temos');
      
      console.log(`📌 Tags detectadas na resposta:`);
      console.log(`   [PEDIDO_FECHADO]: ${temPedido ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`   [ANALYTICS]: ${temAnalytics ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`   [NAO_TEMOS]: ${temNaoTemos ? '✅ SIM' : '❌ NÃO'}`);
      console.log('='.repeat(60) + '\n');
    }
    
    conversationHistory.push({ role: 'model', parts: [{ text: assistantMessage }] });
    
    // Info de tokens (aproximado)
    const inputTokens = data.usageMetadata?.promptTokenCount || 0;
    const outputTokens = data.usageMetadata?.candidatesTokenCount || 0;
    
    // Verifica se a resposta foi truncada
    if (CONFIG.DEBUG) {
      const finishReason = data.candidates[0]?.finishReason;
      if (finishReason && finishReason !== 'STOP') {
        console.log(`⚠️ [DEBUG] Resposta pode estar truncada! finishReason: ${finishReason}`);
      }
    }
    
    // Extrai todas as marcações
    const pedido = extrairPedido(assistantMessage);
    const analytics = extrairAnalytics(assistantMessage);
    const naoTemos = extrairNaoTemos(assistantMessage);
    const mensagemLimpa = limparMarcacao(assistantMessage);
    
    // Log resumo da extração
    if (CONFIG.DEBUG) {
      console.log(`📦 [DEBUG] Resultado da extração:`);
      console.log(`   Pedido: ${pedido ? '✅ EXTRAÍDO' : '❌ Não encontrado'}`);
      console.log(`   Analytics: ${analytics ? '✅ EXTRAÍDO' : '❌ Não encontrado'}`);
      console.log(`   NaoTemos: ${naoTemos ? '✅ EXTRAÍDO' : '❌ Não encontrado'}`);
    }
    
    return { 
      message: mensagemLimpa,
      messageOriginal: assistantMessage,
      pedido: pedido,
      analytics: analytics,
      naoTemos: naoTemos,
      tokens: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens },
      cost: 'GRATUITO' 
    };
  } catch (error) {
    console.log(`❌ [DEBUG] Erro no Gemini: ${error.message}`);
    return { error: error.message };
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🤖 TESTE DO BOT AERO LANCHES - MODO DEBUG ATIVO');
  console.log('='.repeat(60));
  console.log('\nDigite mensagens como se fosse um cliente no WhatsApp.');
  console.log('\nComandos:');
  console.log('  "sair"        - Encerra (registra abandono se não fechou venda)');
  console.log('  "limpar"      - Nova conversa');
  console.log('  "relatorio"   - Relatório completo de analytics');
  console.log('  "vendas"      - Lista últimas vendas');
  console.log('  "abandonos"   - Mostra onde clientes desistem');
  console.log('  "sentimento"  - Análise de sentimento');
  console.log('  "oportunidades" - Itens que não temos');
  console.log('  "debug"       - Mostra estado das variáveis');
  console.log('  "arquivo"     - Mostra conteúdo do dados-vendas.json\n');
  
  // Carrega dados existentes
  carregarDados();
  
  if (CONFIG.GEMINI_API_KEY === 'SUA_CHAVE_GEMINI_AQUI') {
    console.log('⚠️  CONFIGURE SUA API KEY DO GEMINI (GRATUITA!)\n');
    console.log('   1. Acesse: https://aistudio.google.com/app/apikey');
    console.log('   2. Clique em "Create API Key"');
    console.log('   3. Copie a chave e cole no arquivo test-bot-gemini.js');
    console.log('   4. Execute novamente: node test-bot-gemini.js\n');
    return;
  }
  
  console.log('✅ Gemini configurado! Modelo: ' + CONFIG.MODEL);
  if (CONFIG.TELEGRAM_ENABLED) {
    console.log('✅ Telegram configurado para notificações');
  } else {
    console.log('ℹ️  Telegram desativado (configure para receber notificações)');
  }
  console.log('-'.repeat(60) + '\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = () => {
    rl.question('\n👤 Cliente: ', async (input) => {
      const userInput = input.trim();
      
      if (!userInput) {
        askQuestion();
        return;
      }
      
      if (userInput.toLowerCase() === 'sair') {
        console.log('\n📊 Salvando dados...');
        
        // Registra abandono se não fechou venda
        if (!sessaoAtual.vendaFechada && sessaoAtual.mensagens > 0) {
          registrarAbandono(sessaoAtual, sessaoAtual.ultimaEtapa);
          console.log(`⚠️ Sessão registrada como ABANDONO na etapa: ${sessaoAtual.ultimaEtapa}`);
        }
        
        // Salva sessão
        analyticsData.sessoes.push({ ...sessaoAtual, fim: new Date().toISOString() });
        salvarDados();
        
        console.log('👋 Encerrando teste. Até mais!\n');
        rl.close();
        return;
      }
      
      if (userInput.toLowerCase() === 'limpar') {
        // Registra abandono da sessão anterior se não fechou venda
        if (!sessaoAtual.vendaFechada && sessaoAtual.mensagens > 0) {
          registrarAbandono(sessaoAtual, sessaoAtual.ultimaEtapa);
          analyticsData.sessoes.push({ ...sessaoAtual, fim: new Date().toISOString() });
        }
        
        conversationHistory.length = 0;
        sessaoAtual = { 
          id: `SESSAO-${Date.now()}`,
          inicio: new Date().toISOString(), 
          mensagens: 0, 
          vendaFechada: false,
          ultimaEtapa: 'saudacao'
        };
        console.log('\n🔄 Conversa reiniciada! (Sessão anterior registrada)\n');
        askQuestion();
        return;
      }
      
      if (userInput.toLowerCase() === 'relatorio') {
        exibirRelatorio();
        askQuestion();
        return;
      }
      
      if (userInput.toLowerCase() === 'abandonos') {
        console.log('\n🚪 ANÁLISE DE ABANDONOS');
        console.log('-'.repeat(40));
        if (Object.keys(analyticsData.metricas.abandonoPorEtapa).length > 0) {
          const total = Object.values(analyticsData.metricas.abandonoPorEtapa).reduce((a, b) => a + b, 0);
          Object.entries(analyticsData.metricas.abandonoPorEtapa)
            .sort((a, b) => b[1] - a[1])
            .forEach(([etapa, qtd]) => {
              const percent = ((qtd / total) * 100).toFixed(0);
              const bar = '█'.repeat(Math.ceil(percent / 5));
              console.log(`   ${etapa}: ${qtd} (${percent}%) ${bar}`);
            });
          console.log('\n💡 INSIGHT: Foque em melhorar as etapas com mais abandono!');
        } else {
          console.log('   Nenhum abandono registrado ainda');
        }
        console.log('');
        askQuestion();
        return;
      }
      
      if (userInput.toLowerCase() === 'sentimento') {
        console.log('\n😊 ANÁLISE DE SENTIMENTO');
        console.log('-'.repeat(40));
        const s = analyticsData.metricas.sentimentoGeral;
        const total = s.positivo + s.neutro + s.impaciente + s.irritado + s.confuso;
        if (total > 0) {
          console.log(`   😊 Positivo: ${s.positivo} (${((s.positivo/total)*100).toFixed(0)}%)`);
          console.log(`   😐 Neutro: ${s.neutro} (${((s.neutro/total)*100).toFixed(0)}%)`);
          console.log(`   😤 Impaciente: ${s.impaciente} (${((s.impaciente/total)*100).toFixed(0)}%)`);
          console.log(`   😠 Irritado: ${s.irritado} (${((s.irritado/total)*100).toFixed(0)}%)`);
          console.log(`   😕 Confuso: ${s.confuso} (${((s.confuso/total)*100).toFixed(0)}%)`);
          
          const negativos = s.irritado + s.impaciente;
          if (negativos > 0) {
            console.log(`\n   ⚠️ ${negativos} interações negativas identificadas`);
          }
        } else {
          console.log('   Nenhum dado de sentimento ainda');
        }
        console.log('');
        askQuestion();
        return;
      }
      
      if (userInput.toLowerCase() === 'oportunidades') {
        console.log('\n💡 OPORTUNIDADES DE NEGÓCIO');
        console.log('-'.repeat(40));
        if (Object.keys(analyticsData.metricas.itensNaoTemos).length > 0) {
          console.log('   Itens que clientes pediram e NÃO temos:\n');
          Object.entries(analyticsData.metricas.itensNaoTemos)
            .sort((a, b) => b[1] - a[1])
            .forEach(([item, qtd]) => {
              console.log(`   📌 "${item}": ${qtd} pedido(s)`);
            });
          console.log('\n   💰 INSIGHT: Adicionar esses itens pode aumentar seu faturamento!');
        } else {
          console.log('   Nenhum item não disponível registrado ainda');
        }
        console.log('');
        askQuestion();
        return;
      }
      
      if (userInput.toLowerCase() === 'vendas') {
        console.log('\n📋 ÚLTIMAS VENDAS:');
        console.log('-'.repeat(40));
        if (analyticsData.vendas.length === 0) {
          console.log('Nenhuma venda registrada ainda.');
        } else {
          analyticsData.vendas.slice(-5).reverse().forEach((v, i) => {
            console.log(`\n${i + 1}. ${v.id}`);
            console.log(`   Cliente: ${v.cliente || 'N/A'}`);
            console.log(`   Itens: ${v.itens || 'N/A'}`);
            console.log(`   Data: ${v.data} às ${v.hora}h`);
          });
        }
        console.log('\n');
        askQuestion();
        return;
      }
      
      // COMANDO DEBUG - Estado das variáveis em memória
      if (userInput.toLowerCase() === 'debug') {
        console.log('\n' + '='.repeat(60));
        console.log('🔧 DEBUG - ESTADO DAS VARIÁVEIS EM MEMÓRIA');
        console.log('='.repeat(60));
        console.log(`\n📊 analyticsData.vendas: ${analyticsData.vendas.length} itens`);
        console.log(`📊 analyticsData.sessoes: ${analyticsData.sessoes.length} itens`);
        console.log(`📊 analyticsData.abandonos: ${analyticsData.abandonos.length} itens`);
        console.log(`📊 analyticsData.sentimentos: ${analyticsData.sentimentos.length} itens`);
        console.log(`📊 analyticsData.itensNaoDisponíveis: ${analyticsData.itensNaoDisponíveis.length} itens`);
        
        console.log(`\n📈 Métricas:`);
        console.log(`   totalVendas: ${analyticsData.metricas.totalVendas}`);
        console.log(`   totalAbandonos: ${analyticsData.metricas.totalAbandonos}`);
        console.log(`   clientesUnicos: ${analyticsData.metricas.clientesUnicos.size}`);
        console.log(`   sentimentoGeral: ${JSON.stringify(analyticsData.metricas.sentimentoGeral)}`);
        console.log(`   abandonoPorEtapa: ${JSON.stringify(analyticsData.metricas.abandonoPorEtapa)}`);
        console.log(`   itensNaoTemos: ${JSON.stringify(analyticsData.metricas.itensNaoTemos)}`);
        
        console.log(`\n🔄 Sessão atual:`);
        console.log(`   ID: ${sessaoAtual.id}`);
        console.log(`   Mensagens: ${sessaoAtual.mensagens}`);
        console.log(`   Venda fechada: ${sessaoAtual.vendaFechada}`);
        console.log(`   Última etapa: ${sessaoAtual.ultimaEtapa}`);
        
        console.log(`\n💬 Histórico de conversa: ${conversationHistory.length} mensagens`);
        console.log('='.repeat(60) + '\n');
        askQuestion();
        return;
      }
      
      // COMANDO ARQUIVO - Mostra conteúdo do JSON salvo
      if (userInput.toLowerCase() === 'arquivo') {
        console.log('\n' + '='.repeat(60));
        console.log('📁 CONTEÚDO DO ARQUIVO: ' + CONFIG.DATA_FILE);
        console.log('='.repeat(60));
        try {
          if (fs.existsSync(CONFIG.DATA_FILE)) {
            const content = fs.readFileSync(CONFIG.DATA_FILE, 'utf8');
            const data = JSON.parse(content);
            console.log(`\n📊 Resumo do arquivo:`);
            console.log(`   Vendas: ${data.vendas?.length || 0}`);
            console.log(`   Sessões: ${data.sessoes?.length || 0}`);
            console.log(`   Abandonos: ${data.abandonos?.length || 0}`);
            console.log(`   Última atualização: ${data.ultimaAtualizacao || 'N/A'}`);
            console.log(`\n📋 Resumo salvo:`);
            console.log(`   ${JSON.stringify(data.resumo, null, 2)}`);
            console.log(`\n📈 Métricas Premium salvas:`);
            console.log(`   ${JSON.stringify(data.metricasPremium, null, 2)}`);
          } else {
            console.log('\n⚠️ Arquivo ainda não existe. Faça algumas interações primeiro.');
          }
        } catch (e) {
          console.log(`\n❌ Erro ao ler arquivo: ${e.message}`);
        }
        console.log('='.repeat(60) + '\n');
        askQuestion();
        return;
      }
      
      sessaoAtual.mensagens++;
      console.log('\n⏳ Processando...');
      
      const result = await sendToGemini(userInput);
      
      if (result.error) {
        console.log(`\n❌ Erro: ${result.error}`);
      } else {
        console.log(`\n🤖 Sara (Bot): ${result.message}`);
        console.log(`\n   📊 Tokens: ${result.tokens.total} | 💰 Custo: ${result.cost}`);
        
        // Processa analytics (silenciosamente em background)
        if (result.analytics) {
          sessaoAtual.ultimaEtapa = result.analytics.etapa || sessaoAtual.ultimaEtapa;
          registrarAnalytics(result.analytics, sessaoAtual.id);
        }
        
        // Processa item não disponível
        if (result.naoTemos) {
          registrarItemNaoDisponivel(result.naoTemos);
        }
        
        // Verifica se houve venda fechada
        if (result.pedido) {
          console.log('\n' + '='.repeat(60));
          console.log('🎉 VENDA DETECTADA!');
          console.log('='.repeat(60));
          
          const pedidoRegistrado = registrarVenda(result.pedido);
          sessaoAtual.vendaFechada = true;
          
          console.log(`\n📦 ID do Pedido: ${pedidoRegistrado.id}`);
          console.log(`👤 Cliente: ${pedidoRegistrado.cliente || 'N/A'}`);
          console.log(`🛒 Itens: ${pedidoRegistrado.itens || 'N/A'}`);
          console.log(`📍 Endereço: ${pedidoRegistrado.endereco || 'N/A'}`);
          console.log(`💳 Pagamento: ${pedidoRegistrado.pagamento || 'N/A'}`);
          
          // Notifica admin
          await notificarAdmin(pedidoRegistrado);
          
          console.log('\n✅ Venda salva em ' + CONFIG.DATA_FILE);
          console.log('='.repeat(60));
        }
      }
      
      askQuestion();
    });
  };

  askQuestion();
}

main();

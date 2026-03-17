/**
 * Script para testar o bot de IA ANTES de conectar ao WhatsApp
 * Execute: node test-bot.js
 */

const readline = require('readline');

// ============================================
// CONFIGURAÇÃO DO BOT - EDITE AQUI!
// ============================================
const CONFIG = {
  // Coloque sua API Key da OpenAI aqui
  OPENAI_API_KEY: 'sk-sua-chave-aqui',
  
  // Modelo a usar
  MODEL: 'gpt-4o-mini', // mais barato para testes
  
  // Personalidade do bot (EDITE ISSO!)
  SYSTEM_PROMPT: `Você é a Ana, assistente virtual da TechSolutions, uma empresa de automação industrial.

SOBRE A EMPRESA:
- Fundada em 2015, sede em São Paulo
- Especializada em automação de linha de produção, manutenção preditiva e consultoria indústria 4.0
- Atende empresas de médio e grande porte
- Horário: seg-sex, 8h às 18h

COMO SE COMPORTAR:
- Seja profissional, cordial e objetiva
- Use linguagem clara e acessível
- Para orçamentos, colete: nome, empresa, telefone e descrição da necessidade
- Se não souber algo, diga que vai verificar e retornar

SERVIÇOS E PREÇOS (aproximados):
- Consultoria inicial: gratuita
- Projeto de automação: a partir de R$ 15.000
- Manutenção preditiva: planos mensais a partir de R$ 2.000
- Treinamento: R$ 500/pessoa`
};

// ============================================
// CÓDIGO DO TESTE (não precisa editar)
// ============================================

const conversationHistory = [];

async function sendToOpenAI(userMessage) {
  conversationHistory.push({ role: 'user', content: userMessage });
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: CONFIG.MODEL,
        messages: [
          { role: 'system', content: CONFIG.SYSTEM_PROMPT },
          ...conversationHistory
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro na API OpenAI');
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;
    
    conversationHistory.push({ role: 'assistant', content: assistantMessage });
    
    // Info de custo
    const tokens = data.usage;
    const cost = ((tokens.prompt_tokens * 0.00015 + tokens.completion_tokens * 0.0006) * 5).toFixed(4);
    
    return { message: assistantMessage, tokens, cost };
  } catch (error) {
    return { error: error.message };
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🤖 TESTE DO BOT - TechSolutions (empresa fictícia)');
  console.log('='.repeat(60));
  console.log('\nDigite mensagens como se fosse um cliente no WhatsApp.');
  console.log('Comandos: "sair" para encerrar, "limpar" para nova conversa\n');
  
  if (CONFIG.OPENAI_API_KEY === 'sk-sua-chave-aqui') {
    console.log('⚠️  ATENÇÃO: Configure sua API Key da OpenAI no arquivo!');
    console.log('   Edite a variável OPENAI_API_KEY no início do arquivo.\n');
    console.log('   Obtenha em: https://platform.openai.com/api-keys\n');
    return;
  }

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
        console.log('\n👋 Encerrando teste. Até mais!\n');
        rl.close();
        return;
      }
      
      if (userInput.toLowerCase() === 'limpar') {
        conversationHistory.length = 0;
        console.log('\n🔄 Conversa reiniciada!\n');
        askQuestion();
        return;
      }
      
      console.log('\n⏳ Processando...');
      
      const result = await sendToOpenAI(userInput);
      
      if (result.error) {
        console.log(`\n❌ Erro: ${result.error}`);
      } else {
        console.log(`\n🤖 Ana (Bot): ${result.message}`);
        console.log(`\n   📊 Tokens: ${result.tokens.total_tokens} | 💰 Custo: ~R$ ${result.cost}`);
      }
      
      askQuestion();
    });
  };

  askQuestion();
}

main();

/**
 * Simulador de Bot LOCAL - Sem API externa
 * Execute: node test-bot-local.js
 */

const readline = require('readline');

// ============================================
// CONFIGURAÇÃO DO BOT - EDITE AQUI!
// ============================================
const CONFIG = {
  BOT_NAME: 'Ana',
  EMPRESA: 'TechSolutions',
  
  // Respostas automáticas baseadas em palavras-chave
  RESPOSTAS: {
    // Saudações
    'oi|olá|ola|hey|bom dia|boa tarde|boa noite|e aí|eai': 
      'Olá! 👋 Sou a Ana, assistente virtual da TechSolutions. Como posso ajudar você hoje?',
    
    // Preços e orçamento
    'preço|preco|valor|quanto custa|orçamento|orcamento|custo':
      'Nossos serviços:\n• Consultoria inicial: GRATUITA\n• Projeto de automação: a partir de R$ 15.000\n• Manutenção preditiva: planos mensais a partir de R$ 2.000\n• Treinamento: R$ 500/pessoa\n\nPosso agendar uma consultoria gratuita para entender melhor sua necessidade?',
    
    // Serviços
    'serviço|servico|o que vocês fazem|vocês fazem|trabalho':
      'A TechSolutions oferece:\n✅ Automação de linha de produção\n✅ Manutenção preditiva com sensores IoT\n✅ Consultoria Indústria 4.0\n✅ Treinamento para equipes\n\nQual desses serviços te interessa mais?',
    
    // Horário
    'horário|horario|funcionamento|abre|fecha|atendimento':
      '🕐 Nosso horário de atendimento:\nSegunda a Sexta: 8h às 18h\n\nFora desse horário, deixe sua mensagem que retornaremos assim que possível!',
    
    // Contato
    'telefone|email|contato|falar com|humano|atendente':
      '📞 Para falar com nossa equipe:\n• Telefone: (11) 3000-1234\n• Email: contato@techsolutions.com\n• WhatsApp: Este mesmo número!\n\nPosso ajudar com mais alguma informação?',
    
    // Localização
    'endereço|endereco|onde fica|localização|localizacao|sede':
      '📍 Nossa sede fica em São Paulo:\nAv. Paulista, 1000 - 10º andar\nBela Vista - SP\n\nAtendemos todo o Brasil!',
    
    // Agendamento
    'agendar|agenda|marcar|reunião|reuniao|visita':
      'Ótimo! Para agendar, preciso de algumas informações:\n1️⃣ Seu nome completo\n2️⃣ Nome da empresa\n3️⃣ Telefone para contato\n4️⃣ Melhor horário para a reunião\n\nPode me informar?',
    
    // Agradecimento
    'obrigado|obrigada|valeu|agradeço|agradeco|thanks':
      'Por nada! 😊 Estou aqui para ajudar. Se precisar de mais alguma coisa, é só chamar!',
    
    // Despedida
    'tchau|até mais|ate mais|adeus|bye|flw|falou':
      'Até mais! 👋 Foi um prazer atender você. Qualquer dúvida, estamos à disposição!',
    
    // Automação específica
    'automação|automacao|automatizar|robô|robo|plc':
      'Nossa automação industrial inclui:\n🔧 Integração de PLCs e sensores\n🔧 Sistemas SCADA\n🔧 Robôs colaborativos\n🔧 Integração com ERP/MES\n\nQuer saber mais sobre algum desses pontos?',
    
    // Manutenção
    'manutenção|manutencao|quebrou|parou|problema|defeito':
      'Oferecemos manutenção preditiva com:\n🔍 Sensores IoT em tempo real\n🔍 Análise de vibração e temperatura\n🔍 Alertas antes de falhas\n🔍 Relatórios mensais\n\nIsso pode reduzir paradas não planejadas em até 70%!',
  }
};

// ============================================
// CÓDIGO DO SIMULADOR
// ============================================

function findResponse(userMessage) {
  const message = userMessage.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  for (const [keywords, response] of Object.entries(CONFIG.RESPOSTAS)) {
    const regex = new RegExp(keywords, 'i');
    if (regex.test(message)) {
      return response;
    }
  }
  
  // Resposta padrão
  return `Entendi! Vou verificar essa informação com nossa equipe e retorno em breve.\n\nEnquanto isso, posso ajudar com:\n• Informações sobre nossos serviços\n• Preços e orçamentos\n• Agendamento de reunião\n• Horário de funcionamento\n\nO que prefere?`;
}

function main() {
  console.log('\n' + '='.repeat(60));
  console.log(`🤖 SIMULADOR DE BOT LOCAL - ${CONFIG.EMPRESA}`);
  console.log('='.repeat(60));
  console.log('\nEste simulador funciona OFFLINE com respostas pré-definidas.');
  console.log('Use para testar o fluxo de conversa antes de conectar ao WhatsApp.');
  console.log('\nDigite mensagens como se fosse um cliente.');
  console.log('Comandos: "sair" para encerrar\n');
  console.log('-'.repeat(60) + '\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = () => {
    rl.question('👤 Cliente: ', (input) => {
      const userInput = input.trim();
      
      if (!userInput) {
        askQuestion();
        return;
      }
      
      if (userInput.toLowerCase() === 'sair') {
        console.log('\n👋 Encerrando simulador. Até mais!\n');
        rl.close();
        return;
      }
      
      // Simula delay de "digitando..."
      console.log('\n⏳ Ana está digitando...');
      
      setTimeout(() => {
        const response = findResponse(userInput);
        console.log(`\n🤖 ${CONFIG.BOT_NAME} (Bot): ${response}\n`);
        console.log('-'.repeat(60) + '\n');
        askQuestion();
      }, 500 + Math.random() * 1000); // Delay aleatório 0.5-1.5s
    });
  };

  askQuestion();
}

main();

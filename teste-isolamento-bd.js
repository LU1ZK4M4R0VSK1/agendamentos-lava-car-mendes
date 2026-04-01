const Database = require('./src-bot/database/Database');
const StatsService = require('./src-bot/services/StatsService');
require('dotenv').config();

const dbUrl = 'postgresql://postgres:Dudu%402006.@localhost:5432/postgres';

async function runTests() {
  console.log('🧪 Iniciando Testes de Isolamento Multi-Tenant do Banco de Dados...\n');
  const db = new Database(dbUrl);
  await db.initialize();

  const stats = new StatsService({ db });

  try {
    // 0. Preparação de Dados Mocks
    console.log('📦 Preparando Tenant A e Tenant B...');
    const orgA = await db.createOrganization({ name: 'Tenant Lava Car A', instanceName: 'lava-car-a' + Date.now() });
    const orgB = await db.createOrganization({ name: 'Tenant Lava Car B', instanceName: 'lava-car-b' + Date.now() });

    const customerA = await db.findOrCreateCustomer('11111111@s.whatsapp.net', orgA.id, 'Cliente A');
    const customerB = await db.findOrCreateCustomer('22222222@s.whatsapp.net', orgB.id, 'Cliente B');

    // Mudar type de services para usar capacity e active (por default active é true e capacity é 1)
    const serviceA = await db.createOrUpdateService({ id: 'srvA', organizationId: orgA.id, name: 'Lavagem Simples', durationMinutes: 60, price: 50.0 });
    const serviceB = await db.createOrUpdateService({ id: 'srvB', organizationId: orgB.id, name: 'Lavagem Simples', durationMinutes: 60, price: 50.0 });

    const testTimeStart = new Date('2026-04-01T18:00:00.000Z').toISOString();
    const testTimeEnd = new Date('2026-04-01T19:00:00.000Z').toISOString();

    // ==========================================
    // 1. Teste de Colisão Simples
    // ==========================================
    console.log('\n▶️ TESTE 1: Colisão Simples (Mesmo Tenant)');
    console.log(`Action 1: Inserindo agendamento para Tenant A às 18:00...`);
    await db.createAppointment({
      customerId: customerA.id,
      organizationId: orgA.id,
      serviceId: serviceA,
      startTime: testTimeStart,
      endTime: testTimeEnd
    });
    console.log('✅ Inserido com sucesso (Lava Car A às 18:00).');

    let errorGist = false;
    try {
      console.log(`Action 2: Tentando agendar novamente para o Tenant A no mesmo horário...`);
      await db.createAppointment({
        customerId: customerA.id,
        organizationId: orgA.id,
        serviceId: serviceA,
        startTime: testTimeStart,
        endTime: testTimeEnd
      });
    } catch (error) {
      if (error.message === 'CONFLITO_AGENDA') {
        console.log('✅ SUCESSO DO TESTE: O Banco PostgreSQL REJEITOU a segunda inserção com Range Overlap (CONFLITO_AGENDA).');
        errorGist = true;
      } else {
        throw error;
      }
    }

    if (!errorGist) {
      console.error('❌ FALHA: O banco permitiu sobreposição de horários no mesmo Tenant!');
    }

    // ==========================================
    // 2. Teste de Isolamento Horizontal
    // ==========================================
    console.log('\n▶️ TESTE 2: Isolamento Horizontal (Tenants Diferentes)');
    console.log(`Action: Inserindo agendamento para Tenant B às 18:00...`);
    try {
      await db.createAppointment({
        customerId: customerB.id,
        organizationId: orgB.id,
        serviceId: serviceB,
        startTime: testTimeStart,
        endTime: testTimeEnd
      });
      console.log('✅ SUCESSO DO TESTE: O Banco ACEITOU o agendamento no Tenant B. O horário das 18h do Lava Car A não bloqueou o B!');
    } catch (e) {
      console.error('❌ FALHA NO TESTE: Ocorreu um bloqueio cruzado entre Tenants!', e.message);
    }

    // ==========================================
    // 3. Teste do Relatório Multi-Tenant
    // ==========================================
    console.log('\n▶️ TESTE 3: Relatório Multi-Tenant (.dia)');
    
    // Inserir algumas mensagens e pedidos falsos no passado recente para cair no filtro de 'dia'
    // Como a query usa startOfDay até agora, precisamos inserir dados com timestamp de hoje.
    // O createAppointment já cria com a data atual no 'created_at'. 
    
    const statsA = await stats.getStats(orgA.id, 'tudo');
    const statsB = await stats.getStats(orgB.id, 'tudo');

    console.log(`Stats Tenant A: R$${statsA.revenue} em Receita, ${statsA.aptsCount} Volume`);
    console.log(`Stats Tenant B: R$${statsB.revenue} em Receita, ${statsB.aptsCount} Volume`);
    
    if (statsA.aptsCount === 1 && statsA.revenue === 50 && statsB.aptsCount === 1 && statsB.revenue === 50) {
      console.log('✅ SUCESSO DO TESTE: Relatórios não se misturam! Cada instância registrou apenas 1 agendamento e R$50.');
    } else {
      console.error('❌ FALHA: Valores misturados nos relatórios!', {statsA, statsB});
    }

  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO NA EXECUÇÃO DOS TESTES:');
    console.error(error);
  } finally {
    console.log('\n🧹 Fechando conexão do banco de dados...');
    await db.close();
  }
}

runTests();

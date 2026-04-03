// check-bookings.js
require('dotenv').config();
const Database = require('./src-bot/database/Database');

async function check() {
  const db = new Database(process.env.POSTGRES_URL);
  await db.initialize();
  
  try {
    const { rows: appointments } = await db.pool.query(`
      SELECT a.id, c.push_name, v.plate, v.model, s.name as service, a.total_price, a.status, a.created_at
      FROM appointments a 
      JOIN customers c ON a.customer_id = c.id 
      JOIN vehicles v ON a.vehicle_id = v.id 
      JOIN services s ON a.service_id = s.id 
      ORDER BY a.created_at DESC LIMIT 5;
    `);
    
    if (appointments.length === 0) {
      console.log('📭 Nenhum agendamento encontrado no banco.');
    } else {
      console.log(`✅ Foram encontrados ${appointments.length} agendamentos recentes:`);
      appointments.forEach(a => {
        console.log(`   • [${a.id}] ${a.push_name} | ${a.plate} (${a.model}) | ${a.service} | R$ ${a.total_price} | Status: ${a.status}`);
      });
    }
  } catch (err) {
    console.error('❌ Erro ao consultar o banco:', err.message);
  } finally {
    await db.close();
  }
}

check();

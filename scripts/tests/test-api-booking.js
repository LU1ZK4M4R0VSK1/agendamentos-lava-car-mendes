// test-api-booking.js
const axios = require('axios');

async function test() {
  const payload = {
    organization_id: 'posto3l', // instance_name in organizations
    customer: {
      name: 'Cliente de Teste Site',
      phone: '5511999999999'
    },
    vehicle: {
      plate: 'TST-1234',
      model: 'Fiat Uno',
      color: 'Escada',
      type: 'hatch'
    },
    appointment: {
      service_id: 'svc_1', // From seed.js
      date: new Date().toISOString(),
      time: '14:30',
      total_price: 40.00
    }
  };

  try {
    console.log('🧪 Testando POST /api/public/bookings...');
    const response = await axios.post('http://localhost:3001/api/public/bookings', payload);
    console.log('✅ Resposta:', response.data);
  } catch (err) {
    console.error('❌ Erro:', err.response?.data || err.message);
  }
}

test();

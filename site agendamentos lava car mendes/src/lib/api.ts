// car-wash-boss/src/lib/api.ts

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const DEFAULT_ORG = 'posto3l'; // Lava Car Mendes

export interface APIBookingPayload {
  organization_id: string;
  customer: {
    name: string;
    phone: string;
  };
  vehicle: {
    plate: string;
    model: string;
    color: string;
    type: 'hatch' | 'sedan' | 'suv';
  };
  appointment: {
    service_id: string;
    date: string; // ISO String
    time: string; // HH:mm
    total_price: number;
  };
}

export const api = {
  /**
   * Realiza um agendamento público (fluxo do cliente)
   */
  async createBooking(payload: APIBookingPayload) {
    const response = await fetch(`${API_BASE_URL}/public/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao realizar agendamento');
    }
    return response.json();
  },

  /**
   * Busca horários disponíveis para um dia e serviço específicos
   */
  async getAvailableSlots(date: string, service_id: string, org = DEFAULT_ORG) {
    const response = await fetch(`${API_BASE_URL}/public/available-slots?organization_id=${org}&date=${date}&service_id=${service_id}`);
    if (!response.ok) throw new Error('Erro ao buscar horários disponíveis');
    return response.json();
  },

  /**
   * Busca dados do Dashboard Admin
   */
  async getDashboardData(org = DEFAULT_ORG) {
    const response = await fetch(`${API_BASE_URL}/admin/dashboard?org=${org}`, {
      headers: { 'x-admin-key': import.meta.env.VITE_ADMIN_API_KEY || 'dev-secret-key' }
    });
    if (!response.ok) throw new Error('Erro ao buscar dashboard');
    return response.json();
  },

  /**
   * Busca agenda do dia
   */
  async getAgenda(date: string, org = DEFAULT_ORG) {
    const response = await fetch(`${API_BASE_URL}/admin/agenda?org=${org}&date=${date}`, {
      headers: { 'x-admin-key': import.meta.env.VITE_ADMIN_API_KEY || 'dev-secret-key' }
    });
    if (!response.ok) throw new Error('Erro ao buscar agenda');
    return response.json();
  },

  /**
   * Busca lista de clientes
   */
  async getCustomers(org = DEFAULT_ORG) {
    const response = await fetch(`${API_BASE_URL}/admin/customers?org=${org}`, {
      headers: { 'x-admin-key': import.meta.env.VITE_ADMIN_API_KEY || 'dev-secret-key' }
    });
    if (!response.ok) throw new Error('Erro ao buscar clientes');
    return response.json();
  },

  /**
   * Atualiza status de um agendamento
   */
  async updateStatus(id: string, status: string, org = DEFAULT_ORG) {
    const response = await fetch(`${API_BASE_URL}/admin/appointments/${id}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-key': import.meta.env.VITE_ADMIN_API_KEY || 'dev-secret-key'
      },
      body: JSON.stringify({ status, org }),
    });
    if (!response.ok) throw new Error('Erro ao atualizar status');
    return response.json();
  }
};

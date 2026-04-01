import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, User, Car, Loader2, CheckCircle2, PlayCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AgendaItem {
  id: string;
  startTime: string;
  endTime: string;
  client: string;
  phone: string;
  service: string;
  plate: string;
  model: string;
  status: 'agendado' | 'em_andamento' | 'concluido' | 'cancelado';
  totalPrice: number;
}

export default function AdminAgenda() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgenda = async () => {
    setLoading(true);
    try {
      const data = await api.getAgenda(date);
      setAppointments(data);
    } catch (err) {
      toast.error('Erro ao buscar agenda');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgenda();
  }, [date]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await api.updateStatus(id, newStatus);
      toast.success(`Status atualizado para ${newStatus}`);
      fetchAgenda();
    } catch (err) {
      toast.error('Erro ao atualizar status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'em_andamento': return 'text-blue-500 bg-blue-500/10';
      case 'concluido': return 'text-green-500 bg-green-500/10';
      case 'cancelado': return 'text-red-500 bg-red-500/10';
      default: return 'text-yellow-500 bg-yellow-500/10';
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-foreground">Agenda</h2>
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2">
          <CalendarIcon className="w-4 h-4 text-primary" />
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent border-none text-sm font-medium focus:ring-0 text-foreground"
          />
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <CalendarIcon className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Nenhum agendamento para este dia.</p>
            </div>
          ) : appointments.map((apt) => (
            <div key={apt.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Início</span>
                    <span className="text-sm font-bold text-foreground">{format(parseISO(apt.startTime), 'HH:mm')}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-foreground">{apt.client}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getStatusColor(apt.status)}`}>
                        {apt.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-primary font-semibold">{apt.service}</p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Car className="w-3 h-3" /> {apt.plate} ({apt.model})</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-foreground">R$ {apt.totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Ações Rápidas */}
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 overflow-x-auto pb-1">
                {apt.status === 'agendado' && (
                  <Button size="sm" variant="outline" className="h-8 text-[11px] gap-1.5" onClick={() => handleStatusUpdate(apt.id, 'em_andamento')}>
                    <PlayCircle className="w-3.5 h-3.5" /> Começar
                  </Button>
                )}
                {apt.status === 'em_andamento' && (
                  <Button size="sm" variant="outline" className="h-8 text-[11px] gap-1.5 border-green-500/30 text-green-600 hover:bg-green-50" onClick={() => handleStatusUpdate(apt.id, 'concluido')}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Finalizar
                  </Button>
                )}
                {apt.status !== 'cancelado' && apt.status !== 'concluido' && (
                  <Button size="sm" variant="ghost" className="h-8 text-[11px] gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleStatusUpdate(apt.id, 'cancelado')}>
                    <XCircle className="w-3.5 h-3.5" /> Cancelar
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="h-8 text-[11px] gap-1.5 ml-auto" asChild>
                  <a href={`https://wa.me/${apt.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

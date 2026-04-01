import { Car, DollarSign, CalendarDays, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardData {
  stats: {
    today_count: number;
    today_revenue: number;
    pending_count: number;
    month_revenue: number;
  };
  upcoming: Array<{
    id: string;
    time: string;
    client: string;
    service: string;
    plate: string;
    model: string;
    status: string;
  }>;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardData().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { label: 'Carros Hoje', value: data?.stats.today_count || 0, icon: Car },
    { label: 'Receita Hoje', value: `R$ ${data?.stats.today_revenue.toFixed(2)}`, icon: DollarSign },
    { label: 'Agendamentos', value: data?.stats.pending_count || 0, icon: CalendarDays },
    { label: 'Receita Mês', value: `R$ ${data?.stats.month_revenue.toFixed(2)}`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <h2 className="text-lg font-bold text-foreground">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <s.icon className="w-4 h-4 text-primary" />
              </div>
            </div>
            <span className="text-xl font-bold text-foreground">{s.value}</span>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Próximos</h3>
        </div>
        <div className="divide-y divide-border">
          {data?.upcoming.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs italic">Nenhum agendamento pendente</div>
          ) : data?.upcoming.map((item, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors">
              <span className="text-xs font-mono text-primary w-12">{format(parseISO(item.time), 'HH:mm')}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.client}</p>
                <p className="text-xs text-muted-foreground">{item.service}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-foreground font-mono">{item.plate}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{item.model}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

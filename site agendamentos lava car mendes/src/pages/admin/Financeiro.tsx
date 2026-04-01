import { TrendingUp, BarChart3 } from 'lucide-react';

const monthlyData = [
  { month: 'Jan', revenue: 15200 },
  { month: 'Fev', revenue: 17800 },
  { month: 'Mar', revenue: 16400 },
  { month: 'Abr', revenue: 19100 },
  { month: 'Mai', revenue: 21300 },
  { month: 'Jun', revenue: 18500 },
];

const topServices = [
  { name: 'Lavagem Completa', count: 145, revenue: 'R$ 10.150' },
  { name: 'Lavagem com Cera', count: 89, revenue: 'R$ 8.900' },
  { name: 'Higienização', count: 42, revenue: 'R$ 6.300' },
  { name: 'Lavagem Simples', count: 210, revenue: 'R$ 8.400' },
];

export default function AdminFinanceiro() {
  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));

  return (
    <div className="space-y-6 animate-fade-up">
      <h2 className="text-lg font-bold text-foreground">Financeiro</h2>

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Receita Mensal</h3>
        </div>
        <div className="flex items-end gap-2 h-40">
          {monthlyData.map((d) => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">{(d.revenue / 1000).toFixed(1)}k</span>
              <div className="w-full bg-primary rounded-lg transition-all duration-500" style={{ height: `${(d.revenue / maxRevenue) * 100}%` }} />
              <span className="text-[10px] text-muted-foreground">{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Top Serviços</h3>
        </div>
        <div className="divide-y divide-border">
          {topServices.map((s, i) => (
            <div key={s.name} className="px-4 py-3 flex items-center gap-3">
              <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{i + 1}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.count} atendimentos</p>
              </div>
              <span className="text-sm font-semibold text-primary">{s.revenue}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

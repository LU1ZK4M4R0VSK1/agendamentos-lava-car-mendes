import { services } from '@/data/services';

const mockAppointments = [
  { id: 1, client: 'João Silva', service: 'Lavagem Completa', status: 'em_andamento' as const, plate: 'ABC-1234' },
  { id: 2, client: 'Maria Santos', service: 'Lavagem com Cera', status: 'agendado' as const, plate: 'DEF-5678' },
  { id: 3, client: 'Pedro Costa', service: 'Higienização', status: 'concluido' as const, plate: 'GHI-9012' },
];

const statusStyles = {
  agendado: 'bg-secondary text-muted-foreground',
  em_andamento: 'bg-primary/15 text-primary',
  concluido: 'bg-emerald-500/15 text-emerald-400',
};

const statusLabels = {
  agendado: 'Agendado',
  em_andamento: 'Em Andamento',
  concluido: 'Finalizado',
};

export default function AdminServicos() {
  return (
    <div className="space-y-6 animate-fade-up">
      <h2 className="text-lg font-bold text-foreground">Serviços</h2>

      <div className="bg-card border border-border rounded-2xl">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Atendimentos Hoje</h3>
        </div>
        <div className="divide-y divide-border">
          {mockAppointments.map((a) => (
            <div key={a.id} className="px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{a.client}</p>
                <p className="text-xs text-muted-foreground">{a.service} · {a.plate}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${statusStyles[a.status]}`}>
                {statusLabels[a.status]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Catálogo</h3>
        </div>
        <div className="divide-y divide-border">
          {services.map((s) => (
            <div key={s.id} className="px-4 py-3 flex items-center gap-3">
              <span className="text-xl">{s.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.durationMinutes}min</p>
              </div>
              <span className="text-sm font-semibold text-primary">R$ {s.basePrice}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

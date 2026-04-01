import { Clock, Wrench } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AdminConfiguracoes() {
  return (
    <div className="space-y-6 animate-fade-up">
      <h2 className="text-lg font-bold text-foreground">Configurações</h2>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Horário de Funcionamento</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Abertura</label>
            <Input defaultValue="08:00" className="bg-secondary border-border rounded-xl h-11" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Fechamento</label>
            <Input defaultValue="18:00" className="bg-secondary border-border rounded-xl h-11" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Capacidade simultânea</label>
          <Input type="number" defaultValue="3" className="bg-secondary border-border rounded-xl h-11 w-24" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Serviços</h3>
        </div>
        <p className="text-xs text-muted-foreground">Edite preços, nomes e durações.</p>
        <Button variant="outline-primary" size="sm">Editar Serviços</Button>
      </div>

      <Button variant="hero" size="lg" className="w-full sm:w-auto">Salvar Configurações</Button>
    </div>
  );
}

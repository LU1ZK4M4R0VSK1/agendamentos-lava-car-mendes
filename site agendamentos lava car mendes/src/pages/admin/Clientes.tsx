import { Phone, Loader2, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { format, parseISO } from 'date-fns';

interface CustomerData {
  id: string;
  push_name: string;
  phone: string;
  total_appointments: string | number;
  last_visit: string | null;
}

export default function AdminClientes() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCustomers().then(setCustomers).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Clientes</h2>
        <span className="text-xs text-muted-foreground">{customers.length} clientes</span>
      </div>

      <div className="bg-card border border-border rounded-2xl divide-y divide-border">
        {customers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs italic">Nenhum cliente cadastrado</div>
        ) : customers.map((c) => (
          <div key={c.id} className="px-4 py-3 hover:bg-secondary/50 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{c.push_name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" /> {c.phone}
                </p>
                {c.last_visit && (
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase italic">
                    Última visita: {format(parseISO(c.last_visit), 'dd/MM/yyyy')}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-semibold text-primary">{c.total_appointments}</span>
                <p className="text-[10px] text-muted-foreground uppercase">serviços</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

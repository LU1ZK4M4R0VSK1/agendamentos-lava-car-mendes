const vehicles = [
  { plate: 'ABC-1234', model: 'Honda Civic 2022', type: 'Sedan', color: 'Preto', owner: 'João Silva' },
  { plate: 'DEF-5678', model: 'VW Gol 2020', type: 'Hatch', color: 'Prata', owner: 'Maria Santos' },
  { plate: 'GHI-9012', model: 'Toyota Hilux 2023', type: 'SUV', color: 'Branco', owner: 'Pedro Costa' },
  { plate: 'JKL-3456', model: 'Hyundai HB20 2021', type: 'Hatch', color: 'Vermelho', owner: 'Ana Oliveira' },
  { plate: 'MNO-7890', model: 'Jeep Compass 2024', type: 'SUV', color: 'Azul', owner: 'Carlos Mendes' },
];

export default function AdminFrota() {
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Frota</h2>
        <span className="text-xs text-muted-foreground">{vehicles.length} veículos</span>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {vehicles.map((v) => (
          <div key={v.plate} className="bg-card border border-border rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-sm font-mono font-semibold text-primary">{v.plate}</span>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-lg">{v.type}</span>
            </div>
            <p className="text-sm text-foreground">{v.model}</p>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{v.color}</span>
              <span>{v.owner}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 text-xs font-medium text-muted-foreground">Placa</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground">Modelo</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground">Tipo</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground">Cor</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground">Proprietário</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {vehicles.map((v) => (
              <tr key={v.plate} className="hover:bg-secondary/50 transition-colors">
                <td className="p-4 text-sm font-mono text-primary">{v.plate}</td>
                <td className="p-4 text-sm text-foreground">{v.model}</td>
                <td className="p-4 text-sm text-muted-foreground">{v.type}</td>
                <td className="p-4 text-sm text-muted-foreground">{v.color}</td>
                <td className="p-4 text-sm text-foreground">{v.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

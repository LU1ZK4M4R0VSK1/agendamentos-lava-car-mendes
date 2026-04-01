import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Wrench, DollarSign, Users, Car, Settings, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import logoImg from '@/assets/logo.png';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/agenda', icon: CalendarDays, label: 'Agenda' },
  { to: '/admin/servicos', icon: Wrench, label: 'Serviços' },
  { to: '/admin/financeiro', icon: DollarSign, label: 'Financeiro' },
  { to: '/admin/clientes', icon: Users, label: 'Clientes' },
  { to: '/admin/frota', icon: Car, label: 'Frota' },
  { to: '/admin/configuracoes', icon: Settings, label: 'Config' },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {open && <div className="fixed inset-0 bg-background/80 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-60 bg-card border-r border-border flex flex-col transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="h-14 px-4 flex items-center gap-3 border-b border-border">
          <img src={logoImg} alt="LCM" className="w-7 h-7" width={512} height={512} />
          <span className="text-sm font-bold text-foreground">Admin</span>
          <button className="ml-auto lg:hidden text-muted-foreground" onClick={() => setOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center px-4 gap-3">
          <button className="lg:hidden text-muted-foreground" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-foreground">Lava Car Mendes</span>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

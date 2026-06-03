import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const items = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/productos', label: 'Productos', icon: '📦' },
  { to: '/admin/proyectos', label: 'Proyectos', icon: '🏢' },
  { to: '/admin/miembros', label: 'Miembros', icon: '👥' },
  { to: '/admin/comisiones', label: 'Comisiones', icon: '💲' },
  { to: '/admin/compras', label: 'Compras', icon: '🛒' },
  { to: '/admin/reportes', label: 'Reportes', icon: '📄' },
];

export function AdminSidebar() {
  const { isSuperadmin } = useAdminAuth();

  return (
    <aside className="hidden w-60 flex-none flex-col bg-primary px-3 py-5 md:flex">
      <div className="px-3 pb-6">
        <span className="font-serif text-xl font-bold text-white">
          Grupo<span className="text-secondary"> 3i</span>
        </span>
        <p className="mt-0.5 text-[10px] uppercase tracking-widest text-white/50">Admin</p>
      </div>
      <nav className="space-y-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-secondary text-primary' : 'text-white/80 hover:bg-white/10',
              )
            }
          >
            <span>{it.icon}</span>
            {it.label}
          </NavLink>
        ))}
        {isSuperadmin && (
          <NavLink
            to="/admin/configuracion"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-secondary text-primary' : 'text-white/80 hover:bg-white/10',
              )
            }
          >
            <span>⚙️</span>
            Configuración
          </NavLink>
        )}
      </nav>
    </aside>
  );
}

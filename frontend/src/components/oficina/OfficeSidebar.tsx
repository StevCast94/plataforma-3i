import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const items = [
  { to: '/oficina/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/oficina/mi-red', label: 'Mi Red', icon: '👥' },
  { to: '/oficina/comisiones', label: 'Comisiones', icon: '💲' },
  { to: '/oficina/pagos', label: 'Pagos', icon: '👛' },
  { to: '/oficina/viajes', label: 'Mis Viajes', icon: '🧳' },
  { to: '/oficina/herramientas', label: 'Herramientas', icon: '🔗' },
  { to: '/oficina/calculadora', label: 'Calculadora', icon: '🧮' },
];

const linkClass = (isActive: boolean) =>
  cn(
    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
    isActive ? 'bg-secondary text-primary' : 'text-white/80 hover:bg-white/10',
  );

/** Sidebar de escritorio. */
export function OfficeSidebar() {
  return (
    <aside className="hidden w-64 flex-none flex-col bg-primary px-4 py-6 md:flex">
      <div className="px-2 pb-6">
        <img src="/images/logotipo-light.svg" alt="Grupo 3i" className="mb-2 h-7 w-auto" />
        <p className="text-xs uppercase tracking-widest text-white/50">
          Oficina Virtual
        </p>
      </div>
      <nav className="space-y-1">
        {items.map((it) => (
          <NavLink key={it.to} to={it.to} className={({ isActive }) => linkClass(isActive)}>
            <span>{it.icon}</span>
            {it.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

/** Navegación inferior para mobile. */
export function OfficeBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-black/5 bg-white py-2 md:hidden">
      {items.slice(0, 5).map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium',
              isActive ? 'text-secondary' : 'text-brand-gray',
            )
          }
        >
          <span className="text-lg">{it.icon}</span>
          {it.label}
        </NavLink>
      ))}
    </nav>
  );
}

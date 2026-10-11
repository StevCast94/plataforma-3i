import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { navFor } from '@/lib/adminNav';

/** ¿Hay un evento en vivo? (muestra «Evento en vivo» solo mientras dura) */
function useEventActive() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    api
      .get<{ active: boolean }>('/events/current')
      .then((e) => setActive(!!e.active))
      .catch(() => {});
  }, []);
  return active;
}

/** Menú agrupado; lo usan la barra lateral (escritorio) y el cajón del celular. */
export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const { staff } = useAdminAuth();
  const eventActive = useEventActive();
  const groups = navFor(staff?.role, { eventActive });

  return (
    <nav className="space-y-5">
      {groups.map((g) => (
        <div key={g.title}>
          {groups.length > 1 && <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">{g.title}</p>}
          <div className="space-y-0.5">
            {g.items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-secondary text-primary' : 'text-white/80 hover:bg-white/10',
                  )
                }
              >
                <span className="w-5 text-center">{it.icon}</span>
                {it.label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AdminBrand() {
  return (
    <div className="px-3 pb-6">
      <Link to="/" className="font-serif text-xl font-bold text-white">
        Grupo<span className="text-secondary"> 3i</span>
      </Link>
      <p className="mt-0.5 text-[10px] uppercase tracking-widest text-white/50">Admin</p>
    </div>
  );
}

export function AdminSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 flex-none flex-col overflow-y-auto bg-primary px-3 py-5 md:flex">
      <AdminBrand />
      <AdminNav />
    </aside>
  );
}

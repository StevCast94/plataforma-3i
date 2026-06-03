import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const tabs = [
  { to: '/comunidad', label: 'Feed', end: true },
  { to: '/comunidad/grupos', label: 'Grupos' },
  { to: '/comunidad/eventos', label: 'Eventos' },
  { to: '/comunidad/miembros', label: 'Miembros' },
];

export function CommunitySubNav() {
  const { isAuthenticated } = useAuth();
  const all = isAuthenticated ? [...tabs, { to: '/comunidad/mensajes', label: 'Mensajes' }] : tabs;

  return (
    <div className="sticky top-[73px] z-30 border-b border-black/5 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6">
        {all.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              cn(
                'whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                isActive ? 'border-secondary text-primary' : 'border-transparent text-brand-gray hover:text-primary',
              )
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { useGroups, useEvents } from '@/hooks/useGroups';

/** Sidebar derecho: grupos sugeridos + eventos próximos. */
export function CommunitySidebar() {
  const { data: groups } = useGroups();
  const { data: events } = useEvents();
  const upcoming = (events ?? []).filter((e) => e.phase !== 'past').slice(0, 3);

  return (
    <aside className="hidden w-72 flex-none space-y-5 lg:block">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h3 className="mb-3 text-sm font-semibold text-primary">Grupos sugeridos</h3>
        <ul className="space-y-2">
          {(groups ?? []).slice(0, 4).map((g) => (
            <li key={g.id}>
              <Link to={`/comunidad/grupos/${g.slug}`} className="flex items-center justify-between text-sm hover:text-accent">
                <span className="text-primary">{g.name}</span>
                <span className="text-xs text-brand-gray">{g.memberCount}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h3 className="mb-3 text-sm font-semibold text-primary">Próximos eventos</h3>
        {upcoming.length === 0 && <p className="text-sm text-brand-gray">Sin eventos próximos.</p>}
        <ul className="space-y-3">
          {upcoming.map((e) => (
            <li key={e.id}>
              <Link to={`/comunidad/eventos/${e.id}`} className="block hover:text-accent">
                <p className="text-sm font-medium text-primary">{e.title}</p>
                <p className="text-xs text-brand-gray">
                  {new Date(e.startDate).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useProjects } from '@/hooks/useProjects';
import { Isotipo } from '@/components/brand/Isotipo';

const links = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/proyectos', label: 'Proyectos', hasDropdown: true },
  { to: '/tienda', label: 'Tienda' },
  { to: '/club', label: 'Club 3i' },
  { to: '/comunidad', label: 'Comunidad' },
  { to: '/sobre-nosotros', label: 'Nosotros' },
  { to: '/oficina', label: 'Oficina' },
  { to: '/contacto', label: 'Contacto' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { data: projects } = useProjects();

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur print:hidden">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          {/* Móvil: isotipo con más presencia + logotipo aparte (en vez del
              logo completo, que se encoge hasta ser ilegible en pantallas chicas). */}
          <Isotipo title="Grupo 3i" className="h-9 w-auto sm:hidden" />
          <img
            src="/images/logotipo.svg"
            alt="Grupo 3i"
            className="h-5 w-auto sm:hidden"
          />
          <img
            src="/images/logo-completo.svg"
            alt="Grupo 3i"
            className="hidden h-10 w-auto sm:block"
          />
        </Link>

        {/* Desktop */}
        <ul className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <li key={l.to} className="group relative">
              <NavLink
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1 text-sm font-medium transition-colors hover:text-secondary',
                    isActive ? 'text-secondary' : 'text-primary',
                  )
                }
              >
                {l.label}
                {l.hasDropdown && <span className="text-xs">▾</span>}
              </NavLink>

              {/* Dropdown de proyectos */}
              {l.hasDropdown && (projects?.length ?? 0) > 0 && (
                <div className="invisible absolute left-0 top-full pt-3 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                  <div className="w-64 overflow-hidden rounded-xl bg-white py-2 shadow-xl ring-1 ring-black/5">
                    {projects!.map((p) => (
                      <Link
                        key={p.id}
                        to={`/proyectos/${p.slug}`}
                        className="block px-4 py-2.5 text-sm text-primary hover:bg-light"
                      >
                        <span className="font-medium">{p.name}</span>
                        {p.location && (
                          <span className="block text-xs text-brand-gray">
                            {p.location}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>

        {/* Mobile toggle */}
        <button
          className="cursor-pointer p-2 md:hidden"
          aria-label="Menú"
          onClick={() => setOpen((v) => !v)}
        >
          <div className="space-y-1.5">
            <span className="block h-0.5 w-6 bg-primary" />
            <span className="block h-0.5 w-6 bg-primary" />
            <span className="block h-0.5 w-6 bg-primary" />
          </div>
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <ul className="space-y-1 border-t border-black/5 bg-white px-4 py-3 md:hidden">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'block rounded-lg px-3 py-2 text-sm font-medium',
                    isActive ? 'bg-light text-secondary' : 'text-primary',
                  )
                }
              >
                {l.label}
              </NavLink>
              {/* Sub-lista de proyectos en mobile */}
              {l.hasDropdown &&
                (projects ?? []).map((p) => (
                  <Link
                    key={p.id}
                    to={`/proyectos/${p.slug}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-6 py-1.5 text-sm text-brand-gray hover:text-secondary"
                  >
                    {p.name}
                  </Link>
                ))}
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}

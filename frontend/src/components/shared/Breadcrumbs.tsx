import { Link } from 'react-router-dom';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-2 text-white/70">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={c.label} className="flex items-center gap-2">
              {c.to && !last ? (
                <Link to={c.to} className="hover:text-secondary">
                  {c.label}
                </Link>
              ) : (
                <span className={last ? 'text-white' : ''}>{c.label}</span>
              )}
              {!last && <span className="text-white/40">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

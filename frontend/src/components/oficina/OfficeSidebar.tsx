import { Link, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Wallet,
  Luggage,
  Link2,
  Calculator,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// "Herramientas" (enlace de referido + contenido para compartir) es el eje
// principal de la oficina: es literalmente cómo un socio gana dinero. Vive
// aparte del resto de la navegación para poder resaltarlo, y NUNCA se corta
// del bottom-nav móvil (antes quedaba en la posición 7 de 8 y el slice(0,5)
// lo dejaba inalcanzable desde el celular).
const primary = { to: '/oficina/herramientas', label: 'Mi enlace y comisiones', icon: Link2 };

const items: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/oficina/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/oficina/mi-red', label: 'Mi Red', icon: Users },
  { to: '/oficina/comisiones', label: 'Comisiones', icon: DollarSign },
  { to: '/oficina/pagos', label: 'Pagos', icon: Wallet },
  { to: '/oficina/viajes', label: 'Mis Viajes', icon: Luggage },
  { to: '/oficina/calculadora', label: 'Calculadora', icon: Calculator },
  { to: '/tienda', label: 'Tienda 3i', icon: ShoppingBag },
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
        <Link to="/" className="inline-block">
          <img src="/images/logotipo-light.svg" alt="Grupo 3i — Volver al inicio" className="mb-2 h-7 w-auto" />
        </Link>
        <p className="text-xs uppercase tracking-widest text-white/50">
          Oficina Virtual
        </p>
      </div>

      {/* Acción principal, destacada aparte del resto */}
      <NavLink
        to={primary.to}
        className={({ isActive }) =>
          cn(
            'mb-4 flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold shadow-sm ring-1 transition-colors',
            isActive
              ? 'bg-secondary text-primary ring-secondary'
              : 'bg-secondary/15 text-secondary ring-secondary/40 hover:bg-secondary/25',
          )
        }
      >
        <primary.icon className="h-5 w-5" strokeWidth={2} />
        {primary.label}
      </NavLink>

      <nav className="space-y-1">
        {items.map((it) => (
          <NavLink key={it.to} to={it.to} className={({ isActive }) => linkClass(isActive)}>
            <it.icon className="h-4 w-4" strokeWidth={1.8} />
            {it.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

/**
 * Navegación inferior para mobile. "Herramientas" va como botón central
 * elevado (patrón de "acción principal" común en apps) en vez de competir
 * por espacio como un ícono más — así siempre es visible y siempre cabe,
 * sin importar cuántas otras secciones se agreguen a futuro.
 */
export function OfficeBottomNav() {
  const left = items.slice(0, 2); // Dashboard, Mi Red
  const right = items.slice(2, 4); // Comisiones, Pagos

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-black/5 bg-white pb-[env(safe-area-inset-bottom)] pt-1.5 md:hidden">
      {left.map((it) => (
        <BottomTab key={it.to} item={it} />
      ))}

      <NavLink to={primary.to} className="flex flex-col items-center gap-0.5">
        {({ isActive }) => (
          <>
            <span
              className={cn(
                '-mt-6 flex h-14 w-14 items-center justify-center rounded-full shadow-lg ring-4 ring-white transition-colors',
                isActive ? 'bg-accent text-white' : 'bg-secondary text-primary',
              )}
            >
              <primary.icon className="h-6 w-6" strokeWidth={2.2} />
            </span>
            <span className="text-[10px] font-semibold text-primary">Mi enlace</span>
          </>
        )}
      </NavLink>

      {right.map((it) => (
        <BottomTab key={it.to} item={it} />
      ))}
    </nav>
  );
}

function BottomTab({ item }: { item: { to: string; label: string; icon: LucideIcon } }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium',
          isActive ? 'text-secondary' : 'text-brand-gray',
        )
      }
    >
      <item.icon className="h-5 w-5" strokeWidth={1.8} />
      {item.label}
    </NavLink>
  );
}

// Menú del admin agrupado por negocio. `roles` = quién lo ve; sin `roles`, solo
// superadmin y admin. Los permisos reales los aplica el servidor (middleware/auth.ts);
// esto solo evita mostrar lo que el usuario no puede abrir.

export type StaffRole = 'superadmin' | 'admin' | 'advisor' | 'content' | 'bosque';

export interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  roles?: StaffRole[];
  /** Solo se muestra si se cumple (p. ej. evento activo). */
  when?: 'eventActive';
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

const MANAGERS: StaffRole[] = ['superadmin', 'admin'];

export const ADMIN_NAV: NavGroup[] = [
  {
    title: 'Inicio',
    items: [{ to: '/admin', label: 'Resumen', icon: '📊', end: true }],
  },
  {
    title: 'Ventas inmobiliarias',
    items: [
      { to: '/admin/crm', label: 'CRM de ventas', icon: '🗂️', roles: [...MANAGERS, 'advisor'] },
      { to: '/admin/compras', label: 'Ventas propias', icon: '🧾' },
      { to: '/admin/proyectos', label: 'Proyectos', icon: '🏢', roles: [...MANAGERS, 'content', 'advisor'] },
      { to: '/admin/productos', label: 'Productos y precios', icon: '📦', roles: [...MANAGERS, 'content'] },
    ],
  },
  {
    title: 'Desarrolladoras',
    items: [
      { to: '/admin/desarrolladores', label: 'Desarrolladoras', icon: '🤝' },
      { to: '/admin/ventas-terceros', label: 'Ventas de terceros', icon: '💼' },
    ],
  },
  {
    title: 'Servicios integrales',
    items: [{ to: '/admin/servicios', label: 'Solicitudes y trámites', icon: '📐', roles: [...MANAGERS, 'advisor'] }],
  },
  {
    title: 'Refiere y gana',
    items: [
      { to: '/admin/miembros', label: 'Miembros', icon: '👥' },
      { to: '/admin/comisiones', label: 'Comisiones', icon: '💲' },
      { to: '/admin/retiros', label: 'Retiros', icon: '💸' },
      { to: '/admin/marketing', label: 'Embudo de referidos', icon: '📈' },
      { to: '/admin/soporte', label: 'Soporte', icon: '🆘' },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { to: '/admin/campanas', label: 'Campañas y medición', icon: '🎯' },
      { to: '/admin/fiesta', label: 'Evento en vivo', icon: '🍹', when: 'eventActive' },
    ],
  },
  {
    title: 'Bosque',
    items: [{ to: '/admin/bosque', label: 'Adopta un árbol', icon: '🌳', roles: [...MANAGERS, 'bosque'] }],
  },
  {
    title: 'Equipo y sistema',
    items: [
      { to: '/admin/equipo', label: 'Equipo', icon: '🧑‍💼', roles: ['superadmin'] },
      { to: '/admin/configuracion', label: 'Contenido del sitio', icon: '⚙️', roles: ['superadmin', 'content'] },
      { to: '/admin/reportes', label: 'Reportes y auditoría', icon: '📄' },
    ],
  },
];

export const ROLE_LABEL: Record<StaffRole, string> = {
  superadmin: 'Superadmin',
  admin: 'Administrador',
  advisor: 'Asesor de ventas',
  content: 'Contenido',
  bosque: 'Gestora del Bosque',
};

export const canSee = (item: NavItem, role: string | undefined) =>
  !!role && (item.roles ?? MANAGERS).includes(role as StaffRole);

/** Grupos visibles para un rol (sin grupos vacíos). */
export function navFor(role: string | undefined, flags: { eventActive?: boolean } = {}) {
  return ADMIN_NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => canSee(i, role) && (!i.when || flags[i.when])),
  })).filter((g) => g.items.length);
}

/** ¿Puede este rol abrir esta ruta? (rutas hijas heredan del ítem padre) */
export function canOpen(pathname: string, role: string | undefined) {
  const items = ADMIN_NAV.flatMap((g) => g.items);
  const match = items
    .filter((i) => pathname === i.to || (i.to !== '/admin' && pathname.startsWith(i.to + '/')))
    .sort((a, b) => b.to.length - a.to.length)[0];
  if (!match) return role === 'superadmin' || role === 'admin';
  return canSee(match, role);
}

/** Primera página que puede ver un rol (destino tras iniciar sesión o sin permiso). */
export function homeFor(role: string | undefined) {
  return navFor(role)[0]?.items[0]?.to ?? '/admin';
}

export function titleFor(pathname: string) {
  const items = ADMIN_NAV.flatMap((g) => g.items.map((i) => ({ ...i, group: g.title })));
  const m = items.filter((i) => pathname === i.to || (i.to !== '/admin' && pathname.startsWith(i.to + '/'))).sort((a, b) => b.to.length - a.to.length)[0];
  return { title: m?.label ?? 'Admin', group: m?.group ?? 'Admin' };
}

// Helpers compartidos del frontend.

/** Une clases condicionalmente (mini clsx). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Tiempo relativo en español ("hace 2h", "hace 3d"). */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'ahora';
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d}d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `hace ${w}sem`;
  return new Date(iso).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
}

/** Iniciales de un nombre (máx 2). */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** Formatea un número como precio en USD. */
export function formatCurrency(
  amount: number,
  opts: { withCents?: boolean } = {},
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: opts.withCents ? 2 : 0,
    maximumFractionDigits: opts.withCents ? 2 : 0,
  }).format(amount);
}

/**
 * Optimiza una URL de Cloudinary inyectando transformaciones q_auto:best,f_auto.
 * Si no es una URL de Cloudinary, la devuelve sin cambios.
 */
export function cloudinaryOptimize(url?: string | null): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }
  if (url.includes('/upload/q_auto')) return url;
  return url.replace('/upload/', '/upload/q_auto:best,f_auto/');
}

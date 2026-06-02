// Helpers compartidos del frontend.

/** Une clases condicionalmente (mini clsx). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
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

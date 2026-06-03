// Helper para construir y optimizar URLs de Cloudinary.
// Cloud name del proyecto Grupo 3i.
export const CLOUDINARY_CLOUD = 'db3t73yas';
// Folder dentro de Cloudinary donde se guardan las imágenes de la plataforma.
export const CLD_FOLDER = 'plataforma-3i';
const BASE = `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload`;

interface CldOptions {
  /** ancho objetivo (w_) */
  width?: number;
  /** alto objetivo (h_) */
  height?: number;
  /** modo de recorte (c_), por defecto fill */
  crop?: 'fill' | 'fit' | 'scale' | 'limit';
}

/** Construye las transformaciones base + opcionales. */
function transform(opts: CldOptions = {}): string {
  const parts = ['q_auto:best', 'f_auto'];
  if (opts.width) parts.push(`w_${opts.width}`);
  if (opts.height) parts.push(`h_${opts.height}`);
  if (opts.width || opts.height) parts.push(`c_${opts.crop ?? 'fill'}`);
  return parts.join(',');
}

/**
 * Devuelve una URL lista para usar.
 * - Si recibe un public_id (sin http) → arma la URL completa de Cloudinary.
 * - Si recibe una URL de Cloudinary → inyecta/normaliza las transformaciones.
 * - Si recibe cualquier otra URL (Unsplash, etc.) → la devuelve sin tocar.
 */
export function cld(idOrUrl?: string | null, opts: CldOptions = {}): string {
  if (!idOrUrl) return '';
  const t = transform(opts);

  // public_id (no es una URL)
  if (!/^https?:\/\//i.test(idOrUrl)) {
    const id = idOrUrl.replace(/^\/+/, '');
    return `${BASE}/${t}/${id}`;
  }

  // URL de Cloudinary → reescribir el segmento de transformación
  if (idOrUrl.includes('res.cloudinary.com') && idOrUrl.includes('/upload/')) {
    const [head, tail] = idOrUrl.split('/upload/');
    // quitar transformaciones previas (primer segmento si parece transformación)
    const segments = tail.split('/');
    const rest =
      segments[0] && /[a-z]_/.test(segments[0])
        ? segments.slice(1).join('/')
        : tail;
    return `${head}/upload/${t}/${rest}`;
  }

  // Otra URL externa: sin cambios
  return idOrUrl;
}

/** Genera un thumbnail pequeño y borroso para usar como placeholder (LQIP). */
export function cldBlur(idOrUrl?: string | null): string {
  if (!idOrUrl) return '';
  if (!/^https?:\/\//i.test(idOrUrl)) {
    return `${BASE}/w_40,e_blur:800,q_auto:low,f_auto/${idOrUrl.replace(/^\/+/, '')}`;
  }
  if (idOrUrl.includes('res.cloudinary.com') && idOrUrl.includes('/upload/')) {
    const [head, tail] = idOrUrl.split('/upload/');
    const segments = tail.split('/');
    const rest =
      segments[0] && /[a-z]_/.test(segments[0])
        ? segments.slice(1).join('/')
        : tail;
    return `${head}/upload/w_40,e_blur:800,q_auto:low,f_auto/${rest}`;
  }
  return idOrUrl;
}

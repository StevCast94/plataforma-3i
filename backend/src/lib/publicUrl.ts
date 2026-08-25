/**
 * Dominio público del sitio, en un solo lugar.
 *
 * Historia de por qué esto existe: el dominio original era el que Railway
 * asigna automáticamente. Al migrar a grupo3i.com quedaron enlaces con el
 * dominio viejo congelado en la BD y en la configuración — eso fue lo que rompió
 * los enlaces de referido que un socio reportó.
 *
 * PUBLIC_BASE_URL sigue apuntando al dominio de Railway en el entorno, así que
 * NO se puede confiar en ella tal cual: si su valor es un dominio de Railway se
 * ignora y se usa el canónico. Así el arreglo no depende de que alguien entre a
 * cambiar la variable de entorno, y sigue siendo posible apuntar a otro entorno
 * real (staging con dominio propio) fijando PUBLIC_BASE_URL a ese dominio.
 */
const CANONICAL_ORIGIN = 'https://grupo3i.com';

/** Dominios internos de la plataforma que nunca deben salir de cara al público. */
const INTERNAL_HOST = /\.up\.railway\.app$/i;

export function publicBaseUrl(): string {
  const raw = process.env.PUBLIC_BASE_URL?.trim().replace(/\/+$/, '');
  if (!raw) return CANONICAL_ORIGIN;
  try {
    if (INTERNAL_HOST.test(new URL(raw).hostname)) return CANONICAL_ORIGIN;
  } catch {
    return CANONICAL_ORIGIN; // Valor inválido: mejor el canónico que una URL rota.
  }
  return raw;
}

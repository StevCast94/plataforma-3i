// ============================================================
// Traducción del sitio público (español ↔ inglés).
//
// La clave de cada texto ES EL PROPIO TEXTO EN ESPAÑOL. Así el código sigue
// leyéndose en español, no hay que inventar nombres de clave, y si falta una
// traducción la página no se rompe: muestra el español. El inglés vive en
// `en.ts`, en un único diccionario plano.
//
//   t('Elige tu solar')                    → "Choose your lot"
//   t('{n} solares disponibles', { n: 89 }) → "89 lots available"
// ============================================================

import { EN } from './en';

export type Lang = 'es' | 'en';

export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: 'es', label: 'Español', short: 'ES' },
  { code: 'en', label: 'English', short: 'EN' },
];

/** Rellena {marcadores} con los valores dados. */
function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export function translate(lang: Lang, text: string, vars?: Record<string, string | number>): string {
  if (lang === 'es') return interpolate(text, vars);
  const en = EN[text];
  if (en === undefined && import.meta.env.DEV) {
    // Solo en desarrollo: deja rastro de lo que falta por traducir.
    console.warn('[i18n] sin traducción:', text);
  }
  return interpolate(en ?? text, vars);
}

/**
 * Secciones que existen en los dos idiomas. La oficina virtual, la comunidad y
 * el panel de administración son de uso interno y viven solo en español: sus
 * enlaces no se prefijan, para no mandar a nadie a una ruta que no existe.
 */
const TRANSLATED = ['/proyectos', '/propuesta', '/tienda', '/club', '/sobre-nosotros', '/contacto', '/reglamento'];

/** Del área de referidos solo la puerta de entrada está en inglés; el panel interno no. */
const TRANSLATED_EXACT = ['/oficina', '/oficina/login', '/oficina/registro'];

/** Prefijo de idioma de una ruta interna: '/proyectos' → '/en/proyectos'. */
export function localizePath(path: string, lang: Lang): string {
  if (lang === 'es') return path;
  if (path.startsWith('/en/') || path === '/en') return path;
  if (!path.startsWith('/')) return path; // anclas, mailto, enlaces externos…
  if (path === '/') return '/en';
  const base = path.split(/[?#]/)[0];
  const traducida = TRANSLATED_EXACT.includes(base) || TRANSLATED.some((p) => base === p || base.startsWith(`${p}/`));
  return traducida ? `/en${path}` : path;
}

/** Quita el prefijo /en de una ruta, para construir el enlace alterno. */
export function stripLang(path: string): string {
  if (path === '/en') return '/';
  return path.startsWith('/en/') ? path.slice(3) : path;
}

export function langFromPath(path: string): Lang {
  return path === '/en' || path.startsWith('/en/') ? 'en' : 'es';
}

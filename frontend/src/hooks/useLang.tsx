import { useEffect, useMemo } from 'react';
import {
  useLocation,
  Link as RouterLink,
  NavLink as RouterNavLink,
  type LinkProps,
  type NavLinkProps,
} from 'react-router-dom';
import { langFromPath, localizePath, stripLang, translate, type Lang } from '@/lib/i18n';

// ============================================================
// Idioma activo. Lo manda la URL: /proyectos es español, /en/proyectos inglés.
// Sin estado global ni cookies — el enlace que se comparte ya lleva el idioma,
// que es justo lo que se necesita para mandar la propuesta a un inversionista
// de fuera por WhatsApp.
// ============================================================

export function useLang() {
  const { pathname } = useLocation();
  const lang: Lang = langFromPath(pathname);

  // El atributo lang del documento: lectores de pantalla, traductores del
  // navegador y Google leen de aquí en qué idioma está la página.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return useMemo(
    () => ({
      lang,
      /** Traduce un texto escrito en español. */
      t: (text: string, vars?: Record<string, string | number>) => translate(lang, text, vars),
      /** Añade el prefijo de idioma a una ruta interna. */
      path: (p: string) => localizePath(p, lang),
      /** La misma página en el otro idioma. */
      alternate: (to: Lang) => localizePath(stripLang(pathname), to),
      /** Ruta sin prefijo, para comparaciones de "estoy en esta sección". */
      bare: stripLang(pathname),
    }),
    [lang, pathname],
  );
}

/** Igual que el Link de React Router, pero conserva el idioma de la URL. */
export function Link({ to, ...rest }: LinkProps) {
  const { path } = useLang();
  const href = typeof to === 'string' ? path(to) : to;
  return <RouterLink to={href} {...rest} />;
}

/** Igual que el NavLink de React Router, conservando el idioma. */
export function NavLink({ to, ...rest }: NavLinkProps) {
  const { path } = useLang();
  const href = typeof to === 'string' ? path(to) : to;
  return <RouterNavLink to={href} {...rest} />;
}

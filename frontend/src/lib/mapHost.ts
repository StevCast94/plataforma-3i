import { BOSQUE_HOSTS } from '@/lib/bosque';

// Dominios propios de los mapas de lotes (Fase 3): cualquier dominio que no sea
// de Grupo 3i, de Railway, local ni del Bosque sirve el mapa de un proyecto.
const MAIN_HOSTS = ['grupo3i.com', 'localhost', '127.0.0.1'];

export function isCustomMapHost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname.replace(/^www\./, '');
  return !MAIN_HOSTS.includes(h) && !h.endsWith('.railway.app') && !h.endsWith('.localhost') && !BOSQUE_HOSTS.includes(h);
}

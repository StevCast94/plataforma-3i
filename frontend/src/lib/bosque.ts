// Bosque ("adopta un árbol"): proyecto vinculado a Montañita View y a Grupo 3i.
// El nombre comercial está por definirse: se cambia aquí y en ningún otro lugar.

export const BOSQUE_NAME = 'Bosque Montañita';
export const BOSQUE_TAGLINE = 'Adopta un árbol en la costa de Santa Elena';

/**
 * Dominios propios del Bosque. Cuando se compre el dominio y se apunte a
 * Railway, se agrega aquí y la landing se sirve en la raíz de ese dominio.
 */
export const BOSQUE_HOSTS: string[] = [];

export function isBosqueHost(): boolean {
  return typeof window !== 'undefined' && BOSQUE_HOSTS.includes(window.location.hostname.replace(/^www\./, ''));
}

/** Prefijo de rutas: "" en el dominio propio, "/bosque" dentro de grupo3i.com. */
export function bosquePath(p = ''): string {
  const base = isBosqueHost() ? '' : '/bosque';
  return `${base}${p}` || '/';
}

/** URL absoluta (para el QR del certificado). */
export function bosqueUrl(p = ''): string {
  return `${window.location.origin}${bosquePath(p)}`;
}

export type SpeciesCategory = 'NATIVE' | 'FRUIT' | 'MONUMENTAL';

export const CATEGORY_LABEL: Record<SpeciesCategory, string> = {
  NATIVE: 'Nativo',
  FRUIT: 'Frutal',
  MONUMENTAL: 'Monumental',
};

export interface TreeSpecies {
  id: string;
  slug: string;
  name: string;
  scientificName: string | null;
  category: SpeciesCategory;
  description: string;
  price: number;
  image: string | null;
  adopted: number;
}

export interface BosqueStats {
  adopted: number;
  planted: number;
  committed: number;
  goalPilot: number;
}

export interface MapTree {
  code: string;
  status: 'AVAILABLE' | 'RESERVED' | 'ADOPTED';
  speciesId?: string;
  zone?: string | null;
  lat: number;
  lng: number;
  planted: boolean;
  species: string;
  category: SpeciesCategory;
  padrino: string | null;
}

export interface TreeUpdateItem {
  id: string;
  title: string;
  body: string;
  photos: string[];
  createdAt: string;
}

export interface PublicTree {
  code: string;
  status: string;
  lat: number | null;
  lng: number | null;
  zone: string | null;
  plantedAt: string | null;
  photos: string[];
  species: { name: string; scientificName: string | null; category: SpeciesCategory; description: string; image: string | null };
  padrino: string | null;
  adoptedAt: string | null;
  updates: TreeUpdateItem[];
}

export interface PublicAdoption {
  code: string;
  status: 'pending' | 'confirmed';
  quantity: number;
  dedication: string;
  species: { name: string; scientificName: string | null; category: SpeciesCategory } | null;
  source: 'web' | 'solar' | 'cortesia';
  lotCode: string | null;
  confirmedAt: string | null;
  createdAt: string;
  trees: { code: string; species: string; planted: boolean }[];
}

const BASE = import.meta.env.VITE_API_URL ?? '';

export async function bosqueGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/api/bosque${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Error ${res.status}`);
  }
  return res.json();
}

export async function bosquePost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}/api/bosque${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? `Error ${res.status}`);
  return data as T;
}

export function money(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function fechaLarga(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });
}

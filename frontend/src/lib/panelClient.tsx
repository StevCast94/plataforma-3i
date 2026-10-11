import { createContext, useContext } from 'react';
import { adminApi } from '@/lib/adminApi';
import { devApi } from '@/lib/developerApi';

// Cliente de las pantallas de lotes y vistas 360°. Por defecto es el admin; el
// portal de desarrolladores provee uno que llama a /api/developer (mismas rutas
// sin el prefijo /admin) y que el backend limita a sus propios proyectos.

export interface PanelClient {
  get: <T>(path: string) => Promise<T>;
  post: <T>(path: string, body?: unknown) => Promise<T>;
  put: <T>(path: string, body?: unknown) => Promise<T>;
  patch: <T>(path: string, body?: unknown) => Promise<T>;
  del: <T>(path: string) => Promise<T>;
  /** A dónde vuelve el enlace "← Proyectos". */
  backTo: string;
}

export const adminClient: PanelClient = {
  get: adminApi.get,
  post: adminApi.post,
  put: adminApi.put,
  patch: adminApi.patch,
  del: adminApi.del,
  backTo: '/admin/proyectos',
};

const strip = (p: string) => p.replace(/^\/admin(?=\/)/, '');

export const developerClient: PanelClient = {
  get: (p) => devApi.get(strip(p)),
  post: (p, b) => devApi.post(strip(p), b),
  put: (p, b) => devApi.put(strip(p), b),
  patch: (p, b) => devApi.patch(strip(p), b),
  del: (p) => devApi.del(strip(p)),
  backTo: '/desarrollador',
};

export const PanelClientContext = createContext<PanelClient>(adminClient);
export const usePanelClient = () => useContext(PanelClientContext);

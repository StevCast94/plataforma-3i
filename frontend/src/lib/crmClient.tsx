import { createContext, useContext } from 'react';
import { adminApi } from '@/lib/adminApi';
import { devApi } from '@/lib/developerApi';

// Cliente del CRM. Las pantallas son las mismas en el portal de desarrolladores
// (/api/developer/...) y en el admin de Grupo 3i (/api/admin/crm/..., proyectos propios).

export interface CrmClient {
  get: <T>(path: string) => Promise<T>;
  post: <T>(path: string, body?: unknown) => Promise<T>;
  patch: <T>(path: string, body?: unknown) => Promise<T>;
  del: <T>(path: string) => Promise<T>;
}

export const developerCrmClient: CrmClient = {
  get: devApi.get,
  post: devApi.post,
  patch: devApi.patch,
  del: devApi.del,
};

const A = (p: string) => `/admin/crm${p}`;
export const adminCrmClient: CrmClient = {
  get: (p) => adminApi.get(A(p)),
  post: (p, b) => adminApi.post(A(p), b),
  patch: (p, b) => adminApi.patch(A(p), b),
  del: (p) => adminApi.del(A(p)),
};

export const CrmClientContext = createContext<CrmClient>(developerCrmClient);
export const useCrmClient = () => useContext(CrmClientContext);

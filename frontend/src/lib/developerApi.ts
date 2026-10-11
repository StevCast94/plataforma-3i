// Cliente API del portal de desarrolladores. SEPARADO del de staff y del de
// miembros: usa su propio token (g3i_dev_token).

const BASE = import.meta.env.VITE_API_URL ?? '';
const TOKEN_KEY = 'g3i_dev_token';

export function getDevToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setDevToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* almacenamiento bloqueado */
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getDevToken();
  const res = await fetch(`${BASE}/api/developer${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* sin JSON */
    }
    if (res.status === 401 && path !== '/login') setDevToken(null);
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

export const devApi = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};

export type PublishStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'PAUSED';

export const PUBLISH_LABEL: Record<PublishStatus, { text: string; cls: string }> = {
  DRAFT: { text: 'Borrador', cls: 'bg-gray-100 text-gray-700' },
  REVIEW: { text: 'En revisión', cls: 'bg-amber-100 text-amber-800' },
  PUBLISHED: { text: 'Publicado', cls: 'bg-green-100 text-green-800' },
  PAUSED: { text: 'Pausado', cls: 'bg-slate-200 text-slate-700' },
};

export interface DevProject {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string;
  location: string | null;
  coverImage: string | null;
  images: string[];
  priceFrom: number | null;
  priceLabel: string | null;
  mapLat: number | null;
  mapLng: number | null;
  publishStatus: PublishStatus;
  reviewNote: string | null;
  updatedAt: string;
  _count?: { lots: number; panoramas: number };
}

export interface DevMe {
  id: string;
  email: string;
  name: string | null;
  developer: {
    id: string;
    name: string;
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
    whatsapp: string | null;
    commissionRate: number;
    ownLeadRate: number;
    onboardingFee: number;
    onboardingPaid: boolean;
    featuredUntil: string | null;
  };
}

export type LeadStatus = 'NEW' | 'CONTACTED' | 'VISIT' | 'NEGOTIATION' | 'WON' | 'LOST';
export type LeadSource = 'REFERRAL' | 'PLATFORM' | 'DEVELOPER';

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  VISIT: 'Visita',
  NEGOTIATION: 'Negociación',
  WON: 'Venta',
  LOST: 'Perdido',
};

export const LEAD_SOURCE_LABEL: Record<LeadSource, { text: string; cls: string }> = {
  REFERRAL: { text: 'Referido', cls: 'bg-purple-100 text-purple-800' },
  PLATFORM: { text: 'Plataforma', cls: 'bg-sky-100 text-sky-800' },
  DEVELOPER: { text: 'Propio', cls: 'bg-gray-100 text-gray-700' },
};

export interface DevLead {
  id: string;
  projectId: string;
  lotCode: string | null;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  source: LeadSource;
  channel: string;
  status: LeadStatus;
  notes: string | null;
  createdAt: string;
  project: { name: string };
}

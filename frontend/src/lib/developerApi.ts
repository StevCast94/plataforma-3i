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
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
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
  textEn: { subtitle?: string; description?: string; priceLabel?: string } | null;
  mapLat: number | null;
  mapLng: number | null;
  publishStatus: PublishStatus;
  reviewNote: string | null;
  updatedAt: string;
  _count?: { lots: number; panoramas: number };
  embedEnabled?: boolean;
  mapPaidUntil?: string | null;
  customDomain?: string | null;
  embedBrand?: { logo?: string | null; color?: string | null; name?: string | null; whatsapp?: string | null } | null;
}

export interface DevMe {
  id: string;
  email: string;
  name: string | null;
  role: 'OWNER' | 'SELLER';
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

export type SaleStatus = 'DECLARED' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';

export const SALE_STATUS_LABEL: Record<SaleStatus, { text: string; cls: string }> = {
  DECLARED: { text: 'Por confirmar', cls: 'bg-amber-100 text-amber-800' },
  CONFIRMED: { text: 'Confirmada', cls: 'bg-green-100 text-green-800' },
  REJECTED: { text: 'Devuelta', cls: 'bg-red-100 text-red-700' },
  CANCELLED: { text: 'Desistida', cls: 'bg-slate-200 text-slate-700' },
};

export interface SaleInstallment {
  id: string;
  amount: number;
  feeAmount: number;
  paidAt: string;
  receiptUrl: string | null;
  collectedAt: string | null;
  voided: boolean;
}

export interface DevSale {
  id: string;
  lotCode: string | null;
  price: number;
  paymentType: 'CASH' | 'FINANCED';
  feeRate: number;
  status: SaleStatus;
  reviewNote: string | null;
  createdAt: string;
  lead: { name: string; phone: string; source: LeadSource };
  project: { name: string };
  installments: SaleInstallment[];
  totals: { paid: number; feeTotal: number; feeCollected: number };
}

// ---------- CRM ----------
export type TaskType = 'CALL' | 'VISIT' | 'FOLLOW_UP' | 'OFFER' | 'OTHER';
export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  CALL: '📞 Llamar',
  VISIT: '📍 Visita',
  FOLLOW_UP: '🔁 Seguimiento',
  OFFER: '📄 Propuesta',
  OTHER: '✳️ Otra',
};
export const PIPELINE: LeadStatus[] = ['NEW', 'CONTACTED', 'VISIT', 'NEGOTIATION', 'WON', 'LOST'];

export interface CrmTask {
  id: string;
  type: TaskType;
  title: string;
  dueAt: string;
  doneAt?: string | null;
  auto?: boolean;
}

export interface BoardLead {
  id: string;
  projectId: string;
  lotCode: string | null;
  name: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  tags: string[];
  budget: number | null;
  createdAt: string;
  updatedAt: string;
  lastContactAt: string | null;
  project: { name: string };
  nextTask: CrmTask | null;
  assignedToId: string | null;
  assignedTo: { name: string | null; email: string } | null;
}

export interface LeadDetail extends Omit<BoardLead, 'nextTask' | 'updatedAt'> {
  email: string | null;
  message: string | null;
  channel: string;
  notes: string | null;
  lang: string | null;
  utm?: Record<string, string> | null;
  lostReason?: string | null;
  activities: { id: string; kind: string; body: string | null; actor: string; createdAt: string }[];
  tasks: CrmTask[];
  sales: { id: string; price: number; status: SaleStatus; lotCode: string | null }[];
}

export interface WaTemplate {
  id: string;
  name: string;
  body: string;
}

export interface AgendaTask extends CrmTask {
  lead: { id: string; name: string; phone: string; lotCode: string | null; status: LeadStatus; project: { name: string } };
}

/** Un contacto nuevo sin atender en 24 h (regla de la propuesta comercial). */
export const isStale = (l: { status: LeadStatus; createdAt: string; lastContactAt: string | null }) =>
  l.status === 'NEW' && !l.lastContactAt && Date.now() - new Date(l.createdAt).getTime() > 24 * 3600_000;

export interface TeamUser {
  id: string;
  email: string;
  name: string | null;
  role: 'OWNER' | 'SELLER';
  active: boolean;
  whatsapp: string | null;
  lastLoginAt: string | null;
  _count: { leads: number; pushSubs: number };
}

/** Motivos de pérdida sugeridos (se pueden escribir otros). */
export const LOST_REASONS = ['Precio', 'Financiamiento', 'Ubicación', 'No responde', 'Compró en otro lugar', 'Solo curiosidad'];

/** Pide el motivo al marcar un contacto como Perdido. null = canceló. */
export function askLostReason(): string | null {
  const r = window.prompt(`¿Por qué se perdió? (${LOST_REASONS.join(', ')})`, LOST_REASONS[0]);
  return r === null ? null : r.trim() || 'Sin motivo';
}

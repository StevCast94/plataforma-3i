// Tipos del módulo de servicios integrales (admin).

export interface Catalog {
  services: { id: string; name: string; template: string }[];
  templates: { id: string; name: string; steps: string[] }[];
}
export interface Staff {
  id: string;
  username: string;
  fullName: string | null;
}
export interface ServiceRequest {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  location: string | null;
  services: string[];
  message: string | null;
  lang: string;
  status: 'NEW' | 'CONTACTED' | 'QUOTED' | 'WON' | 'LOST';
  ownerId: string | null;
  notes: string | null;
  createdAt: string;
  quotes: { id: string; number: number; status: string; total: number }[];
  cases: { id: string; number: number; status: string }[];
}
export interface QuoteItem {
  serviceId?: string;
  description: string;
  qty: number;
  unit?: string;
  unitPrice: number;
}
export interface Quote {
  id: string;
  number: number;
  requestId: string | null;
  clientName: string;
  clientPhone: string | null;
  clientEmail: string | null;
  lang: string;
  title: string;
  items: QuoteItem[];
  taxRate: number;
  subtotal: number;
  total: number;
  milestones: { label: string; pct: number }[] | null;
  templateId: string | null;
  terms: string | null;
  validUntil: string | null;
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
  link: string;
  whatsapp: string | null;
  cases: { id: string; number: number }[];
}
export interface CaseRow {
  id: string;
  number: number;
  title: string;
  clientName: string;
  clientPhone: string | null;
  status: 'ACTIVE' | 'ON_HOLD' | 'DONE' | 'CANCELLED';
  ownerId: string | null;
  dueDate: string | null;
  createdAt: string;
  progress: { done: number; total: number };
  currentStep: string | null;
  overdue: boolean;
  billed: number;
  paid: number;
}
export interface CaseStep {
  id: string;
  order: number;
  title: string;
  description: string | null;
  party: 'team' | 'client' | 'institution';
  institution: string | null;
  requirements: string[];
  status: 'PENDING' | 'ACTIVE' | 'DONE' | 'SKIPPED';
  dueDate: string | null;
  startedAt: string | null;
  doneAt: string | null;
  notes: string | null;
}
export interface CaseDetail {
  id: string;
  number: number;
  token: string;
  templateId: string;
  title: string;
  clientName: string;
  clientPhone: string | null;
  clientEmail: string | null;
  lang: string;
  ownerId: string | null;
  status: CaseRow['status'];
  dueDate: string | null;
  createdAt: string;
  link: string;
  whatsapp: string | null;
  quote: { id: string; number: number; total: number } | null;
  steps: CaseStep[];
  documents: { id: string; name: string; uploadedBy: string; visible: boolean; stepId: string | null; createdAt: string }[];
  events: { id: string; kind: string; text: string; by: string | null; public: boolean; createdAt: string }[];
  payments: { id: string; label: string; amount: number; dueDate: string | null; paidAt: string | null; method: string | null; reference: string | null }[];
}

export const REQUEST_STATUS: Record<ServiceRequest['status'], string> = {
  NEW: 'Nueva',
  CONTACTED: 'Contactada',
  QUOTED: 'Con propuesta',
  WON: 'Ganada',
  LOST: 'Perdida',
};
export const QUOTE_STATUS: Record<Quote['status'], string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  VIEWED: 'Vista por el cliente',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Vencida',
};
export const CASE_STATUS: Record<CaseRow['status'], string> = {
  ACTIVE: 'En curso',
  ON_HOLD: 'En pausa',
  DONE: 'Terminado',
  CANCELLED: 'Cancelado',
};
export const PARTY: Record<CaseStep['party'], string> = { team: 'Equipo Grupo 3i', client: 'Cliente', institution: 'Institución' };
export const staffName = (list: Staff[] | null, id: string | null) => {
  const s = list?.find((x) => x.id === id);
  return s ? s.fullName || s.username : 'Sin asignar';
};
export const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

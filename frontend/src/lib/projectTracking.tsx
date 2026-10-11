import { createContext, useContext, useEffect } from 'react';
import { api } from '@/lib/api';

// Métricas y contactos por proyecto (vitrina de desarrolladores).
// Los eventos van con sendBeacon para no frenar la navegación ni romperse si falla.

const VISITOR_KEY = 'g3i_vid';
const BASE = import.meta.env.VITE_API_URL ?? '';

export function visitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

export type ProjectEventType = 'view' | 'lot_view' | 'pano_open' | 'wa_click' | 'share' | 'brochure';

export function trackProject(slug: string, type: ProjectEventType, lotCode?: string) {
  if (!slug) return;
  const body = JSON.stringify({ type, lotCode, visitorId: visitorId(), lang: document.documentElement.lang || undefined });
  const url = `${BASE}/api/projects/${encodeURIComponent(slug)}/events`;
  try {
    if (navigator.sendBeacon?.(url, new Blob([body], { type: 'application/json' }))) return;
  } catch {
    /* sigue con fetch */
  }
  fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true, credentials: 'include' }).catch(
    () => {},
  );
}

/** Registra una vista una vez por montaje. */
export function useTrackView(slug: string | undefined, type: 'view' | 'lot_view', lotCode?: string) {
  useEffect(() => {
    if (slug) trackProject(slug, type, lotCode);
  }, [slug, type, lotCode]);
}

export interface LeadResult {
  ok: boolean;
  leadId: string;
  whatsapp: string | null;
}

export function submitProjectLead(
  slug: string,
  data: { name: string; phone: string; email?: string; message?: string; lotCode?: string; channel: 'whatsapp' | 'form' },
) {
  return api.post<LeadResult>(`/projects/${encodeURIComponent(slug)}/leads`, {
    ...data,
    visitorId: visitorId(),
    lang: document.documentElement.lang || undefined,
  });
}

/**
 * Contexto del proyecto que se está viendo. Con `gated`, el botón de WhatsApp pide
 * nombre y número antes de abrir el chat del desarrollador (el contacto queda registrado).
 */
export interface ProjectLeadCtx {
  slug: string;
  gated: boolean;
  lotCode?: string;
}

export const ProjectLeadContext = createContext<ProjectLeadCtx | null>(null);
export const useProjectLead = () => useContext(ProjectLeadContext);

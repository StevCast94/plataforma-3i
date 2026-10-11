import type { LeadSource } from '@prisma/client';
import { prisma } from '../prisma';
import { resolveReferrer } from './referralTracking';
import { onNewLead } from './crm';

// Registro de contactos por proyecto. Regla de oro: el PRIMERO que registra un
// teléfono en un proyecto se queda con la atribución durante ATTRIBUTION_DAYS.
// Un contacto de la plataforma no se puede "re-registrar" como propio del desarrollador.

export const ATTRIBUTION_DAYS = 180;

export const phoneDigits = (phone: string) => phone.replace(/\D/g, '');

/** Contacto vigente (dentro de la ventana de atribución) para ese teléfono en el proyecto. */
export function findActiveLead(projectId: string, digits: string) {
  const since = new Date(Date.now() - ATTRIBUTION_DAYS * 86400_000);
  return prisma.projectLead.findFirst({
    where: { projectId, phoneDigits: digits, createdAt: { gte: since } },
    orderBy: { createdAt: 'asc' },
  });
}

/** Origen de campaña que manda el navegador (utm_*, gclid, fbclid, ttclid). Solo textos cortos conocidos. */
const UTM_KEYS = ['source', 'medium', 'campaign', 'term', 'content', 'gclid', 'fbclid', 'ttclid', 'landing'] as const;
export function cleanUtm(v: unknown): Record<string, string> | null {
  if (!v || typeof v !== 'object') return null;
  const out: Record<string, string> = {};
  for (const k of UTM_KEYS) {
    const x = (v as Record<string, unknown>)[k];
    if (typeof x === 'string' && x.trim()) out[k] = x.trim().slice(0, k === 'landing' ? 300 : 150);
  }
  return Object.keys(out).length ? out : null;
}

interface LeadInput {
  projectId: string;
  name: string;
  phone: string;
  email?: string | null;
  message?: string | null;
  lotCode?: string | null;
  channel: 'whatsapp' | 'form' | 'manual' | 'embed';
  referralCode?: string | null;
  visitorId?: string | null;
  lang?: string | null;
  utm?: Record<string, string> | null;
  /** Importación: sin aviso push ni tarea automática, con su fecha original. */
  silent?: boolean;
  createdAt?: Date;
  /** Solo DEVELOPER se fuerza; si no, se deduce del código de referido. */
  source?: LeadSource;
}

/**
 * Registra el contacto si no existe uno vigente. Devuelve `{ lead, created }`:
 * si ya existía, se devuelve el original intacto (no se pisa su origen).
 */
export async function registerLead(input: LeadInput) {
  const digits = phoneDigits(input.phone);
  const existing = await findActiveLead(input.projectId, digits);
  if (existing) return { lead: existing, created: false };

  let memberId: string | null = null;
  let source: LeadSource = input.source ?? 'PLATFORM';
  if (source !== 'DEVELOPER' && input.referralCode) {
    const ref = await resolveReferrer(input.referralCode);
    if (ref) {
      memberId = ref.id;
      source = 'REFERRAL';
    }
  }
  const lead = await prisma.projectLead.create({
    data: {
      projectId: input.projectId,
      name: input.name.trim().slice(0, 120),
      phone: input.phone.trim().slice(0, 40),
      phoneDigits: digits,
      email: input.email?.trim() || null,
      message: input.message?.trim() || null,
      lotCode: input.lotCode || null,
      channel: input.channel,
      referralCode: source === 'REFERRAL' ? input.referralCode : null,
      memberId,
      visitorId: input.visitorId || null,
      lang: input.lang || null,
      ...(input.utm ? { utm: input.utm } : {}),
      ...(input.createdAt ? { createdAt: input.createdAt } : {}),
      source,
    },
  });
  // CRM: historial y tarea «Contactar» (proyectos propios y de desarrolladores).
  await onNewLead(lead.id, source, { silent: input.silent }).catch((e) => console.error('onNewLead', e));
  return { lead, created: true };
}

/**
 * WhatsApp al que se abre el chat de un contacto: el del asesor asignado si lo
 * tiene; si no, el de la desarrolladora; si no, el oficial de Grupo 3i.
 */
export async function leadChatWhatsapp(leadId: string, projectId: string): Promise<string | null> {
  const l = await prisma.projectLead.findUnique({ where: { id: leadId }, select: { assignedTo: { select: { whatsapp: true, active: true } } } });
  if (l?.assignedTo?.active && l.assignedTo.whatsapp) return l.assignedTo.whatsapp;
  return leadWhatsapp(projectId);
}

/** WhatsApp al que se deriva el contacto: el del desarrollador o el oficial de Grupo 3i. */
export async function leadWhatsapp(projectId: string): Promise<string | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { developer: { select: { whatsapp: true } } },
  });
  if (project?.developer?.whatsapp) return project.developer.whatsapp;
  const row = await prisma.siteContent.findUnique({ where: { section_key: { section: 'contact', key: 'whatsapp' } } });
  return row?.value ?? null;
}

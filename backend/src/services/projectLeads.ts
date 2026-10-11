import type { LeadSource } from '@prisma/client';
import { prisma } from '../prisma';
import { resolveReferrer } from './referralTracking';

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

interface LeadInput {
  projectId: string;
  name: string;
  phone: string;
  email?: string | null;
  message?: string | null;
  lotCode?: string | null;
  channel: 'whatsapp' | 'form' | 'manual';
  referralCode?: string | null;
  visitorId?: string | null;
  lang?: string | null;
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
      source,
    },
  });
  return { lead, created: true };
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

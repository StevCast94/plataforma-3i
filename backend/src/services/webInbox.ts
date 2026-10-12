import { prisma } from '../prisma';
import { registerLead } from './projectLeads';

// Bandeja única: todo formulario de la web que sea de un proyecto entra al CRM
// como contacto de ese proyecto. Los que no tienen proyecto (o no dejaron
// WhatsApp) quedan en «Consultas web» dentro del CRM para pasarlos a mano.

/** Proyecto y lote al que pertenece un formulario según su `source`. */
export async function projectForSource(source: string | null | undefined): Promise<{ projectId: string; lotCode: string | null } | null> {
  if (!source) return null;
  // proyecto:slug · propuesta:slug · lote:Nombre del proyecto:CÓDIGO
  const m = /^(proyecto|propuesta):(.+)$/.exec(source);
  if (m) {
    const p = await prisma.project.findUnique({ where: { slug: m[2] }, select: { id: true } });
    return p ? { projectId: p.id, lotCode: null } : null;
  }
  const lot = /^lote:(.+):([^:]+)$/.exec(source);
  if (lot) {
    const p = await prisma.project.findFirst({ where: { name: lot[1] }, select: { id: true } });
    return p ? { projectId: p.id, lotCode: lot[2] } : null;
  }
  return null;
}

/**
 * Pasa un formulario al CRM (si tiene proyecto y WhatsApp). Idempotente: si ya
 * tiene contacto, no hace nada. `projectId` fuerza el proyecto (desde la bandeja).
 */
export async function contactToLead(
  submissionId: string,
  opts: { silent?: boolean; projectId?: string; utm?: Record<string, string> | null } = {},
): Promise<string | null> {
  const c = await prisma.contactSubmission.findUnique({ where: { id: submissionId } });
  if (!c || c.leadId || !c.phone || c.phone.replace(/\D/g, '').length < 8) return c?.leadId ?? null;
  const target = opts.projectId ? { projectId: opts.projectId, lotCode: null } : await projectForSource(c.source);
  if (!target) return null;
  const { lead } = await registerLead({
    projectId: target.projectId,
    name: c.name,
    phone: c.phone,
    email: c.email,
    message: c.message,
    lotCode: target.lotCode,
    channel: 'form',
    referralCode: c.referralCode,
    utm: opts.utm ?? null,
    silent: opts.silent,
    createdAt: opts.silent ? c.createdAt : undefined,
  });
  await prisma.contactSubmission.update({ where: { id: c.id }, data: { leadId: lead.id } });
  return lead.id;
}

/** Importa al CRM los formularios anteriores a la bandeja única (sin avisos). */
export async function backfillContactLeads() {
  const pending = await prisma.contactSubmission.findMany({ where: { leadId: null, phone: { not: null } }, select: { id: true } });
  let n = 0;
  for (const c of pending) if (await contactToLead(c.id, { silent: true }).catch((e) => console.error('backfill contacto', e))) n++;
  if (n) console.log(`[crm] ${n} formularios importados al CRM`);
}

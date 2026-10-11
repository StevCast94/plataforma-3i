import type { LeadStatus } from '@prisma/client';
import { prisma } from '../prisma';

// CRM del desarrollador (inspirado en Kommo): historial, tareas y automatizaciones.
// Automatizaciones:
//  - Contacto nuevo → tarea «Contactar» con vencimiento en 24 h.
//  - Pasa a Visita → tarea «Confirmar visita» para hoy si no hay una visita pendiente.
//  - Venta o Perdido → se cierran las tareas pendientes.

export const TASK_TYPES = ['CALL', 'VISIT', 'FOLLOW_UP', 'OFFER', 'OTHER'] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const STAGE_LABEL: Record<LeadStatus, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  VISIT: 'Visita',
  NEGOTIATION: 'Negociación',
  WON: 'Venta',
  LOST: 'Perdido',
};

export function logActivity(leadId: string, kind: string, actor: string, body?: string | null, meta?: object) {
  return prisma.leadActivity.create({ data: { leadId, kind, actor, body: body ?? null, meta: meta ?? undefined } });
}

/** Al registrar un contacto nuevo en un proyecto de terceros. */
export async function onNewLead(leadId: string, source: string) {
  await logActivity(leadId, 'created', 'system', null, { source });
  await prisma.leadTask.create({
    data: { leadId, type: 'CALL', title: 'Contactar al cliente', dueAt: new Date(Date.now() + 24 * 3600_000), auto: true },
  });
}

/** Cambio de etapa: historial + automatizaciones. */
export async function onStageChange(leadId: string, from: LeadStatus, to: LeadStatus, actor: string) {
  if (from === to) return;
  await logActivity(leadId, 'stage', actor, `${STAGE_LABEL[from]} → ${STAGE_LABEL[to]}`, { from, to });
  if (to === 'CONTACTED' || to === 'VISIT' || to === 'NEGOTIATION') {
    await prisma.projectLead.update({ where: { id: leadId }, data: { lastContactAt: new Date() } });
    // El primer contacto cumple la tarea automática de «Contactar».
    await prisma.leadTask.updateMany({ where: { leadId, auto: true, type: 'CALL', doneAt: null }, data: { doneAt: new Date() } });
  }
  if (to === 'VISIT') {
    const open = await prisma.leadTask.count({ where: { leadId, type: 'VISIT', doneAt: null } });
    if (!open) {
      const end = new Date();
      end.setHours(23, 59, 0, 0);
      await prisma.leadTask.create({ data: { leadId, type: 'VISIT', title: 'Confirmar fecha de la visita', dueAt: end, auto: true } });
    }
  }
  if (to === 'WON' || to === 'LOST') {
    await prisma.leadTask.updateMany({ where: { leadId, doneAt: null }, data: { doneAt: new Date() } });
  }
}

/** Reemplaza {nombre} {proyecto} {solar} en una plantilla. */
export function fillTemplate(body: string, lead: { name: string; lotCode: string | null; project: { name: string } }) {
  const first = lead.name.trim().split(/\s+/)[0] ?? lead.name;
  return body
    .replace(/\{nombre\}/gi, first)
    .replace(/\{proyecto\}/gi, lead.project.name)
    .replace(/\{solar\}/gi, lead.lotCode ?? '');
}

export const DEFAULT_TEMPLATES = [
  { name: 'Primer contacto', body: 'Hola {nombre}, te saluda el equipo de {proyecto}. Vimos tu interés en el solar {solar}. ¿Te puedo enviar precios y formas de pago?' },
  { name: 'Agendar visita', body: 'Hola {nombre}, ¿te gustaría visitar {proyecto} esta semana? Tenemos horarios de lunes a sábado. ¿Qué día te queda mejor?' },
  { name: 'Seguimiento', body: 'Hola {nombre}, ¿pudiste revisar la información de {proyecto}? Quedo atento a cualquier duda.' },
  { name: 'First contact (EN)', body: 'Hi {nombre}, this is the {proyecto} team. We saw your interest in lot {solar}. May I send you prices and payment options?' },
];

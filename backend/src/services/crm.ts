import type { LeadStatus } from '@prisma/client';
import { prisma } from '../prisma';
import { INTERNAL_DEV_ID, staffIdsForCrmUsers } from './internalTeam';
import { sendPushToDeveloperUsers, sendPushToStaff } from './push';

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
export async function onNewLead(leadId: string, source: string, opts: { silent?: boolean } = {}) {
  await logActivity(leadId, 'created', 'system', null, { source });
  if (opts.silent) {
    // Importación de contactos antiguos: se reparten, sin aviso ni tarea nueva.
    const l = await prisma.projectLead.findUnique({ where: { id: leadId }, select: { project: { select: { developerId: true } } } });
    await autoAssign(leadId, l?.project.developerId ?? INTERNAL_DEV_ID);
    return;
  }
  await prisma.leadTask.create({
    data: { leadId, type: 'CALL', title: 'Contactar al cliente', dueAt: new Date(Date.now() + 24 * 3600_000), auto: true },
  });
  await announceNewLead(leadId).catch((e) => console.error('announceNewLead', e));
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

/** Reemplaza {nombre} {proyecto} {lote} en una plantilla ({solar} sigue valiendo: plantillas anteriores). */
export function fillTemplate(body: string, lead: { name: string; lotCode: string | null; project: { name: string } }) {
  const first = lead.name.trim().split(/\s+/)[0] ?? lead.name;
  return body
    .replace(/\{nombre\}/gi, first)
    .replace(/\{proyecto\}/gi, lead.project.name)
    .replace(/\{(lote|solar)\}/gi, lead.lotCode ?? '');
}

export const DEFAULT_TEMPLATES = [
  { name: 'Primer contacto', body: 'Hola {nombre}, te saluda el equipo de {proyecto}. Vimos tu interés en el lote {lote}. ¿Te puedo enviar precios y formas de pago?' },
  { name: 'Agendar visita', body: 'Hola {nombre}, ¿te gustaría visitar {proyecto} esta semana? Tenemos horarios de lunes a sábado. ¿Qué día te queda mejor?' },
  { name: 'Seguimiento', body: 'Hola {nombre}, ¿pudiste revisar la información de {proyecto}? Quedo atento a cualquier duda.' },
  { name: 'First contact (EN)', body: 'Hi {nombre}, this is the {proyecto} team. We saw your interest in lot {lote}. May I send you prices and payment options?' },
];

// ============================================================
// Equipo de ventas y avisos push
// ============================================================

/** Quién recibe avisos de un contacto: su vendedor, o los dueños si no tiene. */
async function recipientsFor(developerId: string, assignedToId: string | null) {
  if (assignedToId) return [assignedToId];
  const owners = await prisma.developerUser.findMany({ where: { developerId, role: 'OWNER', active: true }, select: { id: true } });
  return owners.map((o) => o.id);
}

/**
 * Reparto automático (round-robin por carga): el vendedor activo con menos
 * contactos abiertos. Sin vendedores, el contacto queda sin asignar (lo ven los dueños).
 */
export async function autoAssign(leadId: string, developerId: string): Promise<string | null> {
  const sellers = await prisma.developerUser.findMany({
    where: { developerId, role: 'SELLER', active: true },
    select: { id: true, _count: { select: { leads: { where: { status: { notIn: ['WON', 'LOST'] } } } } } },
  });
  if (!sellers.length) return null;
  sellers.sort((a, b) => a._count.leads - b._count.leads);
  const id = sellers[0].id;
  await prisma.projectLead.update({ where: { id: leadId }, data: { assignedToId: id } });
  await logActivity(leadId, 'assign', 'system', 'Asignado automáticamente');
  return id;
}

/** Contacto nuevo → asignación + aviso al celular. */
export async function announceNewLead(leadId: string) {
  const lead = await prisma.projectLead.findUnique({
    where: { id: leadId },
    select: { name: true, lotCode: true, project: { select: { name: true, developerId: true } } },
  });
  if (!lead) return;
  const developerId = lead.project.developerId;
  const body = `${lead.name} · ${lead.project.name}${lead.lotCode ? ` · lote ${lead.lotCode}` : ''}. Escríbele pronto.`;
  // Proyecto propio de Grupo 3i: se reparte entre los asesores del equipo; avisa al
  // asesor asignado o, si no hay asesores, a los administradores.
  if (!developerId) {
    const assigned = await autoAssign(leadId, INTERNAL_DEV_ID);
    await sendPushToStaff({ title: '🔔 Nuevo contacto', body, link: '/admin/crm' }, assigned ? await staffIdsForCrmUsers([assigned]) : undefined);
    return;
  }
  const assigned = await autoAssign(leadId, developerId);
  const to = await recipientsFor(developerId, assigned);
  await sendPushToDeveloperUsers(to, {
    title: '🔔 Nuevo contacto',
    body: `${lead.name} · ${lead.project.name}${lead.lotCode ? ` · lote ${lead.lotCode}` : ''}. Escríbele pronto.`,
    link: '/desarrollador',
  });
}

/**
 * Tareas que vencen en los próximos 15 minutos (o ya vencidas) sin aviso:
 * push a su responsable. Lo llama el scheduler cada 5 minutos.
 */
export async function remindDueTasks(): Promise<number> {
  const tasks = await prisma.leadTask.findMany({
    where: {
      doneAt: null,
      notifiedAt: null,
      dueAt: { lte: new Date(Date.now() + 15 * 60_000) },
    },
    take: 200,
    include: { lead: { select: { name: true, assignedToId: true, project: { select: { developerId: true } } } } },
  });
  for (const t of tasks) {
    const late = t.dueAt.getTime() < Date.now() - 60_000;
    const msg = { title: late ? '⏰ Tarea vencida' : '⏰ Tarea por vencer', body: `${t.title} · ${t.lead.name}` };
    const devId = t.lead.project.developerId;
    if (devId) await sendPushToDeveloperUsers(await recipientsFor(devId, t.lead.assignedToId), { ...msg, link: '/desarrollador' });
    else await sendPushToStaff({ ...msg, link: '/admin/crm' }, t.lead.assignedToId ? await staffIdsForCrmUsers([t.lead.assignedToId]) : undefined);
    await prisma.leadTask.update({ where: { id: t.id }, data: { notifiedAt: new Date() } });
  }
  return tasks.length;
}

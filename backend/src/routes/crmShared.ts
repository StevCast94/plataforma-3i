import { Router } from 'express';
import { prisma } from '../prisma';
import { leadWhere, type DeveloperRequest } from '../middleware/authDeveloper';
import { registerLead, phoneDigits } from '../services/projectLeads';
import { DEFAULT_TEMPLATES, TASK_TYPES, fillTemplate, logActivity, onStageChange } from '../services/crm';

// ============================================================
// CRM compartido: lo usan el portal de desarrolladores (/api/developer, ya
// autenticado) y el admin de Grupo 3i (/api/admin/crm, con developerId = null:
// los proyectos propios). El alcance sale de req.developerId / leadWhere().
// ============================================================

export const crmRoutes = Router();

function ownProject(req: DeveloperRequest) {
  return prisma.project.findFirst({ where: { id: req.params.id, developerId: req.developerId ?? null } });
}

// ============================================================
// Contactos (paso 2). El desarrollador ve los contactos de SUS proyectos y puede
// registrar los propios (comisión reducida). No ve quién es el referidor.
// ============================================================

const LEAD_STATUSES = ['NEW', 'CONTACTED', 'VISIT', 'NEGOTIATION', 'WON', 'LOST'] as const;

// GET /api/developer/leads?projectId=
crmRoutes.get('/leads', async (req: DeveloperRequest, res) => {
  const leads = await prisma.projectLead.findMany({
    where: {
      ...leadWhere(req),
      ...(req.query.projectId ? { projectId: String(req.query.projectId) } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
    select: {
      id: true, projectId: true, lotCode: true, name: true, phone: true, email: true, message: true,
      source: true, channel: true, status: true, notes: true, createdAt: true,
      project: { select: { name: true } },
    },
  });
  res.json(leads);
});

// POST /api/developer/projects/:id/leads {name, phone, email?, notes?} — contacto propio
crmRoutes.post('/projects/:id/leads', async (req: DeveloperRequest, res) => {
  const project = await ownProject(req);
  if (!project) {
    res.status(404).json({ error: 'Proyecto no encontrado' });
    return;
  }
  const { name, phone, email, notes } = req.body ?? {};
  if (!name || !String(name).trim() || phoneDigits(String(phone ?? '')).length < 8) {
    res.status(400).json({ error: 'Nombre y WhatsApp son obligatorios' });
    return;
  }
  const { lead, created } = await registerLead({
    projectId: project.id,
    name: String(name),
    phone: String(phone),
    email: email ? String(email) : null,
    channel: 'manual',
    source: 'DEVELOPER',
  });
  if (!created) {
    res.status(409).json({
      error: `Ese contacto ya está registrado desde el ${lead.createdAt.toLocaleDateString('es-EC')} y su atribución sigue vigente.`,
    });
    return;
  }
  if (notes) await prisma.projectLead.update({ where: { id: lead.id }, data: { notes: String(notes) } });
  if (req.developerRole === 'SELLER') await prisma.projectLead.update({ where: { id: lead.id }, data: { assignedToId: req.developerUserId } });
  res.status(201).json(lead);
});

// PATCH /api/developer/leads/:leadId {status?, notes?}
crmRoutes.patch('/leads/:leadId', async (req: DeveloperRequest, res) => {
  const lead = await prisma.projectLead.findFirst({
    where: { id: req.params.leadId, ...leadWhere(req) },
  });
  if (!lead) {
    res.status(404).json({ error: 'Contacto no encontrado' });
    return;
  }
  const { status, notes, tags, budget, lostReason } = req.body ?? {};
  const data: { status?: (typeof LEAD_STATUSES)[number]; notes?: string | null; tags?: string[]; budget?: number | null; lostReason?: string | null } = {};
  if (status !== undefined) {
    if (!LEAD_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Estado inválido' });
      return;
    }
    data.status = status;
  }
  if (notes !== undefined) data.notes = notes ? String(notes).slice(0, 4000) : null;
  if (Array.isArray(tags)) data.tags = [...new Set(tags.map((t: unknown) => String(t).trim().slice(0, 30)).filter(Boolean))].slice(0, 12);
  if (lostReason !== undefined) data.lostReason = lostReason ? String(lostReason).slice(0, 120) : null;
  if (data.status && data.status !== 'LOST') data.lostReason = null;
  if (budget !== undefined) data.budget = budget === null || budget === '' ? null : Number(budget) || null;
  const updated = await prisma.projectLead.update({ where: { id: lead.id }, data });
  if (data.status) await onStageChange(lead.id, lead.status, data.status, 'developer');
  res.json(updated);
});

// ============================================================
// CRM (inspirado en Kommo): ficha del cliente, historial, tareas, agenda y
// plantillas de WhatsApp. Todo limitado a los proyectos del desarrollador.
// ============================================================

function ownLead(req: DeveloperRequest, id: string) {
  return prisma.projectLead.findFirst({
    where: { id, ...leadWhere(req) },
    include: { project: { select: { name: true } } },
  });
}

// GET /api/developer/crm/board — contactos con su próxima tarea (para el embudo)
crmRoutes.get('/crm/board', async (req: DeveloperRequest, res) => {
  const leads = await prisma.projectLead.findMany({
    where: {
      ...leadWhere(req),
      ...(req.query.projectId ? { projectId: String(req.query.projectId) } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    take: 1000,
    select: {
      id: true, projectId: true, lotCode: true, name: true, phone: true, source: true, status: true, tags: true,
      budget: true, createdAt: true, updatedAt: true, lastContactAt: true, assignedToId: true,
      assignedTo: { select: { name: true, email: true } },
      project: { select: { name: true } },
      tasks: { where: { doneAt: null }, orderBy: { dueAt: 'asc' }, take: 1, select: { id: true, title: true, dueAt: true, type: true } },
    },
  });
  res.json(leads.map(({ tasks, ...l }) => ({ ...l, nextTask: tasks[0] ?? null })));
});

// GET /api/developer/crm/leads/:id — ficha completa
crmRoutes.get('/crm/leads/:id', async (req: DeveloperRequest, res) => {
  const lead = await prisma.projectLead.findFirst({
    where: { id: req.params.id, ...leadWhere(req) },
    select: {
      id: true, projectId: true, lotCode: true, name: true, phone: true, email: true, message: true, source: true,
      channel: true, status: true, notes: true, tags: true, budget: true, createdAt: true, lastContactAt: true, lang: true,
      assignedToId: true, assignedTo: { select: { name: true, email: true } },
      lostReason: true,
      project: { select: { name: true } },
      activities: { orderBy: { createdAt: 'desc' }, take: 200 },
      tasks: { orderBy: [{ doneAt: 'asc' }, { dueAt: 'asc' }] },
      sales: { select: { id: true, price: true, status: true, lotCode: true } },
    },
  });
  if (!lead) {
    res.status(404).json({ error: 'Contacto no encontrado' });
    return;
  }
  res.json(lead);
});

// POST /api/developer/crm/leads/:id/notes {body}
crmRoutes.post('/crm/leads/:id/notes', async (req: DeveloperRequest, res) => {
  const lead = await ownLead(req, req.params.id);
  const body = String(req.body?.body ?? '').trim();
  if (!lead || !body) {
    res.status(400).json({ error: 'Escribe la nota' });
    return;
  }
  res.status(201).json(await logActivity(lead.id, 'note', 'developer', body.slice(0, 4000)));
});

// POST /api/developer/crm/leads/:id/tasks {type, title, dueAt}
crmRoutes.post('/crm/leads/:id/tasks', async (req: DeveloperRequest, res) => {
  const lead = await ownLead(req, req.params.id);
  const { type, title, dueAt } = req.body ?? {};
  const due = new Date(dueAt);
  if (!lead || !TASK_TYPES.includes(type) || !String(title ?? '').trim() || Number.isNaN(due.getTime())) {
    res.status(400).json({ error: 'Tipo, título y fecha son obligatorios' });
    return;
  }
  const task = await prisma.leadTask.create({ data: { leadId: lead.id, type, title: String(title).trim().slice(0, 160), dueAt: due } });
  await logActivity(lead.id, 'task', 'developer', task.title, { taskId: task.id, type, dueAt: due });
  res.status(201).json(task);
});

// PATCH /api/developer/crm/tasks/:taskId {done?, dueAt?}
crmRoutes.patch('/crm/tasks/:taskId', async (req: DeveloperRequest, res) => {
  const task = await prisma.leadTask.findFirst({ where: { id: req.params.taskId, lead: leadWhere(req) } });
  if (!task) {
    res.status(404).json({ error: 'Tarea no encontrada' });
    return;
  }
  const data: { doneAt?: Date | null; dueAt?: Date } = {};
  if (req.body?.done !== undefined) data.doneAt = req.body.done ? new Date() : null;
  if (req.body?.dueAt) data.dueAt = new Date(req.body.dueAt);
  const updated = await prisma.leadTask.update({ where: { id: task.id }, data });
  if (data.doneAt) await logActivity(task.leadId, 'task_done', 'developer', task.title, { taskId: task.id });
  res.json(updated);
});

// GET /api/developer/crm/tasks — agenda: pendientes (vencidas, hoy y próximas)
crmRoutes.get('/crm/tasks', async (req: DeveloperRequest, res) => {
  const tasks = await prisma.leadTask.findMany({
    where: { doneAt: null, lead: leadWhere(req) },
    orderBy: { dueAt: 'asc' },
    take: 300,
    include: { lead: { select: { id: true, name: true, phone: true, lotCode: true, status: true, project: { select: { name: true } } } } },
  });
  res.json(tasks);
});

// POST /api/developer/crm/leads/:id/whatsapp {templateId?, body?} — arma el mensaje, lo registra y devuelve el enlace
crmRoutes.post('/crm/leads/:id/whatsapp', async (req: DeveloperRequest, res) => {
  const lead = await ownLead(req, req.params.id);
  if (!lead) {
    res.status(404).json({ error: 'Contacto no encontrado' });
    return;
  }
  let body = String(req.body?.body ?? '').trim();
  if (req.body?.templateId) {
    const tpl = await prisma.whatsAppTemplate.findFirst({ where: { id: String(req.body.templateId), developerId: req.developerId } });
    if (tpl) body = tpl.body;
  }
  if (!body) {
    res.status(400).json({ error: 'Escribe el mensaje' });
    return;
  }
  const text = fillTemplate(body, lead);
  await logActivity(lead.id, 'whatsapp', 'developer', text.slice(0, 4000));
  await prisma.projectLead.update({ where: { id: lead.id }, data: { lastContactAt: new Date() } });
  res.json({ url: `https://wa.me/${phoneDigits(lead.phone)}?text=${encodeURIComponent(text)}`, text });
});

// GET /api/developer/crm/templates — si el desarrollador no tiene, se crean las de ejemplo
crmRoutes.get('/crm/templates', async (req: DeveloperRequest, res) => {
  let list = await prisma.whatsAppTemplate.findMany({ where: { developerId: req.developerId }, orderBy: { createdAt: 'asc' } });
  if (!list.length) {
    await prisma.whatsAppTemplate.createMany({ data: DEFAULT_TEMPLATES.map((t) => ({ ...t, developerId: req.developerId! })) });
    list = await prisma.whatsAppTemplate.findMany({ where: { developerId: req.developerId }, orderBy: { createdAt: 'asc' } });
  }
  res.json(list);
});

// POST /api/developer/crm/templates {name, body}
crmRoutes.post('/crm/templates', async (req: DeveloperRequest, res) => {
  const name = String(req.body?.name ?? '').trim();
  const body = String(req.body?.body ?? '').trim();
  if (!name || !body) {
    res.status(400).json({ error: 'Nombre y mensaje son obligatorios' });
    return;
  }
  res.status(201).json(
    await prisma.whatsAppTemplate.create({ data: { developerId: req.developerId!, name: name.slice(0, 60), body: body.slice(0, 2000) } }),
  );
});

// DELETE /api/developer/crm/templates/:id
crmRoutes.delete('/crm/templates/:id', async (req: DeveloperRequest, res) => {
  await prisma.whatsAppTemplate.deleteMany({ where: { id: req.params.id, developerId: req.developerId } });
  res.json({ ok: true });
});


// ============================================================
// Reportes del CRM: primera respuesta, conversión por etapa, motivos de
// pérdida y desempeño por vendedor. ?days=30&projectId=
// ============================================================

const STAGE_ORDER = ['NEW', 'CONTACTED', 'VISIT', 'NEGOTIATION', 'WON'] as const;

crmRoutes.get('/crm/report', async (req: DeveloperRequest, res) => {
  const days = Math.min(365, Math.max(7, Number(req.query.days) || 30));
  const since = new Date(Date.now() - days * 86400_000);
  const leads = await prisma.projectLead.findMany({
    where: { ...leadWhere(req), createdAt: { gte: since }, ...(req.query.projectId ? { projectId: String(req.query.projectId) } : {}) },
    select: {
      id: true, status: true, lostReason: true, createdAt: true, assignedToId: true, source: true,
      assignedTo: { select: { name: true, email: true } },
      activities: { where: { actor: { not: 'system' } }, orderBy: { createdAt: 'asc' }, select: { kind: true, meta: true, createdAt: true } },
      sales: { where: { status: { in: ['DECLARED', 'CONFIRMED'] } }, select: { price: true } },
    },
  });

  // Primera respuesta: desde que entra el contacto hasta la primera acción humana
  // (WhatsApp, cambio de etapa, nota o tarea).
  const firstHours = leads
    .map((l) => (l.activities[0] ? (l.activities[0].createdAt.getTime() - l.createdAt.getTime()) / 3600_000 : null))
    .filter((h): h is number => h !== null);
  const median = (xs: number[]) => {
    if (!xs.length) return null;
    const v = [...xs].sort((a, b) => a - b);
    const m = Math.floor(v.length / 2);
    return Math.round((v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2) * 10) / 10;
  };

  // Etapa más alta alcanzada (por historial o por la etapa actual).
  const reached = (l: (typeof leads)[number]) => {
    let max = STAGE_ORDER.indexOf(l.status as (typeof STAGE_ORDER)[number]);
    for (const a of l.activities) {
      const to = (a.meta as { to?: string } | null)?.to;
      const i = STAGE_ORDER.indexOf(to as (typeof STAGE_ORDER)[number]);
      if (i > max) max = i;
    }
    return Math.max(max, 0);
  };
  const funnel = STAGE_ORDER.map((stage, i) => ({ stage, n: leads.filter((l) => reached(l) >= i).length }));

  const lost = new Map<string, number>();
  for (const l of leads) if (l.status === 'LOST') lost.set(l.lostReason || 'Sin motivo', (lost.get(l.lostReason || 'Sin motivo') ?? 0) + 1);

  const bySeller = new Map<string, { name: string; leads: number; contacted24: number; won: number; amount: number; hours: number[] }>();
  for (const l of leads) {
    const key = l.assignedToId ?? 'none';
    const r = bySeller.get(key) ?? { name: l.assignedTo ? (l.assignedTo.name ?? l.assignedTo.email) : 'Sin asignar', leads: 0, contacted24: 0, won: 0, amount: 0, hours: [] };
    r.leads++;
    const first = l.activities[0];
    if (first) {
      const h = (first.createdAt.getTime() - l.createdAt.getTime()) / 3600_000;
      r.hours.push(h);
      if (h <= 24) r.contacted24++;
    }
    if (l.status === 'WON' || l.sales.length) r.won++;
    r.amount += l.sales.reduce((a, s) => a + s.price, 0);
    bySeller.set(key, r);
  }

  res.json({
    days,
    total: leads.length,
    firstResponseMedianHours: median(firstHours),
    contactedWithin24h: firstHours.filter((h) => h <= 24).length,
    neverContacted: leads.length - firstHours.length,
    funnel,
    lostReasons: [...lost.entries()].map(([reason, n]) => ({ reason, n })).sort((a, b) => b.n - a.n),
    sellers: [...bySeller.values()]
      .map(({ hours, ...r }) => ({ ...r, medianHours: median(hours) }))
      .sort((a, b) => b.won - a.won || b.leads - a.leads),
  });
});

import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin, type AuthedRequest } from '../middleware/auth';
import { CASE_TEMPLATES, SERVICE_IDS, SERVICE_NAMES, cleanServices, templateForService } from '../lib/serviceCatalog';
import { caseLink, clientWhatsapp, createCase, logEvent, newToken, quoteLink, setStepStatus, waLink } from '../services/serviceCases';
import { signedDocUrl, uploadCaseDocument } from '../lib/projectDocs';

// Servicios integrales — panel: solicitudes, propuestas, expedientes, cobros e indicadores.
export const adminServiceRoutes = Router();
adminServiceRoutes.use(requireAdmin);

const str = (v: unknown, max = 200) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
const num = (v: unknown) => (v === null || v === '' || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v));
const date = (v: unknown) => (v ? new Date(String(v)) : null);
const who = async (req: AuthedRequest) => {
  const s = req.staff ? await prisma.staffUser.findUnique({ where: { id: req.staff.staffId }, select: { fullName: true, username: true } }) : null;
  return s?.fullName || s?.username || 'Equipo';
};
const wrap =
  (fn: (req: AuthedRequest, res: import('express').Response) => Promise<void>) =>
  (req: AuthedRequest, res: import('express').Response) =>
    fn(req, res).catch((err) => {
      console.error('adminServices', req.method, req.path, err);
      res.status(400).json({ error: (err as Error).message || 'Error' });
    });

// ---------- Catálogo ----------
adminServiceRoutes.get('/catalog', (_req, res) => {
  res.json({
    services: SERVICE_IDS.map((id) => ({ id, name: SERVICE_NAMES[id], template: templateForService(id).id })),
    templates: CASE_TEMPLATES.map((t) => ({ id: t.id, name: t.name, steps: t.steps.map((s) => s.title) })),
  });
});

adminServiceRoutes.get('/staff', wrap(async (_req, res) => {
  res.json(await prisma.staffUser.findMany({ where: { active: true, role: { in: ['superadmin', 'admin', 'advisor'] } }, select: { id: true, username: true, fullName: true } }));
}));

// ---------- Solicitudes ----------
adminServiceRoutes.get('/requests', wrap(async (req, res) => {
  const status = str(req.query.status, 20);
  res.json(await prisma.serviceRequest.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: 'desc' },
    take: 300,
    include: { quotes: { select: { id: true, number: true, status: true, total: true } }, cases: { select: { id: true, number: true, status: true } } },
  }));
}));

adminServiceRoutes.post('/requests', wrap(async (req, res) => {
  const b = req.body ?? {};
  const name = str(b.name, 120);
  if (!name) throw new Error('Escribe el nombre del cliente');
  res.status(201).json(await prisma.serviceRequest.create({
    data: { name, phone: str(b.phone, 40) ?? '', email: str(b.email, 160), company: str(b.company, 160), location: str(b.location, 160), services: cleanServices(b.services), message: str(b.message, 4000), ownerId: str(b.ownerId, 60) },
  }));
}));

adminServiceRoutes.put('/requests/:id', wrap(async (req, res) => {
  const b = req.body ?? {};
  const data: Record<string, unknown> = {};
  if ('status' in b) {
    if (!['NEW', 'CONTACTED', 'QUOTED', 'WON', 'LOST'].includes(b.status)) throw new Error('Estado inválido');
    data.status = b.status;
  }
  for (const k of ['notes', 'name', 'phone', 'email', 'company', 'location', 'ownerId'] as const) if (k in b) data[k] = str(b[k], k === 'notes' ? 8000 : 160);
  if ('services' in b) data.services = cleanServices(b.services);
  res.json(await prisma.serviceRequest.update({ where: { id: req.params.id }, data }));
}));

// ---------- Propuestas ----------
type Item = { serviceId?: string; description: string; qty: number; unit?: string; unitPrice: number };
function totals(items: Item[], taxRate: number) {
  const subtotal = Math.round(items.reduce((s, i) => s + i.qty * i.unitPrice, 0) * 100) / 100;
  return { subtotal, total: Math.round(subtotal * (1 + taxRate) * 100) / 100 };
}
function cleanItems(v: unknown): Item[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((i) => ({
      serviceId: str(i?.serviceId, 40) ?? undefined,
      description: str(i?.description, 500) ?? '',
      qty: num(i?.qty) ?? 1,
      unit: str(i?.unit, 30) ?? undefined,
      unitPrice: num(i?.unitPrice) ?? 0,
    }))
    .filter((i) => i.description);
}
function cleanMilestones(v: unknown) {
  if (!Array.isArray(v)) return null;
  const m = v.map((x) => ({ label: str(x?.label, 120) ?? '', pct: num(x?.pct) ?? 0 })).filter((x) => x.label && x.pct > 0);
  if (!m.length) return null;
  const sum = m.reduce((s, x) => s + x.pct, 0);
  if (Math.abs(sum - 100) > 0.01) throw new Error(`Los hitos de cobro deben sumar 100 % (ahora suman ${sum} %)`);
  return m;
}
const quoteOut = <T extends { token: string; lang: string; clientPhone: string | null; clientName: string; title: string }>(q: T) => ({
  ...q,
  link: quoteLink(q.token, q.lang),
  whatsapp: waLink(
    q.clientPhone,
    q.lang === 'en'
      ? `Hi ${q.clientName}, here’s our proposal for «${q.title}». You can review and accept it here: ${quoteLink(q.token, 'en')}`
      : `Hola ${q.clientName}, te comparto nuestra propuesta para «${q.title}». Puedes revisarla y aceptarla aquí: ${quoteLink(q.token)}`,
  ),
});

adminServiceRoutes.get('/quotes', wrap(async (_req, res) => {
  const rows = await prisma.serviceQuote.findMany({ orderBy: { createdAt: 'desc' }, take: 300, include: { cases: { select: { id: true, number: true } } } });
  res.json(rows.map(quoteOut));
}));

adminServiceRoutes.get('/quotes/:id', wrap(async (req, res) => {
  const q = await prisma.serviceQuote.findUniqueOrThrow({ where: { id: req.params.id }, include: { cases: { select: { id: true, number: true } } } });
  res.json(quoteOut(q));
}));

function quoteData(b: Record<string, unknown>) {
  const items = cleanItems(b.items);
  const taxRate = num(b.taxRate) ?? 0.15;
  const clientName = str(b.clientName, 120);
  const title = str(b.title, 200);
  if (!clientName || !title) throw new Error('Falta el cliente o el título');
  if (!items.length) throw new Error('Agrega al menos un renglón');
  return {
    clientName,
    title,
    clientPhone: str(b.clientPhone, 40),
    clientEmail: str(b.clientEmail, 160),
    lang: b.lang === 'en' ? 'en' : 'es',
    items,
    taxRate,
    ...totals(items, taxRate),
    milestones: cleanMilestones(b.milestones) ?? undefined,
    templateId: str(b.templateId, 40),
    terms: str(b.terms, 8000),
    validUntil: date(b.validUntil),
    requestId: str(b.requestId, 60),
  };
}

adminServiceRoutes.post('/quotes', wrap(async (req, res) => {
  const q = await prisma.serviceQuote.create({ data: { ...quoteData(req.body ?? {}), token: newToken(), createdById: req.staff?.staffId ?? null } as never });
  res.status(201).json(quoteOut(q));
}));

adminServiceRoutes.put('/quotes/:id', wrap(async (req, res) => {
  const cur = await prisma.serviceQuote.findUniqueOrThrow({ where: { id: req.params.id } });
  if (cur.status === 'ACCEPTED') throw new Error('Una propuesta aceptada no se edita; crea una nueva');
  const q = await prisma.serviceQuote.update({ where: { id: cur.id }, data: quoteData(req.body ?? {}) as never });
  res.json(quoteOut(q));
}));

// POST /quotes/:id/status { status: SENT | REJECTED | DRAFT }
adminServiceRoutes.post('/quotes/:id/status', wrap(async (req, res) => {
  const status = String(req.body?.status ?? '');
  if (!['SENT', 'REJECTED', 'DRAFT'].includes(status)) throw new Error('Estado inválido');
  const q = await prisma.serviceQuote.update({ where: { id: req.params.id }, data: { status, ...(status === 'SENT' ? { sentAt: new Date() } : {}) } });
  if (status === 'SENT' && q.requestId) await prisma.serviceRequest.update({ where: { id: q.requestId }, data: { status: 'QUOTED' } }).catch(() => {});
  res.json(quoteOut(q));
}));

adminServiceRoutes.delete('/quotes/:id', wrap(async (req, res) => {
  const q = await prisma.serviceQuote.findUniqueOrThrow({ where: { id: req.params.id } });
  if (q.status !== 'DRAFT') throw new Error('Solo se borran borradores');
  await prisma.serviceQuote.delete({ where: { id: q.id } });
  res.json({ ok: true });
}));

// ---------- Expedientes ----------
adminServiceRoutes.get('/cases', wrap(async (req, res) => {
  const status = str(req.query.status, 20);
  const rows = await prisma.serviceCase.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: 'desc' },
    take: 300,
    include: { steps: { select: { status: true, title: true, dueDate: true, order: true }, orderBy: { order: 'asc' } }, payments: { select: { amount: true, paidAt: true } } },
  });
  const now = Date.now();
  res.json(rows.map(({ steps, payments, ...c }) => {
    const current = steps.find((s) => s.status === 'ACTIVE');
    return {
      ...c,
      progress: { done: steps.filter((s) => s.status === 'DONE' || s.status === 'SKIPPED').length, total: steps.length },
      currentStep: current?.title ?? null,
      overdue: Boolean(current?.dueDate && current.dueDate.getTime() < now),
      billed: payments.reduce((s, p) => s + p.amount, 0),
      paid: payments.filter((p) => p.paidAt).reduce((s, p) => s + p.amount, 0),
    };
  }));
}));

adminServiceRoutes.get('/cases/:id', wrap(async (req, res) => {
  const c = await prisma.serviceCase.findUniqueOrThrow({
    where: { id: req.params.id },
    include: {
      steps: { orderBy: { order: 'asc' } },
      documents: { orderBy: { createdAt: 'desc' } },
      events: { orderBy: { createdAt: 'desc' }, take: 200 },
      payments: { orderBy: { createdAt: 'asc' } },
      quote: { select: { id: true, number: true, total: true } },
    },
  });
  res.json({ ...c, link: caseLink(c.token, c.lang), whatsapp: await clientWhatsapp(c.id) });
}));

adminServiceRoutes.post('/cases', wrap(async (req, res) => {
  const b = req.body ?? {};
  const clientName = str(b.clientName, 120);
  if (!clientName) throw new Error('Escribe el nombre del cliente');
  const c = await createCase({
    templateId: str(b.templateId, 40) ?? 'generico',
    title: str(b.title, 200) ?? undefined,
    clientName,
    clientPhone: str(b.clientPhone, 40),
    clientEmail: str(b.clientEmail, 160),
    lang: b.lang,
    requestId: str(b.requestId, 60),
    projectId: str(b.projectId, 60),
    ownerId: str(b.ownerId, 60),
    by: await who(req),
  });
  if (c.requestId) await prisma.serviceRequest.update({ where: { id: c.requestId }, data: { status: 'WON' } }).catch(() => {});
  res.status(201).json(c);
}));

adminServiceRoutes.put('/cases/:id', wrap(async (req, res) => {
  const b = req.body ?? {};
  const data: Record<string, unknown> = {};
  for (const k of ['title', 'clientName', 'clientPhone', 'clientEmail', 'ownerId', 'projectId'] as const) if (k in b) data[k] = str(b[k], 200);
  if ('dueDate' in b) data.dueDate = date(b.dueDate);
  if ('lang' in b) data.lang = b.lang === 'en' ? 'en' : 'es';
  if ('status' in b) {
    if (!['ACTIVE', 'ON_HOLD', 'DONE', 'CANCELLED'].includes(b.status)) throw new Error('Estado inválido');
    data.status = b.status;
  }
  const c = await prisma.serviceCase.update({ where: { id: req.params.id }, data });
  if ('status' in b) {
    const label = { ACTIVE: 'En curso', ON_HOLD: 'En pausa', DONE: 'Terminado', CANCELLED: 'Cancelado' }[b.status as string];
    await logEvent(c.id, 'status', `Estado del expediente: ${label}`, await who(req), true);
  }
  res.json(c);
}));

adminServiceRoutes.post('/cases/:id/regenerate-link', wrap(async (req, res) => {
  const c = await prisma.serviceCase.update({ where: { id: req.params.id }, data: { token: newToken() } });
  await logEvent(c.id, 'note', 'Se generó un nuevo enlace de seguimiento (el anterior dejó de funcionar)', await who(req));
  res.json({ link: caseLink(c.token, c.lang) });
}));

// Etapas
adminServiceRoutes.post('/cases/:id/steps', wrap(async (req, res) => {
  const b = req.body ?? {};
  const title = str(b.title, 200);
  if (!title) throw new Error('Escribe el nombre de la etapa');
  const last = await prisma.caseStep.findFirst({ where: { caseId: req.params.id }, orderBy: { order: 'desc' } });
  const step = await prisma.caseStep.create({
    data: { caseId: req.params.id, order: (last?.order ?? 0) + 1, title, party: ['team', 'client', 'institution'].includes(b.party) ? b.party : 'team', institution: str(b.institution, 120), dueDays: num(b.dueDays), requirements: [] },
  });
  await logEvent(req.params.id, 'step', `Etapa agregada: ${title}`, await who(req));
  res.status(201).json(step);
}));

adminServiceRoutes.put('/steps/:stepId', wrap(async (req, res) => {
  const b = req.body ?? {};
  const data: Record<string, unknown> = {};
  for (const k of ['title', 'description', 'institution', 'notes'] as const) if (k in b) data[k] = str(b[k], k === 'title' ? 200 : 4000);
  if ('party' in b && ['team', 'client', 'institution'].includes(b.party)) data.party = b.party;
  if ('dueDate' in b) data.dueDate = date(b.dueDate);
  if ('requirements' in b && Array.isArray(b.requirements)) data.requirements = b.requirements.map(String).map((x: string) => x.trim()).filter(Boolean).slice(0, 30);
  if (Object.keys(data).length) await prisma.caseStep.update({ where: { id: req.params.stepId }, data });
  if ('status' in b) {
    if (!['PENDING', 'ACTIVE', 'DONE', 'SKIPPED'].includes(b.status)) throw new Error('Estado inválido');
    await setStepStatus(req.params.stepId, b.status, await who(req));
  }
  res.json(await prisma.caseStep.findUnique({ where: { id: req.params.stepId } }));
}));

adminServiceRoutes.delete('/steps/:stepId', wrap(async (req, res) => {
  const s = await prisma.caseStep.delete({ where: { id: req.params.stepId } });
  await logEvent(s.caseId, 'step', `Etapa eliminada: ${s.title}`, await who(req));
  res.json({ ok: true });
}));

// Bitácora
adminServiceRoutes.post('/cases/:id/events', wrap(async (req, res) => {
  const text = str(req.body?.text, 4000);
  if (!text) throw new Error('Escribe la nota');
  await logEvent(req.params.id, 'note', text, await who(req), Boolean(req.body?.public));
  res.status(201).json({ ok: true });
}));

// Documentos
adminServiceRoutes.post('/cases/:id/documents', wrap(async (req, res) => {
  const dataUri = String(req.body?.dataUri ?? '');
  if (!/^data:(image\/(png|jpe?g|webp)|application\/pdf);base64,/.test(dataUri)) throw new Error('Sube un PDF o una imagen');
  const up = await uploadCaseDocument(dataUri, req.params.id);
  const name = str(req.body?.name, 160) ?? 'Documento';
  const d = await prisma.caseDocument.create({
    data: { caseId: req.params.id, stepId: str(req.body?.stepId, 60), name, publicId: up.publicId, format: up.format, uploadedBy: 'team', visible: req.body?.visible !== false },
  });
  await logEvent(req.params.id, 'document', `Documento agregado: ${name}`, await who(req), d.visible);
  res.status(201).json(d);
}));

adminServiceRoutes.get('/documents/:docId', wrap(async (req, res) => {
  const d = await prisma.caseDocument.findUniqueOrThrow({ where: { id: req.params.docId } });
  res.json({ url: signedDocUrl(d.publicId, d.format) });
}));

adminServiceRoutes.put('/documents/:docId', wrap(async (req, res) => {
  res.json(await prisma.caseDocument.update({ where: { id: req.params.docId }, data: { visible: Boolean(req.body?.visible) } }));
}));

adminServiceRoutes.delete('/documents/:docId', wrap(async (req, res) => {
  const d = await prisma.caseDocument.delete({ where: { id: req.params.docId } });
  await logEvent(d.caseId, 'document', `Documento eliminado: ${d.name}`, await who(req));
  res.json({ ok: true });
}));

// Cobros por hito (S4)
adminServiceRoutes.post('/cases/:id/payments', wrap(async (req, res) => {
  const label = str(req.body?.label, 120);
  const amount = num(req.body?.amount);
  if (!label || amount == null) throw new Error('Escribe el concepto y el monto');
  res.status(201).json(await prisma.casePayment.create({ data: { caseId: req.params.id, label, amount, dueDate: date(req.body?.dueDate) } }));
}));

adminServiceRoutes.put('/payments/:pid', wrap(async (req, res) => {
  const b = req.body ?? {};
  const data: Record<string, unknown> = {};
  if ('label' in b) data.label = str(b.label, 120);
  if ('amount' in b) data.amount = num(b.amount) ?? 0;
  if ('dueDate' in b) data.dueDate = date(b.dueDate);
  if ('method' in b) data.method = str(b.method, 60);
  if ('reference' in b) data.reference = str(b.reference, 120);
  if ('paid' in b) data.paidAt = b.paid ? new Date() : null;
  const p = await prisma.casePayment.update({ where: { id: req.params.pid }, data });
  if ('paid' in b) await logEvent(p.caseId, 'payment', b.paid ? `Pago recibido: ${p.label} ($${p.amount.toLocaleString('en-US')})` : `Pago desmarcado: ${p.label}`, await who(req), Boolean(b.paid));
  res.json(p);
}));

adminServiceRoutes.delete('/payments/:pid', wrap(async (req, res) => {
  await prisma.casePayment.delete({ where: { id: req.params.pid } });
  res.json({ ok: true });
}));

// ---------- Indicadores (S6) ----------
adminServiceRoutes.get('/metrics', wrap(async (_req, res) => {
  const now = Date.now();
  const [requests, quotes, cases, steps, payments] = await Promise.all([
    prisma.serviceRequest.findMany({ select: { services: true, status: true, createdAt: true } }),
    prisma.serviceQuote.findMany({ select: { status: true, total: true } }),
    prisma.serviceCase.findMany({ select: { id: true, status: true, ownerId: true, title: true, number: true } }),
    prisma.caseStep.findMany({ select: { caseId: true, title: true, institution: true, party: true, status: true, startedAt: true, doneAt: true, dueDate: true } }),
    prisma.casePayment.findMany({ select: { amount: true, paidAt: true, dueDate: true } }),
  ]);
  const byService: Record<string, number> = {};
  for (const r of requests) for (const s of r.services) byService[s] = (byService[s] ?? 0) + 1;

  const sent = quotes.filter((q) => q.status !== 'DRAFT');
  const accepted = quotes.filter((q) => q.status === 'ACCEPTED');

  // Días promedio por institución / responsable, en etapas cerradas.
  const durations: Record<string, { days: number; n: number }> = {};
  for (const s of steps) {
    if (!s.startedAt || !s.doneAt || s.status !== 'DONE') continue;
    const key = s.institution || (s.party === 'client' ? 'Cliente' : 'Equipo Grupo 3i');
    const d = (s.doneAt.getTime() - s.startedAt.getTime()) / 86_400_000;
    durations[key] = { days: (durations[key]?.days ?? 0) + d, n: (durations[key]?.n ?? 0) + 1 };
  }
  const activeCaseIds = new Set(cases.filter((c) => c.status === 'ACTIVE').map((c) => c.id));
  const overdue = steps
    .filter((s) => s.status === 'ACTIVE' && s.dueDate && s.dueDate.getTime() < now && activeCaseIds.has(s.caseId))
    .map((s) => {
      const c = cases.find((x) => x.id === s.caseId)!;
      return { caseId: c.id, number: c.number, case: c.title, step: s.title, waiting: s.institution || (s.party === 'client' ? 'Cliente' : 'Equipo'), daysLate: Math.floor((now - s.dueDate!.getTime()) / 86_400_000) };
    })
    .sort((a, b) => b.daysLate - a.daysLate);
  const owners: Record<string, number> = {};
  for (const c of cases) if (c.status === 'ACTIVE') owners[c.ownerId ?? 'sin asignar'] = (owners[c.ownerId ?? 'sin asignar'] ?? 0) + 1;

  res.json({
    requests: { total: requests.length, open: requests.filter((r) => ['NEW', 'CONTACTED', 'QUOTED'].includes(r.status)).length, byService: Object.entries(byService).map(([id, n]) => ({ id, name: SERVICE_NAMES[id as keyof typeof SERVICE_NAMES] ?? id, n })).sort((a, b) => b.n - a.n) },
    quotes: { sent: sent.length, accepted: accepted.length, rate: sent.length ? accepted.length / sent.length : 0, valueSent: sent.reduce((s, q) => s + q.total, 0), valueAccepted: accepted.reduce((s, q) => s + q.total, 0) },
    cases: { active: cases.filter((c) => c.status === 'ACTIVE').length, onHold: cases.filter((c) => c.status === 'ON_HOLD').length, done: cases.filter((c) => c.status === 'DONE').length },
    stepDays: Object.entries(durations).map(([who, d]) => ({ who, avgDays: Math.round((d.days / d.n) * 10) / 10, n: d.n })).sort((a, b) => b.avgDays - a.avgDays),
    overdue,
    workload: owners,
    receivables: {
      billed: payments.reduce((s, p) => s + p.amount, 0),
      paid: payments.filter((p) => p.paidAt).reduce((s, p) => s + p.amount, 0),
      overdue: payments.filter((p) => !p.paidAt && p.dueDate && p.dueDate.getTime() < now).reduce((s, p) => s + p.amount, 0),
    },
  });
}));

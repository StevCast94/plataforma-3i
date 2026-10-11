import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../prisma';
import { requireAdmin, type AuthedRequest } from '../middleware/auth';
import { audit } from '../services/audit';
import { confirmSale, cancelSale, collectInstallment, saleTotals } from '../services/developerSales';
import { CHECKLIST, CHECKLIST_LABEL, isChecklistComplete, qualityFor } from '../services/projectQuality';
import { INTERNAL_DEV_ID } from '../services/internalTeam';
import { signedDocUrl } from '../lib/projectDocs';

// Gestión de desarrolladores (terceros que publican en la vitrina) y revisión de sus proyectos.
export const adminDeveloperRoutes = Router();
adminDeveloperRoutes.use(requireAdmin);

const FIELDS = [
  'name', 'legalName', 'ruc', 'contactName', 'email', 'whatsapp', 'status', 'commissionRate',
  'ownLeadRate', 'onboardingFee', 'onboardingPaid', 'featuredUntil', 'notes',
] as const;

function pick(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  for (const k of FIELDS) if (k in body) data[k] = body[k] === '' ? null : body[k];
  for (const k of ['commissionRate', 'ownLeadRate', 'onboardingFee'] as const) {
    if (data[k] != null) data[k] = Number(data[k]);
  }
  if (data.featuredUntil) data.featuredUntil = new Date(String(data.featuredUntil));
  return data;
}

const tempPassword = () => crypto.randomBytes(9).toString('base64url');

// GET /api/admin/developers
adminDeveloperRoutes.get('/', async (_req, res) => {
  const developers = await prisma.developer.findMany({
    where: { id: { not: INTERNAL_DEV_ID } }, // el equipo interno de Grupo 3i no es una desarrolladora
    orderBy: { createdAt: 'desc' },
    include: {
      users: { select: { id: true, email: true, name: true, active: true, lastLoginAt: true } },
      projects: {
        select: { id: true, name: true, slug: true, publishStatus: true, active: true, reviewNote: true, updatedAt: true, verifiedAt: true },
      },
    },
  });
  res.json(developers);
});

// POST /api/admin/developers
adminDeveloperRoutes.post('/', async (req: AuthedRequest, res) => {
  const data = pick(req.body ?? {});
  if (!data.name) {
    res.status(400).json({ error: 'El nombre es obligatorio' });
    return;
  }
  const dev = await prisma.developer.create({ data: data as never });
  await audit(req.staff?.staffId, 'create', 'developer', dev.id, { name: dev.name });
  res.status(201).json(dev);
});

// PUT /api/admin/developers/:id
adminDeveloperRoutes.put('/:id', async (req: AuthedRequest, res) => {
  try {
    const dev = await prisma.developer.update({ where: { id: req.params.id }, data: pick(req.body ?? {}) as never });
    await audit(req.staff?.staffId, 'update', 'developer', dev.id);
    res.json(dev);
  } catch {
    res.status(400).json({ error: 'No se pudo actualizar' });
  }
});

// POST /api/admin/developers/:id/users {email, name} — crea el acceso y devuelve
// una contraseña temporal que se muestra UNA sola vez.
adminDeveloperRoutes.post('/:id/users', async (req: AuthedRequest, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    res.status(400).json({ error: 'Correo inválido' });
    return;
  }
  if (await prisma.developerUser.findUnique({ where: { email } })) {
    res.status(409).json({ error: 'Ese correo ya tiene acceso' });
    return;
  }
  const password = tempPassword();
  const user = await prisma.developerUser.create({
    data: { developerId: req.params.id, email, name: req.body?.name || null, password: await bcrypt.hash(password, 10) },
  });
  await audit(req.staff?.staffId, 'create', 'developer_user', user.id, { email });
  res.status(201).json({ id: user.id, email, password });
});

// POST /api/admin/developers/users/:userId/reset — nueva contraseña temporal
adminDeveloperRoutes.post('/users/:userId/reset', async (req: AuthedRequest, res) => {
  const password = tempPassword();
  await prisma.developerUser.update({ where: { id: req.params.userId }, data: { password: await bcrypt.hash(password, 10) } });
  await audit(req.staff?.staffId, 'reset_password', 'developer_user', req.params.userId);
  res.json({ password });
});

// PATCH /api/admin/developers/users/:userId {active}
adminDeveloperRoutes.patch('/users/:userId', async (req: AuthedRequest, res) => {
  const user = await prisma.developerUser.update({
    where: { id: req.params.userId },
    data: { active: Boolean(req.body?.active) },
    select: { id: true, active: true },
  });
  res.json(user);
});

// POST /api/admin/developers/projects/:projectId/review {decision: 'approve'|'reject', note}
adminDeveloperRoutes.post('/projects/:projectId/review', async (req: AuthedRequest, res) => {
  const { decision, note } = req.body ?? {};
  const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });
  if (!project || project.publishStatus !== 'REVIEW') {
    res.status(409).json({ error: 'El proyecto no está en revisión' });
    return;
  }
  const approve = decision === 'approve';
  // Un proyecto de terceros solo se publica con el sello (checklist legal completo).
  if (approve && project.developerId && !project.verifiedAt) {
    res.status(409).json({ error: 'Primero completa la verificación legal del proyecto' });
    return;
  }
  if (!approve && !String(note ?? '').trim()) {
    res.status(400).json({ error: 'Indica qué debe corregir el desarrollador' });
    return;
  }
  const updated = await prisma.project.update({
    where: { id: project.id },
    data: approve
      ? { publishStatus: 'PUBLISHED', active: true, reviewNote: null }
      : { publishStatus: 'DRAFT', active: false, reviewNote: String(note).trim() },
  });
  await audit(req.staff?.staffId, approve ? 'approve' : 'reject', 'project', project.id, { note });
  res.json(updated);
});

// GET /api/admin/developers/leads?projectId= — todos los contactos de proyectos de terceros,
// con el referidor (que el desarrollador no ve).
adminDeveloperRoutes.get('/leads', async (req, res) => {
  const leads = await prisma.projectLead.findMany({
    where: {
      project: { developerId: { not: null } },
      ...(req.query.projectId ? { projectId: String(req.query.projectId) } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: { project: { select: { name: true, developer: { select: { name: true } } } } },
  });
  res.json(leads);
});

// ============================================================
// Ventas de desarrolladores (paso 4)
// ============================================================

// GET /api/admin/developers/sales — todas, con totales, comisiones y referidor
adminDeveloperRoutes.get('/sales', async (_req, res) => {
  const sales = await prisma.developerSale.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      lead: { select: { name: true, phone: true, source: true, referralCode: true } },
      project: { select: { name: true, developer: { select: { name: true } } } },
      installments: {
        orderBy: { paidAt: 'asc' },
        include: { commissions: { select: { amount: true, level: true, member: { select: { fullName: true } } } } },
      },
    },
  });
  const r2 = (n: number) => Math.round(n * 100) / 100;
  res.json(
    sales.map((s) => {
      const totals = saleTotals(s.installments);
      const commissions = s.installments.flatMap((i) => i.commissions).reduce((a, c) => a + c.amount, 0);
      return { ...s, totals: { ...totals, commissions: r2(commissions), net: r2(totals.feeCollected - commissions) } };
    }),
  );
});

// POST /api/admin/developers/sales/:id/review {decision: 'confirm'|'reject'|'cancel', note}
adminDeveloperRoutes.post('/sales/:id/review', async (req: AuthedRequest, res) => {
  const { decision, note } = req.body ?? {};
  const sale = await prisma.developerSale.findUnique({ where: { id: req.params.id } });
  if (!sale) {
    res.status(404).json({ error: 'Venta no encontrada' });
    return;
  }
  if (decision === 'confirm') {
    if (sale.status !== 'DECLARED') {
      res.status(409).json({ error: 'Solo se confirma una venta declarada' });
      return;
    }
    await confirmSale(sale.id);
  } else if (decision === 'reject' || decision === 'cancel') {
    if (!String(note ?? '').trim()) {
      res.status(400).json({ error: 'Escribe el motivo' });
      return;
    }
    if (decision === 'reject') {
      if (sale.status !== 'DECLARED') {
        res.status(409).json({ error: 'Solo se devuelve una venta declarada' });
        return;
      }
      await prisma.developerSale.update({ where: { id: sale.id }, data: { status: 'REJECTED', reviewNote: String(note) } });
    } else {
      await cancelSale(sale.id, String(note));
    }
  } else {
    res.status(400).json({ error: 'Decisión inválida' });
    return;
  }
  await audit(req.staff?.staffId, decision, 'developer_sale', sale.id, { note });
  res.json({ ok: true });
});

// POST /api/admin/developers/installments/:id/collect — Grupo 3i cobró su parte de la cuota
adminDeveloperRoutes.post('/installments/:id/collect', async (req: AuthedRequest, res) => {
  try {
    const r = await collectInstallment(req.params.id);
    await audit(req.staff?.staffId, 'collect', 'sale_installment', req.params.id, r);
    res.json(r);
  } catch (err) {
    res.status(409).json({ error: (err as Error).message });
  }
});

// GET /api/admin/developers/alerts — solares vendidos en proyectos de terceros sin venta declarada
adminDeveloperRoutes.get('/alerts', async (_req, res) => {
  const sold = await prisma.lot.findMany({
    where: { status: 'SOLD', kind: 'LOT', project: { developerId: { not: null } } },
    select: { code: true, projectId: true, updatedAt: true, project: { select: { name: true, developer: { select: { name: true } } } } },
  });
  const sales = await prisma.developerSale.findMany({
    where: { status: { in: ['DECLARED', 'CONFIRMED'] }, lotCode: { not: null } },
    select: { projectId: true, lotCode: true },
  });
  const declared = new Set(sales.map((s) => `${s.projectId}|${s.lotCode}`));
  res.json(sold.filter((l) => !declared.has(`${l.projectId}|${l.code.toUpperCase()}`)));
});

// ============================================================
// Verificación legal (paso 6)
// ============================================================

// GET /api/admin/developers/projects/:projectId/verification — checklist, documentos (URL firmada) y puntaje
adminDeveloperRoutes.get('/projects/:projectId/verification', async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.projectId },
    select: { id: true, name: true, verification: true, verifiedAt: true, documents: { orderBy: { createdAt: 'asc' } } },
  });
  if (!project) {
    res.status(404).json({ error: 'Proyecto no encontrado' });
    return;
  }
  const quality = (await qualityFor([project.id])).get(project.id);
  res.json({
    id: project.id,
    name: project.name,
    checklist: project.verification ?? {},
    verifiedAt: project.verifiedAt,
    labels: CHECKLIST_LABEL,
    quality,
    documents: project.documents.map((d) => ({
      id: d.id,
      kind: d.kind,
      name: d.name,
      uploadedBy: d.uploadedBy,
      createdAt: d.createdAt,
      url: signedDocUrl(d.publicId, d.format),
    })),
  });
});

// PUT /api/admin/developers/projects/:projectId/verification {checklist} — completo → sello
adminDeveloperRoutes.put('/projects/:projectId/verification', async (req: AuthedRequest, res) => {
  const raw = (req.body?.checklist ?? {}) as Record<string, unknown>;
  const checklist = Object.fromEntries(CHECKLIST.map((k) => [k, raw[k] === true]));
  const complete = isChecklistComplete(checklist);
  const current = await prisma.project.findUnique({ where: { id: req.params.projectId }, select: { verifiedAt: true } });
  if (!current) {
    res.status(404).json({ error: 'Proyecto no encontrado' });
    return;
  }
  const project = await prisma.project.update({
    where: { id: req.params.projectId },
    data: { verification: checklist, verifiedAt: complete ? (current.verifiedAt ?? new Date()) : null },
    select: { id: true, verification: true, verifiedAt: true },
  });
  await audit(req.staff?.staffId, complete ? 'verify' : 'unverify', 'project', project.id, checklist);
  res.json(project);
});

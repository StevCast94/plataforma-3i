import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../prisma';
import { requireAdmin, type AuthedRequest } from '../middleware/auth';
import { audit } from '../services/audit';

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
    orderBy: { createdAt: 'desc' },
    include: {
      users: { select: { id: true, email: true, name: true, active: true, lastLoginAt: true } },
      projects: {
        select: { id: true, name: true, slug: true, publishStatus: true, active: true, reviewNote: true, updatedAt: true },
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

import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin, type AuthedRequest } from '../middleware/auth';
import { audit } from '../services/audit';
import { slugify } from '../lib/slug';
import { projectMetrics } from '../services/projectMetrics';
import { cleanPlan } from '../lib/units';
import { Prisma } from '@prisma/client';

export const adminProjectRoutes = Router();
adminProjectRoutes.use(requireAdmin);

// GET /api/admin/projects — incluye inactivos
adminProjectRoutes.get('/', async (req, res) => {
  const { active, q } = req.query;
  const projects = await prisma.project.findMany({
    where: {
      ...(active === 'true' ? { active: true } : active === 'false' ? { active: false } : {}),
      ...(q ? { name: { contains: String(q), mode: 'insensitive' } } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(projects);
});

// POST /api/admin/projects
adminProjectRoutes.post('/', async (req: AuthedRequest, res) => {
  try {
    const data = { ...req.body };
    if (!data.slug && data.name) data.slug = slugify(data.name);
    if ('paymentPlan' in data) data.paymentPlan = cleanPlan(data.paymentPlan) ?? Prisma.DbNull;
    const project = await prisma.project.create({ data });
    await audit(req.staff?.staffId, 'create', 'project', project.id, { name: project.name });
    res.status(201).json(project);
  } catch (err) {
    console.error('POST /api/admin/projects', err);
    res.status(400).json({ error: 'Error al crear el proyecto' });
  }
});

// PUT /api/admin/projects/:id
adminProjectRoutes.put('/:id', async (req: AuthedRequest, res) => {
  try {
    const data = { ...req.body };
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.products;
    // Dominio propio del mapa: minúsculas, sin protocolo ni www; vacío = sin dominio.
    if ('customDomain' in data) {
      const d = String(data.customDomain ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
      data.customDomain = d || null;
    }
    if ('paymentPlan' in data) data.paymentPlan = cleanPlan(data.paymentPlan) ?? Prisma.DbNull;
    if ('mapPaidUntil' in data) data.mapPaidUntil = data.mapPaidUntil ? new Date(data.mapPaidUntil) : null;
    const project = await prisma.project.update({ where: { id: req.params.id }, data });
    await audit(req.staff?.staffId, 'update', 'project', project.id);
    res.json(project);
  } catch (err) {
    console.error('PUT /api/admin/projects/:id', err);
    res.status(400).json({ error: 'Error al actualizar el proyecto' });
  }
});

// DELETE /api/admin/projects/:id — soft delete
adminProjectRoutes.delete('/:id', async (req: AuthedRequest, res) => {
  try {
    await prisma.project.update({ where: { id: req.params.id }, data: { active: false } });
    await audit(req.staff?.staffId, 'delete', 'project', req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/projects/:id', err);
    res.status(400).json({ error: 'Error al desactivar el proyecto' });
  }
});

// GET /api/admin/projects/:id/metrics?days=30 — cualquier proyecto (propios y de terceros)
adminProjectRoutes.get('/:id/metrics', async (req, res) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.id }, select: { id: true, name: true } });
  if (!project) {
    res.status(404).json({ error: 'Proyecto no encontrado' });
    return;
  }
  const days = Math.min(365, Math.max(7, Number(req.query.days) || 30));
  res.json({ project, ...(await projectMetrics(project.id, days)) });
});

import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin, type AuthedRequest } from '../middleware/auth';
import { audit } from '../services/audit';
import { slugify } from '../lib/slug';

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

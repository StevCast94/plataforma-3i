import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';

export const projectRoutes = Router();

// GET /api/projects            -> lista (solo activos por defecto)
// GET /api/projects?all=true   -> todos (admin / preview)
projectRoutes.get('/', async (req, res) => {
  try {
    const all = req.query.all === 'true';
    const projects = await prisma.project.findMany({
      where: all ? undefined : { active: true },
      orderBy: [{ featured: 'desc' }, { createdAt: 'asc' }],
    });
    res.json(projects);
  } catch (err) {
    console.error('GET /api/projects', err);
    res.status(500).json({ error: 'Error al obtener proyectos' });
  }
});

// GET /api/projects/:slug -> detalle por slug
projectRoutes.get('/:slug', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { slug: req.params.slug },
      include: { products: { where: { active: true } } },
    });
    if (!project) {
      res.status(404).json({ error: 'Proyecto no encontrado' });
      return;
    }
    res.json(project);
  } catch (err) {
    console.error('GET /api/projects/:slug', err);
    res.status(500).json({ error: 'Error al obtener el proyecto' });
  }
});

// Campos públicos de un lote — nunca ownerName/ownerPhone/notes (LOPDP,
// datos privados del comprador/vendedor real que nunca deben salir del panel admin).
const publicLotSelect = {
  id: true,
  code: true,
  block: true,
  kind: true,
  status: true,
  geometry: true,
  centroidLat: true,
  centroidLng: true,
  areaM2: true,
  frontM: true,
  depthM: true,
  price: true,
  pricePerM2: true,
  name: true,
  description: true,
  images: true,
} as const;

// GET /api/projects/:slug/lots -> mapa de lotes de un proyecto (público)
projectRoutes.get('/:slug/lots', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { slug: req.params.slug },
      select: { id: true },
    });
    if (!project) {
      res.status(404).json({ error: 'Proyecto no encontrado' });
      return;
    }
    const lots = await prisma.lot.findMany({
      where: { projectId: project.id, active: true },
      select: publicLotSelect,
      orderBy: [{ block: 'asc' }, { code: 'asc' }],
    });
    res.json(lots);
  } catch (err) {
    console.error('GET /api/projects/:slug/lots', err);
    res.status(500).json({ error: 'Error al obtener los lotes' });
  }
});

// POST /api/projects (admin)
projectRoutes.post('/', requireAdmin, async (req, res) => {
  try {
    const project = await prisma.project.create({ data: req.body });
    res.status(201).json(project);
  } catch (err) {
    console.error('POST /api/projects', err);
    res.status(400).json({ error: 'Error al crear el proyecto' });
  }
});

// PUT /api/projects/:id (admin)
projectRoutes.put('/:id', requireAdmin, async (req, res) => {
  try {
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(project);
  } catch (err) {
    console.error('PUT /api/projects/:id', err);
    res.status(400).json({ error: 'Error al actualizar el proyecto' });
  }
});

// DELETE /api/projects/:id (admin)
projectRoutes.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/projects/:id', err);
    res.status(400).json({ error: 'Error al eliminar el proyecto' });
  }
});

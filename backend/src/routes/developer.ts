import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { requireDeveloper, signDeveloperToken, type DeveloperRequest } from '../middleware/authDeveloper';
import { slugify } from '../lib/slug';
import { v2 as cloudinary } from 'cloudinary';

if (process.env.CLOUDINARY_URL) cloudinary.config({ secure: true });

// Portal del desarrollador. Cada desarrollador arma sus proyectos como BORRADOR y los
// envía a revisión; solo Grupo 3i los publica (adminDevelopers).
export const developerRoutes = Router();

// Campos que el desarrollador puede editar. Visibilidad, destaque, comisión y
// estado de publicación los controla Grupo 3i.
const EDITABLE = [
  'name', 'subtitle', 'description', 'location', 'coverImage', 'images', 'features',
  'priceFrom', 'priceLabel', 'mapLat', 'mapLng',
] as const;

function pick(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  for (const k of EDITABLE) if (k in body) data[k] = body[k];
  for (const k of ['priceFrom', 'mapLat', 'mapLng'] as const) {
    if (data[k] === '') data[k] = null;
    else if (data[k] != null) data[k] = Number(data[k]);
  }
  return data;
}

// POST /api/developer/login
developerRoutes.post('/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  if (!email || !password) {
    res.status(400).json({ error: 'Correo y contraseña requeridos' });
    return;
  }
  const user = await prisma.developerUser.findUnique({ where: { email }, include: { developer: true } });
  if (!user || !user.active || user.developer.status === 'SUSPENDED' || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }
  await prisma.developerUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  res.json({ token: signDeveloperToken(user.id, user.developerId) });
});

developerRoutes.use(requireDeveloper);

// GET /api/developer/me — usuario, empresa y condiciones comerciales
developerRoutes.get('/me', async (req: DeveloperRequest, res) => {
  const user = await prisma.developerUser.findUnique({
    where: { id: req.developerUserId },
    select: {
      id: true, email: true, name: true,
      developer: {
        select: {
          id: true, name: true, status: true, whatsapp: true, commissionRate: true,
          ownLeadRate: true, onboardingFee: true, onboardingPaid: true, featuredUntil: true,
        },
      },
    },
  });
  res.json(user);
});

// POST /api/developer/password {current, next}
developerRoutes.post('/password', async (req: DeveloperRequest, res) => {
  const { current, next } = req.body ?? {};
  if (!next || String(next).length < 8) {
    res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
    return;
  }
  const user = await prisma.developerUser.findUnique({ where: { id: req.developerUserId } });
  if (!user || !(await bcrypt.compare(String(current ?? ''), user.password))) {
    res.status(400).json({ error: 'La contraseña actual no es correcta' });
    return;
  }
  await prisma.developerUser.update({ where: { id: user.id }, data: { password: await bcrypt.hash(String(next), 10) } });
  res.json({ ok: true });
});

// GET /api/developer/projects
developerRoutes.get('/projects', async (req: DeveloperRequest, res) => {
  const projects = await prisma.project.findMany({
    where: { developerId: req.developerId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { lots: true, panoramas: true } } },
  });
  res.json(projects);
});

function ownProject(req: DeveloperRequest) {
  return prisma.project.findFirst({ where: { id: req.params.id, developerId: req.developerId } });
}

// GET /api/developer/projects/:id
developerRoutes.get('/projects/:id', async (req: DeveloperRequest, res) => {
  const project = await ownProject(req);
  if (!project) {
    res.status(404).json({ error: 'Proyecto no encontrado' });
    return;
  }
  res.json(project);
});

// POST /api/developer/projects — crea un borrador (oculto al público)
developerRoutes.post('/projects', async (req: DeveloperRequest, res) => {
  const data = pick(req.body ?? {});
  const name = String(data.name ?? '').trim();
  if (!name) {
    res.status(400).json({ error: 'El nombre del proyecto es obligatorio' });
    return;
  }
  // Slug único: si ya existe, se le agrega un sufijo.
  const base = slugify(name) || 'proyecto';
  let slug = base;
  for (let i = 2; await prisma.project.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;
  const project = await prisma.project.create({
    data: {
      ...data,
      name,
      description: String(data.description ?? ''),
      slug,
      developerId: req.developerId,
      publishStatus: 'DRAFT',
      active: false,
    } as never,
  });
  res.status(201).json(project);
});

// PUT /api/developer/projects/:id — un proyecto publicado sigue publicado al editarlo;
// mientras está en revisión no se puede tocar.
developerRoutes.put('/projects/:id', async (req: DeveloperRequest, res) => {
  const project = await ownProject(req);
  if (!project) {
    res.status(404).json({ error: 'Proyecto no encontrado' });
    return;
  }
  if (project.publishStatus === 'REVIEW') {
    res.status(409).json({ error: 'El proyecto está en revisión; espera la respuesta de Grupo 3i' });
    return;
  }
  const updated = await prisma.project.update({ where: { id: project.id }, data: pick(req.body ?? {}) as never });
  res.json(updated);
});

// POST /api/developer/projects/:id/submit — enviar a revisión
developerRoutes.post('/projects/:id/submit', async (req: DeveloperRequest, res) => {
  const project = await ownProject(req);
  if (!project) {
    res.status(404).json({ error: 'Proyecto no encontrado' });
    return;
  }
  if (project.publishStatus !== 'DRAFT') {
    res.status(409).json({ error: 'Solo se puede enviar un borrador' });
    return;
  }
  const missing: string[] = [];
  if (project.description.trim().length < 80) missing.push('descripción (mínimo 80 caracteres)');
  if (!project.coverImage) missing.push('imagen de portada');
  if (!project.location) missing.push('ubicación');
  if (missing.length) {
    res.status(400).json({ error: `Falta completar: ${missing.join(', ')}` });
    return;
  }
  const updated = await prisma.project.update({
    where: { id: project.id },
    data: { publishStatus: 'REVIEW', reviewNote: null },
  });
  res.json(updated);
});

// POST /api/developer/projects/:id/pause {paused} — retirar o volver a mostrar
developerRoutes.post('/projects/:id/pause', async (req: DeveloperRequest, res) => {
  const project = await ownProject(req);
  if (!project || !['PUBLISHED', 'PAUSED'].includes(project.publishStatus)) {
    res.status(409).json({ error: 'Solo un proyecto publicado se puede pausar' });
    return;
  }
  const paused = Boolean(req.body?.paused);
  const updated = await prisma.project.update({
    where: { id: project.id },
    data: { publishStatus: paused ? 'PAUSED' : 'PUBLISHED', active: !paused },
  });
  res.json(updated);
});

// POST /api/developer/upload-image {dataUri} — fotos de sus proyectos
developerRoutes.post('/upload-image', async (req: DeveloperRequest, res) => {
  try {
    const { dataUri } = req.body ?? {};
    if (!process.env.CLOUDINARY_URL || typeof dataUri !== 'string') {
      res.status(400).json({ error: 'Imagen inválida' });
      return;
    }
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `grupo3i/desarrolladores/${req.developerId}`,
      resource_type: 'image',
      transformation: [{ width: 2400, height: 2400, crop: 'limit', quality: 'auto:good' }],
    });
    res.json({ url: result.secure_url });
  } catch (err) {
    console.error('POST /api/developer/upload-image', err);
    res.status(500).json({ error: 'Error al subir la imagen' });
  }
});

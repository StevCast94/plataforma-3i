import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';
import { refFromRequest } from './referral';
import { registerLead, leadWhatsapp, phoneDigits } from '../services/projectLeads';
import { qualityFor } from '../services/projectQuality';

export const projectRoutes = Router();

/** Proyecto para el público: sin el checklist legal interno, con el sello como booleano. */
function publicProject<T extends { verification?: unknown; verifiedAt: Date | null; developerId: string | null; developer?: unknown }>(p: T, qualityScore?: number) {
  const { verification: _v, developer: _d, ...rest } = p;
  return { ...rest, verified: Boolean(p.developerId && p.verifiedAt), ...(qualityScore != null ? { qualityScore } : {}) };
}

// GET /api/projects            -> lista (solo activos por defecto)
// GET /api/projects?all=true   -> todos (admin / preview)
projectRoutes.get('/', async (req, res) => {
  try {
    const all = req.query.all === 'true';
    const projects = await prisma.project.findMany({
      // Borradores y proyectos en revisión de desarrolladores nunca salen al público.
      where: all ? { publishStatus: { in: ['PUBLISHED', 'PAUSED'] } } : { active: true, publishStatus: 'PUBLISHED' },
      orderBy: [{ featured: 'desc' }, { createdAt: 'asc' }],
      include: { developer: { select: { featuredUntil: true } } },
    });
    // Orden de la portada: destacados (propio o pagado por el desarrollador), luego puntaje de calidad.
    const quality = await qualityFor(projects.map((p) => p.id));
    const now = Date.now();
    const isFeatured = (p: (typeof projects)[number]) => p.featured || (p.developer?.featuredUntil?.getTime() ?? 0) > now;
    const rows = projects
      .map((p) => ({ p, score: quality.get(p.id)?.score ?? 0 }))
      .sort((a, b) => Number(isFeatured(b.p)) - Number(isFeatured(a.p)) || b.score - a.score);
    res.json(rows.map(({ p, score }) => publicProject(p, score)));
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
    if (!project || project.publishStatus === 'DRAFT' || project.publishStatus === 'REVIEW') {
      res.status(404).json({ error: 'Proyecto no encontrado' });
      return;
    }
    res.json(publicProject(project));
  } catch (err) {
    console.error('GET /api/projects/:slug', err);
    res.status(500).json({ error: 'Error al obtener el proyecto' });
  }
});

// Campos públicos de un lote (la clave catastral es dato público) — nunca ownerName/ownerPhone/notes (LOPDP,
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
  cashOnly: true,
  name: true,
  description: true,
  images: true,
  cadastralCode: true,
  details: true,
} as const;

// GET /api/projects/:slug/panoramas -> vistas 360° activas del proyecto (público)
projectRoutes.get('/:slug/panoramas', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { slug: req.params.slug }, select: { id: true } });
    if (!project) {
      res.status(404).json({ error: 'Proyecto no encontrado' });
      return;
    }
    const rows = await prisma.panorama.findMany({
      where: { projectId: project.id, active: true },
      select: { id: true, title: true, description: true, lat: true, lng: true, tiles: true, northYaw: true, altitude: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(rows);
  } catch (err) {
    console.error('GET /api/projects/:slug/panoramas', err);
    res.status(500).json({ error: 'Error al obtener las vistas 360°' });
  }
});

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
      select: { ...publicLotSelect, notes: true },
      orderBy: [{ block: 'asc' }, { code: 'asc' }],
    });
    // `notes` es privado: solo se usa aquí para derivar si la geometría es
    // aproximada (lote sin levantamiento en GEO 3i) y NO se envía al cliente.
    res.json(
      lots.map(({ notes, ...lot }) => ({
        ...lot,
        approximateGeometry: !!notes?.includes('Geometría aproximada'),
      })),
    );
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

// ============================================================
// Contactos y eventos por proyecto (vitrina de desarrolladores)
// ============================================================

const EVENT_TYPES = new Set(['view', 'lot_view', 'pano_open', 'wa_click', 'share', 'brochure']);

async function publicProjectId(slug: string): Promise<string | null> {
  const p = await prisma.project.findUnique({ where: { slug }, select: { id: true, publishStatus: true } });
  return p && p.publishStatus === 'PUBLISHED' ? p.id : null;
}

// POST /api/projects/:slug/events {type, lotCode?, visitorId?, lang?} — métricas, sin auth
projectRoutes.post('/:slug/events', async (req, res) => {
  try {
    const { type, lotCode, visitorId, lang } = req.body ?? {};
    if (!EVENT_TYPES.has(String(type))) {
      res.status(400).json({ error: 'Tipo inválido' });
      return;
    }
    const projectId = await publicProjectId(req.params.slug);
    if (!projectId) {
      res.status(404).json({ error: 'Proyecto no encontrado' });
      return;
    }
    const ua = String(req.headers['user-agent'] ?? '');
    if (/bot|crawler|spider|facebookexternalhit|whatsapp/i.test(ua)) {
      res.json({ ok: true });
      return;
    }
    await prisma.projectEvent.create({
      data: {
        projectId,
        type: String(type),
        lotCode: lotCode ? String(lotCode).slice(0, 40) : null,
        visitorId: visitorId ? String(visitorId).slice(0, 64) : null,
        refCode: refFromRequest(req),
        lang: lang ? String(lang).slice(0, 5) : null,
        device: /Mobi|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop',
      },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/projects/:slug/events', err);
    res.status(500).json({ error: 'Error' });
  }
});

// POST /api/projects/:slug/leads {name, phone, email?, message?, lotCode?, channel, visitorId?, lang?}
// Registra el contacto y devuelve el WhatsApp al que se deriva.
projectRoutes.post('/:slug/leads', async (req, res) => {
  try {
    const { name, phone, email, message, lotCode, channel, visitorId, lang } = req.body ?? {};
    if (!name || !String(name).trim() || phoneDigits(String(phone ?? '')).length < 8) {
      res.status(400).json({ error: 'Nombre y WhatsApp son obligatorios' });
      return;
    }
    const projectId = await publicProjectId(req.params.slug);
    if (!projectId) {
      res.status(404).json({ error: 'Proyecto no encontrado' });
      return;
    }
    const { lead } = await registerLead({
      projectId,
      name: String(name),
      phone: String(phone),
      email: email ? String(email) : null,
      message: message ? String(message).slice(0, 2000) : null,
      lotCode: lotCode ? String(lotCode).slice(0, 40) : null,
      channel: channel === 'form' ? 'form' : 'whatsapp',
      referralCode: refFromRequest(req),
      visitorId: visitorId ? String(visitorId).slice(0, 64) : null,
      lang: lang ? String(lang).slice(0, 5) : null,
    });
    res.status(201).json({ ok: true, leadId: lead.id, whatsapp: await leadWhatsapp(projectId) });
  } catch (err) {
    console.error('POST /api/projects/:slug/leads', err);
    res.status(500).json({ error: 'No se pudo registrar el contacto' });
  }
});

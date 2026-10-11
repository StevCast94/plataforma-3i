import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { requireDeveloper, signDeveloperToken, type DeveloperRequest } from '../middleware/authDeveloper';
import { slugify } from '../lib/slug';
import { registerLead, phoneDigits } from '../services/projectLeads';
import { feeRateForLead, installmentFee, saleTotals } from '../services/developerSales';
import { projectMetrics } from '../services/projectMetrics';
import { qualityFor } from '../services/projectQuality';
import { DOC_KINDS, uploadProjectDocument } from '../lib/projectDocs';
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

// POST /api/developer/apply — solicitud pública desde «Publica tu proyecto».
// Crea el desarrollador en estado PENDING (sin acceso); Grupo 3i lo contacta y le crea el acceso.
developerRoutes.post('/apply', async (req, res) => {
  const b = req.body ?? {};
  if (b.website) {
    res.json({ ok: true }); // trampa para robots
    return;
  }
  const name = String(b.company ?? '').trim();
  const contactName = String(b.name ?? '').trim();
  const whatsapp = String(b.whatsapp ?? '').trim();
  if (!name || !contactName || phoneDigits(whatsapp).length < 8) {
    res.status(400).json({ error: 'Empresa, nombre y WhatsApp son obligatorios' });
    return;
  }
  // Una solicitud por número al día: evita duplicados por doble envío.
  const recent = await prisma.developer.count({ where: { whatsapp, createdAt: { gte: new Date(Date.now() - 86400_000) } } });
  if (!recent) {
    const lines = [
      b.project && `Proyecto: ${String(b.project).slice(0, 200)}`,
      b.location && `Ubicación: ${String(b.location).slice(0, 200)}`,
      b.units && `Unidades: ${String(b.units).slice(0, 50)}`,
      b.message && `Mensaje: ${String(b.message).slice(0, 2000)}`,
      `Solicitud web ${new Date().toISOString().slice(0, 10)}${b.lang ? ` (${String(b.lang).slice(0, 2)})` : ''}`,
    ].filter(Boolean);
    await prisma.developer.create({
      data: {
        name: name.slice(0, 120),
        contactName: contactName.slice(0, 120),
        whatsapp: whatsapp.slice(0, 40),
        email: b.email ? String(b.email).trim().slice(0, 160) : null,
        status: 'PENDING',
        notes: lines.join('\n'),
      },
    });
  }
  res.status(201).json({ ok: true });
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

// ============================================================
// Contactos (paso 2). El desarrollador ve los contactos de SUS proyectos y puede
// registrar los propios (comisión reducida). No ve quién es el referidor.
// ============================================================

const LEAD_STATUSES = ['NEW', 'CONTACTED', 'VISIT', 'NEGOTIATION', 'WON', 'LOST'] as const;

// GET /api/developer/leads?projectId=
developerRoutes.get('/leads', async (req: DeveloperRequest, res) => {
  const leads = await prisma.projectLead.findMany({
    where: {
      project: { developerId: req.developerId },
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
developerRoutes.post('/projects/:id/leads', async (req: DeveloperRequest, res) => {
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
  res.status(201).json(lead);
});

// PATCH /api/developer/leads/:leadId {status?, notes?}
developerRoutes.patch('/leads/:leadId', async (req: DeveloperRequest, res) => {
  const lead = await prisma.projectLead.findFirst({
    where: { id: req.params.leadId, project: { developerId: req.developerId } },
  });
  if (!lead) {
    res.status(404).json({ error: 'Contacto no encontrado' });
    return;
  }
  const { status, notes } = req.body ?? {};
  const data: { status?: (typeof LEAD_STATUSES)[number]; notes?: string | null } = {};
  if (status !== undefined) {
    if (!LEAD_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Estado inválido' });
      return;
    }
    data.status = status;
  }
  if (notes !== undefined) data.notes = notes ? String(notes).slice(0, 4000) : null;
  const updated = await prisma.projectLead.update({ where: { id: lead.id }, data });
  res.json(updated);
});

// ============================================================
// Lotes y vistas 360° (paso 3). Mismas rutas que el admin (sin /admin) para que
// el portal reutilice sus pantallas; todo se limita a los proyectos del desarrollador.
// La geometría de los lotes la carga Grupo 3i (DWG/GEO 3i); aquí solo lo comercial.
// ============================================================

async function ownsProject(req: DeveloperRequest, projectId: unknown) {
  if (!projectId) return false;
  return Boolean(await prisma.project.findFirst({ where: { id: String(projectId), developerId: req.developerId }, select: { id: true } }));
}

const LOT_FIELDS = ['status', 'price', 'pricePerM2', 'cashOnly', 'cadastralCode', 'ownerName', 'ownerPhone', 'notes', 'name', 'images', 'description', 'reservedUntil'] as const;

// GET /api/developer/lots?projectId=&status=&block=&q=
developerRoutes.get('/lots', async (req: DeveloperRequest, res) => {
  const { projectId, status, block, q } = req.query;
  if (!(await ownsProject(req, projectId))) {
    res.status(404).json({ error: 'Proyecto no encontrado' });
    return;
  }
  const lots = await prisma.lot.findMany({
    where: {
      projectId: String(projectId),
      ...(status ? { status: status as never } : {}),
      ...(block ? { block: String(block) } : {}),
      ...(q ? { code: { contains: String(q), mode: 'insensitive' as const } } : {}),
    },
    orderBy: [{ block: 'asc' }, { code: 'asc' }],
  });
  res.json(lots);
});

// PUT /api/developer/lots/:id — solo datos comerciales
developerRoutes.put('/lots/:id', async (req: DeveloperRequest, res) => {
  const lot = await prisma.lot.findFirst({ where: { id: req.params.id, project: { developerId: req.developerId } } });
  if (!lot) {
    res.status(404).json({ error: 'Lote no encontrado' });
    return;
  }
  const data: Record<string, unknown> = {};
  for (const k of LOT_FIELDS) if (k in (req.body ?? {})) data[k] = req.body[k];
  if (data.status && !['AVAILABLE', 'RESERVED', 'SOLD', 'NOT_FOR_SALE'].includes(String(data.status))) {
    res.status(400).json({ error: 'Estado inválido' });
    return;
  }
  try {
    const updated = await prisma.lot.update({ where: { id: lot.id }, data: data as never });
    res.json(updated);
  } catch (err) {
    console.error('PUT /api/developer/lots/:id', err);
    res.status(400).json({ error: 'Error al actualizar el lote' });
  }
});

/** { baseUrl, levels: [{ width, cols, rows, tiles: string[] }] } */
function validTiles(t: unknown): boolean {
  const x = t as { baseUrl?: unknown; levels?: { width?: number; cols?: number; rows?: number; tiles?: unknown[] }[] };
  return Boolean(
    x && typeof x.baseUrl === 'string' && Array.isArray(x.levels) && x.levels.length > 0 &&
      x.levels.every((l) => l.width && l.cols && l.rows && Array.isArray(l.tiles) && l.tiles.length === l.cols * l.rows),
  );
}
const num = (v: unknown) => (v === null || v === '' || v === undefined ? null : Number.isFinite(Number(v)) ? Number(v) : null);

// GET /api/developer/panoramas?projectId=
developerRoutes.get('/panoramas', async (req: DeveloperRequest, res) => {
  if (!(await ownsProject(req, req.query.projectId))) {
    res.status(404).json({ error: 'Proyecto no encontrado' });
    return;
  }
  res.json(
    await prisma.panorama.findMany({
      where: { projectId: String(req.query.projectId) },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    }),
  );
});

// POST /api/developer/panoramas
developerRoutes.post('/panoramas', async (req: DeveloperRequest, res) => {
  const { projectId, title, description, lat, lng, tiles, northYaw, altitude } = req.body ?? {};
  if (!(await ownsProject(req, projectId)) || !title || !validTiles(tiles)) {
    res.status(400).json({ error: 'Proyecto, título y mosaicos son requeridos' });
    return;
  }
  const count = await prisma.panorama.count({ where: { projectId } });
  const p = await prisma.panorama.create({
    data: {
      projectId,
      title: String(title),
      description: description ? String(description) : null,
      lat: num(lat),
      lng: num(lng),
      tiles,
      northYaw: num(northYaw) ?? 0,
      altitude: num(altitude),
      sortOrder: count,
    },
  });
  res.json(p);
});

async function ownPanorama(req: DeveloperRequest) {
  return prisma.panorama.findFirst({ where: { id: req.params.id, project: { developerId: req.developerId } } });
}

// PATCH /api/developer/panoramas/:id
developerRoutes.patch('/panoramas/:id', async (req: DeveloperRequest, res) => {
  if (!(await ownPanorama(req))) {
    res.status(404).json({ error: 'Vista no encontrada' });
    return;
  }
  const b = req.body ?? {};
  const data: Record<string, unknown> = {};
  if (b.title !== undefined) data.title = String(b.title);
  if (b.description !== undefined) data.description = b.description ? String(b.description) : null;
  for (const k of ['lat', 'lng', 'altitude'] as const) if (b[k] !== undefined) data[k] = num(b[k]);
  if (b.northYaw !== undefined) data.northYaw = num(b.northYaw) ?? 0;
  if (b.sortOrder !== undefined) data.sortOrder = Number(b.sortOrder) || 0;
  if (b.active !== undefined) data.active = Boolean(b.active);
  res.json(await prisma.panorama.update({ where: { id: req.params.id }, data }));
});

// DELETE /api/developer/panoramas/:id
developerRoutes.delete('/panoramas/:id', async (req: DeveloperRequest, res) => {
  if (!(await ownPanorama(req))) {
    res.status(404).json({ error: 'Vista no encontrada' });
    return;
  }
  await prisma.panorama.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// POST /api/developer/seed-images {dataUri} — mosaicos 360° y fotos de lotes.
// La carpeta la fija el servidor: un desarrollador no escribe fuera de la suya.
developerRoutes.post('/seed-images', async (req: DeveloperRequest, res) => {
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
    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error('POST /api/developer/seed-images', err);
    res.status(500).json({ error: 'Error al subir la imagen' });
  }
});

// ============================================================
// Ventas (paso 4). El desarrollador declara la venta de un contacto y registra
// cada pago del comprador; Grupo 3i confirma y cobra su parte por cuota.
// ============================================================

const SALE_INCLUDE = {
  lead: { select: { name: true, phone: true, source: true } },
  project: { select: { name: true } },
  installments: { orderBy: { paidAt: 'asc' as const } },
};

function withTotals<T extends { installments: Parameters<typeof saleTotals>[0] }>(s: T) {
  return { ...s, totals: saleTotals(s.installments) };
}

// GET /api/developer/sales
developerRoutes.get('/sales', async (req: DeveloperRequest, res) => {
  const sales = await prisma.developerSale.findMany({
    where: { project: { developerId: req.developerId } },
    orderBy: { createdAt: 'desc' },
    include: SALE_INCLUDE,
  });
  res.json(sales.map(withTotals));
});

// POST /api/developer/sales {leadId, lotCode?, price, paymentType, firstPayment?, paidAt?, receiptUrl?, notes?}
developerRoutes.post('/sales', async (req: DeveloperRequest, res) => {
  const b = req.body ?? {};
  const lead = await prisma.projectLead.findFirst({ where: { id: String(b.leadId ?? ''), project: { developerId: req.developerId } } });
  if (!lead) {
    res.status(404).json({ error: 'Contacto no encontrado' });
    return;
  }
  const price = Number(b.price);
  const paymentType = b.paymentType === 'FINANCED' ? 'FINANCED' : 'CASH';
  const firstPayment = paymentType === 'CASH' ? price : Number(b.firstPayment ?? 0);
  if (!(price > 0) || !(firstPayment >= 0) || firstPayment > price) {
    res.status(400).json({ error: 'Revisa el precio y el primer pago' });
    return;
  }
  const lotCode = b.lotCode ? String(b.lotCode).trim().toUpperCase() : null;
  if (lotCode) {
    const dup = await prisma.developerSale.findFirst({
      where: { projectId: lead.projectId, lotCode, status: { in: ['DECLARED', 'CONFIRMED'] } },
    });
    if (dup) {
      res.status(409).json({ error: `El solar ${lotCode} ya tiene una venta declarada` });
      return;
    }
  }
  const feeRate = await feeRateForLead(lead.id);
  const paidAt = b.paidAt ? new Date(b.paidAt) : new Date();
  const sale = await prisma.developerSale.create({
    data: {
      projectId: lead.projectId,
      leadId: lead.id,
      lotCode,
      price,
      paymentType,
      feeRate,
      receiptUrl: b.receiptUrl || null,
      notes: b.notes ? String(b.notes).slice(0, 4000) : null,
      installments:
        firstPayment > 0
          ? { create: { amount: firstPayment, feeAmount: installmentFee(firstPayment, feeRate), paidAt, receiptUrl: b.receiptUrl || null } }
          : undefined,
    },
    include: SALE_INCLUDE,
  });
  await prisma.projectLead.update({ where: { id: lead.id }, data: { status: 'NEGOTIATION' } });
  res.status(201).json(withTotals(sale));
});

// POST /api/developer/sales/:id/installments {amount, paidAt?, receiptUrl?} — un pago del comprador
developerRoutes.post('/sales/:id/installments', async (req: DeveloperRequest, res) => {
  const sale = await prisma.developerSale.findFirst({
    where: { id: req.params.id, project: { developerId: req.developerId } },
    include: { installments: true },
  });
  if (!sale || !['DECLARED', 'CONFIRMED'].includes(sale.status)) {
    res.status(409).json({ error: 'La venta no admite pagos' });
    return;
  }
  const amount = Number(req.body?.amount);
  const { paid } = saleTotals(sale.installments);
  if (!(amount > 0) || paid + amount > sale.price + 0.01) {
    res.status(400).json({ error: `El pago supera el saldo pendiente ($${(sale.price - paid).toLocaleString('en-US')})` });
    return;
  }
  const inst = await prisma.saleInstallment.create({
    data: {
      saleId: sale.id,
      amount,
      feeAmount: installmentFee(amount, sale.feeRate),
      paidAt: req.body?.paidAt ? new Date(req.body.paidAt) : new Date(),
      receiptUrl: req.body?.receiptUrl || null,
    },
  });
  res.status(201).json(inst);
});

// GET /api/developer/projects/:id/metrics?days=30 (paso 5)
developerRoutes.get('/projects/:id/metrics', async (req: DeveloperRequest, res) => {
  const project = await ownProject(req);
  if (!project) {
    res.status(404).json({ error: 'Proyecto no encontrado' });
    return;
  }
  const days = Math.min(365, Math.max(7, Number(req.query.days) || 30));
  res.json({ project: { id: project.id, name: project.name }, ...(await projectMetrics(project.id, days)) });
});

// ============================================================
// Calidad y documentos legales (paso 6)
// ============================================================

// GET /api/developer/projects/:id/quality — puntaje, qué falta y documentos subidos (sin URL)
developerRoutes.get('/projects/:id/quality', async (req: DeveloperRequest, res) => {
  const project = await ownProject(req);
  if (!project) {
    res.status(404).json({ error: 'Proyecto no encontrado' });
    return;
  }
  const quality = (await qualityFor([project.id])).get(project.id);
  const documents = await prisma.projectDocument.findMany({
    where: { projectId: project.id },
    select: { id: true, kind: true, name: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ ...quality, verifiedAt: project.verifiedAt, documents });
});

// POST /api/developer/projects/:id/documents {dataUri, kind, name}
developerRoutes.post('/projects/:id/documents', async (req: DeveloperRequest, res) => {
  const project = await ownProject(req);
  if (!project) {
    res.status(404).json({ error: 'Proyecto no encontrado' });
    return;
  }
  const { dataUri, kind, name } = req.body ?? {};
  if (typeof dataUri !== 'string' || !DOC_KINDS.includes(kind)) {
    res.status(400).json({ error: 'Documento inválido' });
    return;
  }
  try {
    const { publicId, format } = await uploadProjectDocument(dataUri, project.id);
    const doc = await prisma.projectDocument.create({
      data: { projectId: project.id, kind, name: String(name || kind).slice(0, 120), publicId, format, uploadedBy: 'developer' },
      select: { id: true, kind: true, name: true, createdAt: true },
    });
    res.status(201).json(doc);
  } catch (err) {
    console.error('POST /api/developer/projects/:id/documents', err);
    res.status(500).json({ error: 'No se pudo subir el documento' });
  }
});

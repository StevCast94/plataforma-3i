import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin, type AuthedRequest } from '../middleware/auth';
import { audit } from '../services/audit';
import { assignTrees, newAdoptionCode, nextTreeNumber, treeCode } from '../lib/bosque';

// Panel del Bosque. Lo usan el rol "bosque" (Génesis) y los admins generales.
export const adminBosqueRoutes = Router();
adminBosqueRoutes.use(requireAdmin);

const CATEGORIES = ['NATIVE', 'FRUIT', 'MONUMENTAL'];

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------- Resumen ----------------
adminBosqueRoutes.get('/summary', async (_req, res) => {
  const [pending, confirmed, trees, adopted, planted, pendingAssign] = await Promise.all([
    prisma.treeAdoption.count({ where: { status: 'pending' } }),
    prisma.treeAdoption.aggregate({ where: { status: 'confirmed' }, _sum: { quantity: true, amount: true } }),
    prisma.tree.count(),
    prisma.tree.count({ where: { status: 'ADOPTED' } }),
    prisma.tree.count({ where: { plantedAt: { not: null } } }),
    prisma.treeAdoption.findMany({
      where: { status: 'confirmed' },
      select: { quantity: true, _count: { select: { trees: true } } },
    }),
  ]);
  res.json({
    pending,
    confirmedTrees: confirmed._sum.quantity ?? 0,
    revenue: confirmed._sum.amount ?? 0,
    trees,
    adopted,
    planted,
    toAssign: pendingAssign.reduce((n, a) => n + Math.max(0, a.quantity - a._count.trees), 0),
  });
});

// ---------------- Especies ----------------
adminBosqueRoutes.get('/species', async (_req, res) => {
  const species = await prisma.treeSpecies.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { trees: true } } },
  });
  res.json(species);
});

function speciesData(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  if (body.name != null) data.name = String(body.name).trim();
  if (body.scientificName !== undefined) data.scientificName = body.scientificName ? String(body.scientificName).trim() : null;
  if (body.category != null && CATEGORIES.includes(String(body.category))) data.category = String(body.category);
  if (body.description != null) data.description = String(body.description);
  if (body.price != null) data.price = Math.max(0, Number(body.price) || 0);
  if (body.image !== undefined) data.image = body.image ? String(body.image) : null;
  if (body.active != null) data.active = !!body.active;
  if (body.sortOrder != null) data.sortOrder = parseInt(String(body.sortOrder), 10) || 0;
  return data;
}

adminBosqueRoutes.post('/species', async (req: AuthedRequest, res) => {
  try {
    const data = speciesData(req.body ?? {});
    if (!data.name || !data.category) {
      res.status(400).json({ error: 'Nombre y categoría son obligatorios' });
      return;
    }
    const sp = await prisma.treeSpecies.create({
      data: {
        name: data.name as string,
        category: data.category as string,
        description: (data.description as string) ?? '',
        price: (data.price as number) ?? 0,
        scientificName: (data.scientificName as string | null) ?? null,
        image: (data.image as string | null) ?? null,
        sortOrder: (data.sortOrder as number) ?? 0,
        slug: slugify(data.name as string) || `especie-${Date.now()}`,
      },
    });
    await audit(req.staff?.staffId, 'create', 'treeSpecies', sp.id, { name: sp.name });
    res.status(201).json(sp);
  } catch (err) {
    console.error('POST /api/admin/bosque/species', err);
    res.status(400).json({ error: 'No se pudo crear la especie (¿nombre repetido?)' });
  }
});

adminBosqueRoutes.put('/species/:id', async (req: AuthedRequest, res) => {
  try {
    const sp = await prisma.treeSpecies.update({ where: { id: req.params.id }, data: speciesData(req.body ?? {}) });
    await audit(req.staff?.staffId, 'update', 'treeSpecies', sp.id, { name: sp.name, price: sp.price });
    res.json(sp);
  } catch (err) {
    console.error('PUT /api/admin/bosque/species/:id', err);
    res.status(400).json({ error: 'No se pudo actualizar la especie' });
  }
});

// ---------------- Adopciones ----------------
adminBosqueRoutes.get('/adoptions', async (req, res) => {
  const status = req.query.status ? String(req.query.status) : undefined;
  const adoptions = await prisma.treeAdoption.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: 'desc' },
    take: 300,
    include: {
      species: { select: { name: true } },
      trees: { select: { code: true }, orderBy: { code: 'asc' } },
    },
  });
  res.json(adoptions);
});

// POST /api/admin/bosque/adoptions — alta manual (cortesía, venta presencial, empresa)
adminBosqueRoutes.post('/adoptions', async (req: AuthedRequest, res) => {
  try {
    const b = req.body ?? {};
    const name = String(b.customerName ?? '').trim();
    if (!name) {
      res.status(400).json({ error: 'El nombre es obligatorio' });
      return;
    }
    const species = b.speciesId ? await prisma.treeSpecies.findUnique({ where: { id: String(b.speciesId) } }) : null;
    const qty = Math.min(Math.max(parseInt(String(b.quantity ?? 1), 10) || 1, 1), 1000);
    const confirmed = b.status !== 'pending';
    const a = await prisma.treeAdoption.create({
      data: {
        code: await newAdoptionCode(),
        speciesId: species?.id ?? null,
        quantity: qty,
        amount: b.amount != null ? Math.max(0, Number(b.amount) || 0) : (species?.price ?? 0) * qty,
        status: confirmed ? 'confirmed' : 'pending',
        confirmedAt: confirmed ? new Date() : null,
        customerName: name,
        customerEmail: b.customerEmail ? String(b.customerEmail).trim() : null,
        customerPhone: b.customerPhone ? String(b.customerPhone).trim() : null,
        dedication: b.dedication ? String(b.dedication).trim() : null,
        message: b.message ? String(b.message) : null,
        referralCode: b.referralCode ? String(b.referralCode).trim().toUpperCase() : null,
        source: ['web', 'solar', 'cortesia'].includes(b.source) ? b.source : 'cortesia',
      },
    });
    if (confirmed) await assignTrees(a.id);
    await audit(req.staff?.staffId, 'create', 'treeAdoption', a.id, { code: a.code, quantity: a.quantity });
    res.status(201).json(a);
  } catch (err) {
    console.error('POST /api/admin/bosque/adoptions', err);
    res.status(400).json({ error: 'No se pudo crear la adopción' });
  }
});

// PUT /api/admin/bosque/adoptions/:id — confirmar pago, cancelar o corregir datos
adminBosqueRoutes.put('/adoptions/:id', async (req: AuthedRequest, res) => {
  try {
    const b = req.body ?? {};
    const current = await prisma.treeAdoption.findUnique({ where: { id: req.params.id } });
    if (!current) {
      res.status(404).json({ error: 'Adopción no encontrada' });
      return;
    }
    const data: Record<string, unknown> = {};
    for (const k of ['customerName', 'customerEmail', 'customerPhone', 'dedication', 'message']) {
      if (b[k] !== undefined) data[k] = b[k] ? String(b[k]).trim() : null;
    }
    if (b.speciesId !== undefined) data.speciesId = b.speciesId || null;
    if (b.quantity != null) data.quantity = Math.max(1, parseInt(String(b.quantity), 10) || 1);
    if (b.amount != null) data.amount = Math.max(0, Number(b.amount) || 0);
    if (b.status && ['pending', 'confirmed', 'cancelled'].includes(b.status)) {
      data.status = b.status;
      if (b.status === 'confirmed' && !current.confirmedAt) data.confirmedAt = new Date();
    }
    const a = await prisma.treeAdoption.update({ where: { id: current.id }, data });
    if (a.status === 'cancelled') {
      // Libera los árboles para otra persona.
      await prisma.tree.updateMany({ where: { adoptionId: a.id }, data: { adoptionId: null, status: 'AVAILABLE' } });
    } else if (a.status === 'confirmed') {
      await assignTrees(a.id);
    }
    await audit(req.staff?.staffId, 'update', 'treeAdoption', a.id, { code: a.code, status: a.status });
    res.json(a);
  } catch (err) {
    console.error('PUT /api/admin/bosque/adoptions/:id', err);
    res.status(400).json({ error: 'No se pudo actualizar la adopción' });
  }
});

// ---------------- Árboles ----------------
adminBosqueRoutes.get('/trees', async (_req, res) => {
  const trees = await prisma.tree.findMany({
    orderBy: { code: 'asc' },
    include: {
      species: { select: { name: true } },
      adoption: { select: { code: true, customerName: true, dedication: true } },
    },
  });
  res.json(trees);
});

/**
 * POST /api/admin/bosque/trees/import — alta masiva desde el plano de siembra.
 * body.rows: [{ species, lat, lng, zone? }] donde species es el nombre o el slug.
 * Crea los árboles con códigos correlativos y reparte los adoptados pendientes.
 */
adminBosqueRoutes.post('/trees/import', async (req: AuthedRequest, res) => {
  try {
    const rows: Array<Record<string, unknown>> = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (rows.length === 0 || rows.length > 5000) {
      res.status(400).json({ error: 'Envía entre 1 y 5000 filas' });
      return;
    }
    const species = await prisma.treeSpecies.findMany();
    const find = (v: unknown) => {
      const k = slugify(String(v ?? ''));
      return species.find((s) => s.slug === k || slugify(s.name) === k || slugify(s.scientificName ?? '') === k);
    };
    const errors: string[] = [];
    const data: Array<{ speciesId: string; lat: number | null; lng: number | null; zone: string | null }> = [];
    rows.forEach((r, i) => {
      const sp = find(r.species);
      const lat = r.lat === '' || r.lat == null ? null : Number(r.lat);
      const lng = r.lng === '' || r.lng == null ? null : Number(r.lng);
      if (!sp) errors.push(`Fila ${i + 1}: especie "${r.species}" no existe`);
      else if ((lat != null && !Number.isFinite(lat)) || (lng != null && !Number.isFinite(lng)))
        errors.push(`Fila ${i + 1}: coordenadas inválidas`);
      else data.push({ speciesId: sp.id, lat, lng, zone: r.zone ? String(r.zone) : null });
    });
    if (errors.length) {
      res.status(400).json({ error: errors.slice(0, 15).join('\n') });
      return;
    }
    let n = await nextTreeNumber();
    await prisma.tree.createMany({ data: data.map((d) => ({ ...d, code: treeCode(n++), photos: [] })) });

    // Completa adopciones confirmadas que esperaban árboles, de la más antigua a la más nueva.
    const waiting = await prisma.treeAdoption.findMany({ where: { status: 'confirmed' }, orderBy: { createdAt: 'asc' }, select: { id: true } });
    let assigned = 0;
    for (const w of waiting) assigned += await assignTrees(w.id);

    await audit(req.staff?.staffId, 'create', 'tree', 'import', { count: data.length, assigned });
    res.status(201).json({ created: data.length, assigned });
  } catch (err) {
    console.error('POST /api/admin/bosque/trees/import', err);
    res.status(400).json({ error: 'No se pudo importar' });
  }
});

// PUT /api/admin/bosque/trees/:id — fecha de siembra, fotos, zona, notas, coordenadas
adminBosqueRoutes.put('/trees/:id', async (req: AuthedRequest, res) => {
  try {
    const b = req.body ?? {};
    const data: Record<string, unknown> = {};
    if (b.plantedAt !== undefined) data.plantedAt = b.plantedAt ? new Date(b.plantedAt) : null;
    if (Array.isArray(b.photos)) data.photos = b.photos.map(String);
    if (b.zone !== undefined) data.zone = b.zone ? String(b.zone) : null;
    if (b.notes !== undefined) data.notes = b.notes ? String(b.notes) : null;
    if (b.lat !== undefined) data.lat = b.lat === '' || b.lat == null ? null : Number(b.lat);
    if (b.lng !== undefined) data.lng = b.lng === '' || b.lng == null ? null : Number(b.lng);
    if (b.speciesId) data.speciesId = String(b.speciesId);
    // Árbol perdido (para reponer): cuenta en la supervivencia pública.
    if (b.lost === true) data.status = 'LOST';
    if (b.lost === false) data.status = (await prisma.tree.findUnique({ where: { id: req.params.id }, select: { adoptionId: true } }))?.adoptionId ? 'ADOPTED' : 'AVAILABLE';
    const t = await prisma.tree.update({ where: { id: req.params.id }, data });
    await audit(req.staff?.staffId, 'update', 'tree', t.id, { code: t.code });
    res.json(t);
  } catch (err) {
    console.error('PUT /api/admin/bosque/trees/:id', err);
    res.status(400).json({ error: 'No se pudo actualizar el árbol' });
  }
});

// ---------------- Novedades ----------------
adminBosqueRoutes.get('/updates', async (_req, res) => {
  const updates = await prisma.treeUpdate.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { tree: { select: { code: true } } },
  });
  res.json(updates);
});

// POST /api/admin/bosque/updates — novedad de un árbol (treeCode) o de todo el bosque (sin treeCode)
adminBosqueRoutes.post('/updates', async (req: AuthedRequest, res) => {
  try {
    const b = req.body ?? {};
    const title = String(b.title ?? '').trim();
    const body = String(b.body ?? '').trim();
    if (!title || !body) {
      res.status(400).json({ error: 'Título y texto son obligatorios' });
      return;
    }
    let treeId: string | null = null;
    if (b.treeCode) {
      const t = await prisma.tree.findUnique({ where: { code: String(b.treeCode).trim().toUpperCase() } });
      if (!t) {
        res.status(400).json({ error: 'Ese código de árbol no existe' });
        return;
      }
      treeId = t.id;
    }
    const u = await prisma.treeUpdate.create({
      data: { treeId, title, body, photos: Array.isArray(b.photos) ? b.photos.map(String) : [] },
    });
    await audit(req.staff?.staffId, 'create', 'treeUpdate', u.id, { title });
    res.status(201).json(u);
  } catch (err) {
    console.error('POST /api/admin/bosque/updates', err);
    res.status(400).json({ error: 'No se pudo publicar la novedad' });
  }
});

adminBosqueRoutes.delete('/updates/:id', async (req: AuthedRequest, res) => {
  try {
    await prisma.treeUpdate.delete({ where: { id: req.params.id } });
    await audit(req.staff?.staffId, 'delete', 'treeUpdate', req.params.id);
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Novedad no encontrada' });
  }
});

// ---------------- Gastos (transparencia) ----------------
const EXPENSE_CATEGORIES = ['VIVERO', 'SIEMBRA', 'RIEGO', 'MANO_OBRA', 'HERRAMIENTAS', 'OTROS'];

adminBosqueRoutes.get('/expenses', async (_req, res) => {
  res.json(await prisma.bosqueExpense.findMany({ orderBy: { date: 'desc' } }));
});

adminBosqueRoutes.post('/expenses', async (req: AuthedRequest, res) => {
  try {
    const b = req.body ?? {};
    const amount = Number(b.amount);
    const description = String(b.description ?? '').trim();
    if (!description || !Number.isFinite(amount) || amount <= 0 || !EXPENSE_CATEGORIES.includes(b.category)) {
      res.status(400).json({ error: 'Categoría, descripción y monto mayor a 0 son obligatorios' });
      return;
    }
    const e = await prisma.bosqueExpense.create({
      data: {
        date: b.date ? new Date(b.date) : new Date(),
        category: b.category,
        description: description.slice(0, 300),
        amount,
        receiptUrl: b.receiptUrl ? String(b.receiptUrl) : null,
      },
    });
    await audit(req.staff?.staffId, 'create', 'bosqueExpense', e.id, { amount: e.amount, category: e.category });
    res.status(201).json(e);
  } catch (err) {
    console.error('POST /api/admin/bosque/expenses', err);
    res.status(400).json({ error: 'No se pudo registrar el gasto' });
  }
});

adminBosqueRoutes.delete('/expenses/:id', async (req: AuthedRequest, res) => {
  try {
    await prisma.bosqueExpense.delete({ where: { id: req.params.id } });
    await audit(req.staff?.staffId, 'delete', 'bosqueExpense', req.params.id);
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Gasto no encontrado' });
  }
});

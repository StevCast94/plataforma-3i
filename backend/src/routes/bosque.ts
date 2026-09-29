import { Router } from 'express';
import { prisma } from '../prisma';
import { newAdoptionCode } from '../lib/bosque';

// API pública del Bosque ("adopta un árbol"). Nunca expone email ni teléfono
// de los padrinos: solo el nombre de la dedicatoria.
export const bosqueRoutes = Router();

// GET /api/bosque/species — catálogo activo
bosqueRoutes.get('/species', async (_req, res) => {
  const species = await prisma.treeSpecies.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true, slug: true, name: true, scientificName: true, category: true,
      description: true, price: true, image: true,
      _count: { select: { trees: { where: { status: 'ADOPTED' } } } },
    },
  });
  res.json(species.map(({ _count, ...s }) => ({ ...s, adopted: _count.trees })));
});

// GET /api/bosque/stats — contadores de la portada
bosqueRoutes.get('/stats', async (_req, res) => {
  const [adopted, planted, adoptions] = await Promise.all([
    prisma.tree.count({ where: { status: 'ADOPTED' } }),
    prisma.tree.count({ where: { plantedAt: { not: null } } }),
    prisma.treeAdoption.aggregate({ where: { status: 'confirmed' }, _sum: { quantity: true } }),
  ]);
  res.json({ adopted, planted, committed: adoptions._sum.quantity ?? 0, goalPilot: 520 });
});

// GET /api/bosque/trees — puntos del mapa (solo árboles con coordenadas)
bosqueRoutes.get('/trees', async (_req, res) => {
  const trees = await prisma.tree.findMany({
    where: { lat: { not: null }, lng: { not: null } },
    select: {
      code: true, status: true, lat: true, lng: true, plantedAt: true,
      species: { select: { name: true, category: true } },
      adoption: { select: { dedication: true, customerName: true, status: true } },
    },
    orderBy: { code: 'asc' },
  });
  res.json(
    trees.map((t) => ({
      code: t.code,
      status: t.status,
      lat: t.lat,
      lng: t.lng,
      planted: !!t.plantedAt,
      species: t.species.name,
      category: t.species.category,
      padrino: t.adoption?.status === 'confirmed' ? t.adoption.dedication || t.adoption.customerName : null,
    })),
  );
});

// GET /api/bosque/tree/:code — página pública de un árbol
bosqueRoutes.get('/tree/:code', async (req, res) => {
  const tree = await prisma.tree.findUnique({
    where: { code: req.params.code.toUpperCase() },
    include: {
      species: true,
      adoption: { select: { code: true, dedication: true, customerName: true, status: true, confirmedAt: true } },
    },
  });
  if (!tree) {
    res.status(404).json({ error: 'Árbol no encontrado' });
    return;
  }
  const a = tree.adoption?.status === 'confirmed' ? tree.adoption : null;
  // Novedades de este árbol y las generales del bosque.
  const updates = await prisma.treeUpdate.findMany({
    where: { OR: [{ treeId: tree.id }, { treeId: null }] },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  res.json({
    code: tree.code,
    status: tree.status,
    lat: tree.lat,
    lng: tree.lng,
    zone: tree.zone,
    plantedAt: tree.plantedAt,
    photos: tree.photos,
    species: {
      name: tree.species.name,
      scientificName: tree.species.scientificName,
      category: tree.species.category,
      description: tree.species.description,
      image: tree.species.image,
    },
    padrino: a ? a.dedication || a.customerName : null,
    adoptedAt: a?.confirmedAt ?? null,
    adoptionCode: a?.code ?? null,
    updates: updates.map((u) => ({ id: u.id, title: u.title, body: u.body, photos: u.photos, createdAt: u.createdAt })),
  });
});

// GET /api/bosque/adoption/:code — estado y certificado de una adopción
bosqueRoutes.get('/adoption/:code', async (req, res) => {
  const a = await prisma.treeAdoption.findUnique({
    where: { code: req.params.code.toUpperCase() },
    include: {
      species: { select: { name: true, scientificName: true, category: true } },
      trees: { select: { code: true, plantedAt: true, species: { select: { name: true } } }, orderBy: { code: 'asc' } },
    },
  });
  if (!a || a.status === 'cancelled') {
    res.status(404).json({ error: 'Adopción no encontrada' });
    return;
  }
  res.json({
    code: a.code,
    status: a.status,
    quantity: a.quantity,
    dedication: a.dedication || a.customerName,
    species: a.species,
    source: a.source,
    lotCode: a.lotCode,
    confirmedAt: a.confirmedAt,
    createdAt: a.createdAt,
    trees: a.trees.map((t) => ({ code: t.code, species: t.species.name, planted: !!t.plantedAt })),
  });
});

// POST /api/bosque/adoptions — solicitud de adopción (queda pendiente de pago)
bosqueRoutes.post('/adoptions', async (req, res) => {
  try {
    const { speciesId, quantity, customerName, customerEmail, customerPhone, dedication, message, referralCode, subscription } =
      req.body ?? {};
    const name = String(customerName ?? '').trim();
    const phone = String(customerPhone ?? '').trim();
    const qty = Math.min(Math.max(parseInt(String(quantity ?? 1), 10) || 1, 1), 100);
    if (!name || !phone) {
      res.status(400).json({ error: 'Nombre y WhatsApp son obligatorios' });
      return;
    }
    const species = await prisma.treeSpecies.findFirst({ where: { id: String(speciesId ?? ''), active: true } });
    if (!species) {
      res.status(400).json({ error: 'Elige una especie' });
      return;
    }
    const adoption = await prisma.treeAdoption.create({
      data: {
        code: await newAdoptionCode(),
        speciesId: species.id,
        quantity: qty,
        amount: species.price * qty,
        customerName: name.slice(0, 120),
        customerEmail: customerEmail ? String(customerEmail).trim().slice(0, 160) : null,
        customerPhone: phone.slice(0, 40),
        dedication: dedication ? String(dedication).trim().slice(0, 120) : null,
        message: message ? String(message).trim().slice(0, 1000) : null,
        referralCode: referralCode ? String(referralCode).trim().toUpperCase().slice(0, 40) : null,
        subscription: !!subscription,
      },
    });
    res.status(201).json({ code: adoption.code, amount: adoption.amount, quantity: adoption.quantity, species: species.name });
  } catch (err) {
    console.error('POST /api/bosque/adoptions', err);
    res.status(500).json({ error: 'No se pudo registrar la adopción' });
  }
});

// GET /api/bosque/updates — novedades generales del bosque (portada)
bosqueRoutes.get('/updates', async (_req, res) => {
  const updates = await prisma.treeUpdate.findMany({
    where: { treeId: null },
    orderBy: { createdAt: 'desc' },
    take: 6,
    select: { id: true, title: true, body: true, photos: true, createdAt: true },
  });
  res.json(updates);
});

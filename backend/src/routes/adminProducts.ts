import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin, type AuthedRequest } from '../middleware/auth';
import { audit } from '../services/audit';
import { slugify } from '../lib/slug';

export const adminProductRoutes = Router();
adminProductRoutes.use(requireAdmin);

// GET /api/admin/products — incluye inactivos
adminProductRoutes.get('/', async (req, res) => {
  const { type, active, q } = req.query;
  const products = await prisma.product.findMany({
    where: {
      ...(type ? { type: type as never } : {}),
      ...(active === 'true' ? { active: true } : active === 'false' ? { active: false } : {}),
      ...(q ? { name: { contains: String(q), mode: 'insensitive' } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: { project: { select: { id: true, name: true } } },
  });
  res.json(products);
});

// POST /api/admin/products
adminProductRoutes.post('/', async (req: AuthedRequest, res) => {
  try {
    const data = { ...req.body };
    if (!data.slug && data.name) data.slug = slugify(data.name);
    const product = await prisma.product.create({ data });
    await audit(req.staff?.staffId, 'create', 'product', product.id, { name: product.name });
    res.status(201).json(product);
  } catch (err) {
    console.error('POST /api/admin/products', err);
    res.status(400).json({ error: 'Error al crear el producto' });
  }
});

// PUT /api/admin/products/:id
adminProductRoutes.put('/:id', async (req: AuthedRequest, res) => {
  try {
    const data = { ...req.body };
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.project;
    const product = await prisma.product.update({ where: { id: req.params.id }, data });
    await audit(req.staff?.staffId, 'update', 'product', product.id);
    res.json(product);
  } catch (err) {
    console.error('PUT /api/admin/products/:id', err);
    res.status(400).json({ error: 'Error al actualizar el producto' });
  }
});

// DELETE /api/admin/products/:id — soft delete
adminProductRoutes.delete('/:id', async (req: AuthedRequest, res) => {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { active: false } });
    await audit(req.staff?.staffId, 'delete', 'product', req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/products/:id', err);
    res.status(400).json({ error: 'Error al desactivar el producto' });
  }
});

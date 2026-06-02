import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';

export const productRoutes = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/products           -> lista (solo activos por defecto)
// GET /api/products?type=...  -> filtrar por ProductType
productRoutes.get('/', async (req, res) => {
  try {
    const all = req.query.all === 'true';
    const type = req.query.type as string | undefined;
    const products = await prisma.product.findMany({
      where: {
        ...(all ? {} : { active: true }),
        ...(type ? { type: type as never } : {}),
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'asc' }],
      include: { project: true },
    });
    res.json(products);
  } catch (err) {
    console.error('GET /api/products', err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// GET /api/products/:slug -> detalle por slug
productRoutes.get('/:slug', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: { project: true },
    });
    if (!product) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }
    res.json(product);
  } catch (err) {
    console.error('GET /api/products/:slug', err);
    res.status(500).json({ error: 'Error al obtener el producto' });
  }
});

// POST /api/products/:id/inquiry (público) -> solicitar info de un producto
productRoutes.post('/:id/inquiry', async (req, res) => {
  try {
    const { name, email, phone, message, referralCode } = req.body ?? {};
    if (!name || !email) {
      res.status(400).json({ error: 'name y email son requeridos' });
      return;
    }
    if (!EMAIL_RE.test(email)) {
      res.status(400).json({ error: 'Email inválido' });
      return;
    }

    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!product) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }

    const inquiry = await prisma.productInquiry.create({
      data: {
        productId: product.id,
        name: String(name).trim(),
        email: String(email).trim(),
        phone: phone ? String(phone).trim() : null,
        message: message ? String(message).trim() : null,
        referralCode: referralCode ? String(referralCode).trim() : null,
      },
    });

    res.status(201).json({ ok: true, id: inquiry.id });
  } catch (err) {
    console.error('POST /api/products/:id/inquiry', err);
    res.status(500).json({ error: 'Error al enviar la solicitud' });
  }
});

// POST /api/products (admin)
productRoutes.post('/', requireAdmin, async (req, res) => {
  try {
    const product = await prisma.product.create({ data: req.body });
    res.status(201).json(product);
  } catch (err) {
    console.error('POST /api/products', err);
    res.status(400).json({ error: 'Error al crear el producto' });
  }
});

// PUT /api/products/:id (admin)
productRoutes.put('/:id', requireAdmin, async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(product);
  } catch (err) {
    console.error('PUT /api/products/:id', err);
    res.status(400).json({ error: 'Error al actualizar el producto' });
  }
});

// DELETE /api/products/:id (admin)
productRoutes.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/products/:id', err);
    res.status(400).json({ error: 'Error al eliminar el producto' });
  }
});

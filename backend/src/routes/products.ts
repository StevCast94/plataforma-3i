import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';
import { resolveReferrer } from '../services/referralTracking';

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

    const { intent } = req.body ?? {};
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      select: { id: true, price: true, promoPrice: true },
    });
    if (!product) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }

    const code = referralCode ? String(referralCode).trim() : null;

    // Resolver el referidor (si el código es válido) para atribuir la futura comisión.
    let referrerId: string | null = null;
    if (code) {
      const referrer = await resolveReferrer(code);
      referrerId = referrer?.id ?? null;
    }

    // Lead + (si es intención de compra) una Purchase en estado pending, atómicamente.
    const result = await prisma.$transaction(async (tx) => {
      const inquiry = await tx.productInquiry.create({
        data: {
          productId: product.id,
          name: String(name).trim(),
          email: String(email).trim(),
          phone: phone ? String(phone).trim() : null,
          message: message ? String(message).trim() : null,
          referralCode: code,
        },
      });

      let purchaseId: string | null = null;
      if (intent === 'purchase') {
        const purchase = await tx.purchase.create({
          data: {
            productId: product.id,
            customerName: String(name).trim(),
            customerEmail: String(email).trim(),
            customerPhone: phone ? String(phone).trim() : null,
            amount: product.promoPrice ?? product.price,
            status: 'pending',
            referralCode: code,
            referrerId,
          },
        });
        purchaseId = purchase.id;
      }

      return { inquiryId: inquiry.id, purchaseId };
    });

    res.status(201).json({ ok: true, ...result });
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

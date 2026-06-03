import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin, type AuthedRequest } from '../middleware/auth';
import { audit } from '../services/audit';
import { resolveReferrer } from '../services/referralTracking';
import { confirmPurchase, cancelPurchase } from '../services/purchaseService';

export const adminPurchaseRoutes = Router();
adminPurchaseRoutes.use(requireAdmin);

// GET /api/admin/purchases — filtros por estado
adminPurchaseRoutes.get('/', async (req, res) => {
  const { status, q } = req.query;
  const purchases = await prisma.purchase.findMany({
    where: {
      ...(status ? { status: String(status) } : {}),
      ...(q
        ? {
            OR: [
              { customerName: { contains: String(q), mode: 'insensitive' as const } },
              { customerEmail: { contains: String(q), mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      product: { select: { name: true } },
      referrer: { select: { fullName: true, referralCode: true } },
    },
  });
  res.json(purchases);
});

// POST /api/admin/purchases — crear compra manual
adminPurchaseRoutes.post('/', async (req: AuthedRequest, res) => {
  try {
    const { productId, customerName, customerEmail, customerPhone, amount, referralCode, notes } =
      req.body ?? {};
    if (!productId || !customerName || !customerEmail) {
      res.status(400).json({ error: 'Producto, nombre y email del cliente requeridos' });
      return;
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, price: true, promoPrice: true },
    });
    if (!product) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }

    const code = referralCode ? String(referralCode).trim() : null;
    let referrerId: string | null = null;
    if (code) {
      const referrer = await resolveReferrer(code);
      referrerId = referrer?.id ?? null;
    }

    const purchase = await prisma.purchase.create({
      data: {
        productId: product.id,
        customerName: String(customerName).trim(),
        customerEmail: String(customerEmail).trim(),
        customerPhone: customerPhone ? String(customerPhone).trim() : null,
        amount: amount != null ? Number(amount) : (product.promoPrice ?? product.price),
        referralCode: code,
        referrerId,
        notes: notes ? String(notes) : null,
        status: 'pending',
      },
    });
    await audit(req.staff?.staffId, 'create', 'purchase', purchase.id);
    res.status(201).json(purchase);
  } catch (err) {
    console.error('POST /api/admin/purchases', err);
    res.status(400).json({ error: 'Error al crear compra' });
  }
});

// PUT /api/admin/purchases/:id — actualizar estado / datos
adminPurchaseRoutes.put('/:id', async (req: AuthedRequest, res) => {
  try {
    const { status, notes } = req.body ?? {};
    const purchase = await prisma.purchase.update({
      where: { id: req.params.id },
      data: {
        ...(status ? { status: String(status) } : {}),
        ...(notes !== undefined ? { notes: notes ? String(notes) : null } : {}),
      },
    });
    await audit(req.staff?.staffId, 'update', 'purchase', purchase.id, { status });
    res.json(purchase);
  } catch (err) {
    console.error('PUT /api/admin/purchases/:id', err);
    res.status(400).json({ error: 'Error al actualizar compra' });
  }
});

// POST /api/admin/purchases/:id/confirm — confirma y dispara comisión
adminPurchaseRoutes.post('/:id/confirm', async (req: AuthedRequest, res) => {
  try {
    const result = await confirmPurchase(req.params.id);
    await audit(req.staff?.staffId, 'confirm', 'purchase', req.params.id, result);
    res.json(result);
  } catch (err) {
    console.error('POST /api/admin/purchases/:id/confirm', err);
    res.status(400).json({ error: (err as Error).message });
  }
});

// POST /api/admin/purchases/:id/cancel — cancela y reversa comisiones
adminPurchaseRoutes.post('/:id/cancel', async (req: AuthedRequest, res) => {
  try {
    await cancelPurchase(req.params.id);
    await audit(req.staff?.staffId, 'update', 'purchase', req.params.id, { status: 'cancelled' });
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/admin/purchases/:id/cancel', err);
    res.status(400).json({ error: (err as Error).message });
  }
});

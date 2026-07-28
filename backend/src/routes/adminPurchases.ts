import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin, requireSuperadmin, type AuthedRequest } from '../middleware/auth';
import { audit } from '../services/audit';
import { resolveReferrerForPurchase } from '../services/referralTracking';
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
    // Si el comprador ya es socio, manda su upline real (evita auto-referido).
    const { referrerId } = await resolveReferrerForPurchase({
      customerEmail: String(customerEmail),
      code,
    });

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

// PATCH /api/admin/purchases/:id — corrección manual de los datos de la compra
// body: { productId?, amount?, referralCode?, customerName?, customerEmail?,
//         customerPhone?, notes?, regenerateCommissions?: boolean }
// Si `regenerateCommissions` y la compra ya estaba confirmada, reversa las
// comisiones existentes y las vuelve a generar con los datos corregidos.
adminPurchaseRoutes.patch('/:id', requireSuperadmin, async (req: AuthedRequest, res) => {
  try {
    const {
      productId,
      amount,
      referralCode,
      customerName,
      customerEmail,
      customerPhone,
      notes,
      regenerateCommissions,
    } = req.body ?? {};

    const existing = await prisma.purchase.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Compra no encontrada' });
      return;
    }

    // Recalcular el referidor si cambió el código o el email del comprador.
    let referrerPatch: { referralCode: string | null; referrerId: string | null } | null = null;
    if (referralCode !== undefined || customerEmail !== undefined) {
      const code =
        referralCode !== undefined
          ? referralCode
            ? String(referralCode).trim()
            : null
          : existing.referralCode;
      const emailForLookup =
        customerEmail !== undefined ? String(customerEmail) : existing.customerEmail;
      const { referrerId } = await resolveReferrerForPurchase({
        customerEmail: emailForLookup,
        code,
      });
      referrerPatch = { referralCode: code, referrerId };
    }

    const wasConfirmed = existing.status === 'confirmed' || existing.status === 'completed';
    const shouldRegenerate = !!regenerateCommissions && wasConfirmed;

    await prisma.$transaction(async (tx) => {
      await tx.purchase.update({
        where: { id: req.params.id },
        data: {
          ...(productId ? { productId: String(productId) } : {}),
          ...(amount != null && !isNaN(Number(amount)) ? { amount: Number(amount) } : {}),
          ...(customerName ? { customerName: String(customerName).trim() } : {}),
          ...(customerEmail ? { customerEmail: String(customerEmail).trim() } : {}),
          ...(customerPhone !== undefined
            ? { customerPhone: customerPhone ? String(customerPhone).trim() : null }
            : {}),
          ...(notes !== undefined ? { notes: notes ? String(notes) : null } : {}),
          ...(referrerPatch ?? {}),
        },
      });

      if (shouldRegenerate) {
        // Reversar comisiones vigentes (devolviendo saldo si ya estaba acreditado)
        // y dejar la compra lista para volver a confirmarse.
        const commissions = await tx.commission.findMany({
          where: { purchaseId: req.params.id, status: { not: 'REVERSED' } },
          select: { id: true, memberId: true, amount: true, status: true },
        });
        for (const c of commissions) {
          if (c.status === 'PAID' || c.status === 'LIQUIDATED') {
            await tx.referralMember.update({
              where: { id: c.memberId },
              data: { walletBalance: { decrement: c.amount } },
            });
          }
          await tx.commission.update({ where: { id: c.id }, data: { status: 'REVERSED' } });
        }
        await tx.purchase.update({
          where: { id: req.params.id },
          data: { status: 'pending', confirmedAt: null },
        });
      }
    });

    // Volver a confirmar fuera de la transacción anterior (confirmPurchase abre la suya).
    let regenerated = null;
    if (shouldRegenerate) regenerated = await confirmPurchase(req.params.id);

    await audit(req.staff?.staffId, 'update', 'purchase', req.params.id, {
      manual: true,
      regenerateCommissions: shouldRegenerate,
      ...(referrerPatch ?? {}),
    });

    const updated = await prisma.purchase.findUnique({
      where: { id: req.params.id },
      include: {
        product: { select: { name: true } },
        referrer: { select: { fullName: true, referralCode: true } },
      },
    });
    res.json({ purchase: updated, regenerated });
  } catch (err) {
    console.error('PATCH /api/admin/purchases/:id', err);
    res.status(400).json({ error: (err as Error).message || 'Error al editar la compra' });
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

import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin, requireSuperadmin, type AuthedRequest } from '../middleware/auth';
import { audit } from '../services/audit';
import { creditCommission } from '../services/liquidationService';
import { notify } from '../services/notifications';
import { RETRACTION_DAYS, LIQUIDATION_DAYS } from '../lib/referralRules';

export const adminCommissionRoutes = Router();
adminCommissionRoutes.use(requireAdmin);

/** ¿El monto de esta comisión ya está acreditado en el wallet del socio? */
function isCredited(status: string): boolean {
  return status === 'LIQUIDATED' || status === 'PAID';
}

// GET /api/admin/commissions — todas, con filtros
adminCommissionRoutes.get('/', async (req, res) => {
  const { status, memberId } = req.query;
  const commissions = await prisma.commission.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(memberId ? { memberId: String(memberId) } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      member: { select: { fullName: true, email: true } },
      product: { select: { name: true } },
      referral: { select: { referred: { select: { fullName: true } } } },
      purchase: { select: { customerName: true } },
    },
  });
  res.json(commissions);
});

// PATCH /api/admin/commissions/:id — corrección manual (monto y/o estado)
// body: { amount?: number, status?: CommissionStatus, reason?: string }
// Si la comisión ya estaba acreditada al wallet, ajusta el saldo por la diferencia.
adminCommissionRoutes.patch('/:id', requireSuperadmin, async (req: AuthedRequest, res) => {
  try {
    const { amount, status, reason } = req.body ?? {};
    const VALID = ['PENDING', 'CONFIRMED', 'LIQUIDATED', 'PAID', 'REVERSED'];
    if (status && !VALID.includes(String(status))) {
      res.status(400).json({ error: 'Estado inválido' });
      return;
    }
    if (amount != null && (isNaN(Number(amount)) || Number(amount) < 0)) {
      res.status(400).json({ error: 'Monto inválido' });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const c = await tx.commission.findUnique({ where: { id: req.params.id } });
      if (!c) throw new Error('Comisión no encontrada');

      const newAmount = amount != null ? Math.round(Number(amount) * 100) / 100 : c.amount;
      const newStatus = (status ? String(status) : c.status) as typeof c.status;

      // Delta a aplicar al wallet: lo que debe quedar acreditado menos lo que ya lo está.
      const before = isCredited(c.status) ? c.amount : 0;
      const after = isCredited(newStatus) ? newAmount : 0;
      const delta = Math.round((after - before) * 100) / 100;
      if (delta !== 0) {
        await tx.referralMember.update({
          where: { id: c.memberId },
          data: {
            walletBalance: { increment: delta },
            totalEarned: { increment: delta > 0 ? delta : 0 },
          },
        });
      }

      return tx.commission.update({
        where: { id: req.params.id },
        data: {
          amount: newAmount,
          status: newStatus,
          ...(newStatus === 'PAID' && !c.paidAt ? { paidAt: new Date() } : {}),
        },
      });
    });

    await audit(req.staff?.staffId, 'update', 'commission', req.params.id, {
      amount,
      status,
      reason: reason ?? null,
      manual: true,
    });
    res.json(updated);
  } catch (err) {
    console.error('PATCH /api/admin/commissions/:id', err);
    res.status(400).json({ error: (err as Error).message || 'Error al ajustar la comisión' });
  }
});

// POST /api/admin/commissions — crear comisión manual (compensaciones/correcciones)
// body: { memberId, amount, level?, productId?, purchaseId?, reason? }
adminCommissionRoutes.post('/', requireSuperadmin, async (req: AuthedRequest, res) => {
  try {
    const { memberId, amount, level, productId, purchaseId, reason } = req.body ?? {};
    if (!memberId || amount == null || isNaN(Number(amount)) || Number(amount) <= 0) {
      res.status(400).json({ error: 'Miembro y monto (mayor a 0) son requeridos' });
      return;
    }
    const member = await prisma.referralMember.findUnique({
      where: { id: String(memberId) },
      select: { id: true, status: true },
    });
    if (!member) {
      res.status(404).json({ error: 'Miembro no encontrado' });
      return;
    }

    const tier = member.status === 'ELITE' ? 'ELITE' : 'PREMIERE';
    const holdUntil = new Date(
      Date.now() + (RETRACTION_DAYS + LIQUIDATION_DAYS[tier]) * 24 * 60 * 60 * 1000,
    );

    const commission = await prisma.commission.create({
      data: {
        memberId: member.id,
        amount: Math.round(Number(amount) * 100) / 100,
        rate: 0,
        type: 'fixed',
        level: level === 2 ? 2 : 1,
        status: 'PENDING',
        holdUntil,
        productId: productId ? String(productId) : null,
        purchaseId: purchaseId ? String(purchaseId) : null,
      },
    });

    await audit(req.staff?.staffId, 'create', 'commission', commission.id, {
      manual: true,
      reason: reason ?? null,
    });
    await notify(
      member.id,
      'commission_confirmed',
      'Comisión registrada 💰',
      `Se registró una comisión de $${commission.amount.toFixed(2)} en tu cuenta.`,
    );
    res.status(201).json(commission);
  } catch (err) {
    console.error('POST /api/admin/commissions', err);
    res.status(400).json({ error: 'Error al crear la comisión' });
  }
});

// POST /api/admin/commissions/:id/resolve — resolver disputa
// body: { resolution: 'member' | 'club' | 'split' }
adminCommissionRoutes.post('/:id/resolve', async (req: AuthedRequest, res) => {
  try {
    const { resolution } = req.body ?? {};
    const commission = await prisma.commission.findUnique({ where: { id: req.params.id } });
    if (!commission) {
      res.status(404).json({ error: 'Comisión no encontrada' });
      return;
    }

    if (commission.status === 'REVERSED' || commission.status === 'PAID') {
      res.status(400).json({ error: `La comisión ya está ${commission.status}` });
      return;
    }

    let updated;
    if (resolution === 'member') {
      // A favor del miembro → validar y ACREDITAR al wallet (renuncia al hold).
      updated = await prisma.$transaction(async (tx) => {
        await creditCommission(tx, commission);
        return tx.commission.findUnique({ where: { id: req.params.id } });
      });
      await notify(
        commission.memberId,
        'commission_confirmed',
        'Comisión validada y disponible 💸',
        `Tu comisión de $${commission.amount.toFixed(2)} fue validada. Ya puedes solicitar tu retiro.`,
      );
    } else if (resolution === 'club') {
      // A favor del Club → reversar.
      updated = await prisma.commission.update({
        where: { id: req.params.id },
        data: { status: 'REVERSED' },
      });
    } else if (resolution === 'split') {
      // Dividir → mitad, validada y acreditada.
      const half = Math.round((commission.amount / 2) * 100) / 100;
      updated = await prisma.$transaction(async (tx) => {
        await tx.commission.update({ where: { id: req.params.id }, data: { amount: half } });
        await creditCommission(tx, { ...commission, amount: half });
        return tx.commission.findUnique({ where: { id: req.params.id } });
      });
    } else {
      res.status(400).json({ error: 'Resolución inválida' });
      return;
    }

    await audit(req.staff?.staffId, 'update', 'commission', req.params.id, { resolution });
    res.json(updated);
  } catch (err) {
    console.error('POST /api/admin/commissions/:id/resolve', err);
    res.status(400).json({ error: 'Error al resolver' });
  }
});

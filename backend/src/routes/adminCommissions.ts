import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin, type AuthedRequest } from '../middleware/auth';
import { audit } from '../services/audit';
import { creditCommission } from '../services/liquidationService';
import { notify } from '../services/notifications';

export const adminCommissionRoutes = Router();
adminCommissionRoutes.use(requireAdmin);

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
    },
  });
  res.json(commissions);
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

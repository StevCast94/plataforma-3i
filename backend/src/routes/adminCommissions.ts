import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin, type AuthedRequest } from '../middleware/auth';
import { audit } from '../services/audit';

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

    let updated;
    if (resolution === 'member') {
      // A favor del miembro → confirmar.
      updated = await prisma.commission.update({
        where: { id: req.params.id },
        data: { status: 'CONFIRMED' },
      });
    } else if (resolution === 'club') {
      // A favor del Club → reversar.
      updated = await prisma.commission.update({
        where: { id: req.params.id },
        data: { status: 'REVERSED' },
      });
    } else if (resolution === 'split') {
      // Dividir → mitad, confirmada.
      updated = await prisma.commission.update({
        where: { id: req.params.id },
        data: { amount: Math.round((commission.amount / 2) * 100) / 100, status: 'CONFIRMED' },
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

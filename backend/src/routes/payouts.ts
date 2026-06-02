import { Router } from 'express';
import { prisma } from '../prisma';
import { authMember, type MemberRequest } from '../middleware/authMember';
import { minPayoutFor } from '../lib/referralRules';

export const payoutRoutes = Router();

// GET /api/payouts — historial de retiros
payoutRoutes.get('/', authMember, async (req: MemberRequest, res) => {
  const payouts = await prisma.payout.findMany({
    where: { memberId: req.memberId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(payouts);
});

// POST /api/payouts/request — solicitar retiro
payoutRoutes.post('/request', authMember, async (req: MemberRequest, res) => {
  try {
    const { amount } = req.body ?? {};
    const value = Number(amount);
    if (!value || value <= 0) {
      res.status(400).json({ error: 'Monto inválido' });
      return;
    }

    const member = await prisma.referralMember.findUnique({
      where: { id: req.memberId },
      select: { walletBalance: true, status: true, payoutMethod: true, payoutEmail: true },
    });
    if (!member) {
      res.status(404).json({ error: 'Miembro no encontrado' });
      return;
    }
    if (!member.payoutMethod) {
      res.status(400).json({ error: 'Configura tu método de pago primero' });
      return;
    }

    const status = member.status === 'ELITE' ? 'ELITE' : 'PREMIERE';
    const min = minPayoutFor(status, member.payoutMethod);
    if (value < min) {
      res.status(400).json({ error: `El mínimo de retiro es $${min} para tu método` });
      return;
    }
    if (value > member.walletBalance) {
      res.status(400).json({ error: 'Saldo insuficiente' });
      return;
    }

    // Descontar del saldo y crear la solicitud, atómicamente.
    const payout = await prisma.$transaction(async (tx) => {
      await tx.referralMember.update({
        where: { id: req.memberId },
        data: { walletBalance: { decrement: value } },
      });
      return tx.payout.create({
        data: {
          memberId: req.memberId!,
          amount: value,
          method: member.payoutMethod!,
          status: 'pending',
        },
      });
    });

    res.status(201).json(payout);
  } catch (err) {
    console.error('POST /api/payouts/request', err);
    res.status(500).json({ error: 'Error al solicitar retiro' });
  }
});

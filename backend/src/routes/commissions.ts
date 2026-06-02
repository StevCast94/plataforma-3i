import { Router } from 'express';
import { prisma } from '../prisma';
import { authMember, type MemberRequest } from '../middleware/authMember';

export const commissionRoutes = Router();

// GET /api/commissions — historial de comisiones del miembro
commissionRoutes.get('/', authMember, async (req: MemberRequest, res) => {
  const { status } = req.query;
  const commissions = await prisma.commission.findMany({
    where: {
      memberId: req.memberId,
      ...(status ? { status: status as never } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      product: { select: { name: true, type: true } },
      referral: {
        select: { level: true, referred: { select: { fullName: true } } },
      },
    },
  });
  res.json(commissions);
});

// GET /api/commissions/summary — totales para el dashboard
commissionRoutes.get('/summary', authMember, async (req: MemberRequest, res) => {
  const memberId = req.memberId!;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [member, byStatus, monthAgg] = await Promise.all([
    prisma.referralMember.findUnique({
      where: { id: memberId },
      select: { walletBalance: true, totalEarned: true },
    }),
    prisma.commission.groupBy({
      by: ['status'],
      where: { memberId },
      _sum: { amount: true },
    }),
    prisma.commission.aggregate({
      where: { memberId, status: { not: 'REVERSED' }, createdAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
  ]);

  const sumOf = (s: string) =>
    byStatus.find((b) => b.status === s)?._sum.amount ?? 0;

  res.json({
    totalEarned: member?.totalEarned ?? 0,
    available: member?.walletBalance ?? 0,
    pending: sumOf('PENDING') + sumOf('CONFIRMED'),
    liquidated: sumOf('LIQUIDATED'),
    paid: sumOf('PAID'),
    thisMonth: monthAgg._sum.amount ?? 0,
  });
});

import { Router } from 'express';
import { prisma } from '../prisma';
import { authMember, type MemberRequest } from '../middleware/authMember';

export const referralRoutes = Router();

const referredSelect = {
  id: true,
  fullName: true,
  email: true,
  status: true,
  createdAt: true,
} as const;

// GET /api/referrals — referidos del miembro (niveles 1 y 2)
referralRoutes.get('/', authMember, async (req: MemberRequest, res) => {
  const referrals = await prisma.referral.findMany({
    where: { referrerId: req.memberId },
    orderBy: { registeredAt: 'desc' },
    include: { referred: { select: referredSelect } },
  });

  // Comisiones generadas por cada referido para este miembro.
  const byReferral = await prisma.commission.groupBy({
    by: ['referralId'],
    where: { memberId: req.memberId, status: { not: 'REVERSED' } },
    _sum: { amount: true },
  });
  const earnedMap = new Map(byReferral.map((c) => [c.referralId, c._sum.amount ?? 0]));

  res.json(
    referrals.map((r) => ({
      id: r.id,
      level: r.level,
      status: r.status,
      attributionMethod: r.attributionMethod,
      registeredAt: r.registeredAt,
      firstPurchaseAt: r.firstPurchaseAt,
      referred: r.referred,
      commissionsGenerated: earnedMap.get(r.id) ?? 0,
    })),
  );
});

// GET /api/referrals/tree — árbol genealógico de 2 niveles
referralRoutes.get('/tree', authMember, async (req: MemberRequest, res) => {
  const memberId = req.memberId!;

  const level1 = await prisma.referral.findMany({
    where: { referrerId: memberId, level: 1 },
    include: { referred: { select: referredSelect } },
    orderBy: { registeredAt: 'desc' },
  });

  // Para cada referido directo, sus referidos directos (que son nivel 2 del miembro).
  const nodes = await Promise.all(
    level1.map(async (r) => {
      const children = await prisma.referral.findMany({
        where: { referrerId: r.referredId, level: 1 },
        include: { referred: { select: referredSelect } },
        orderBy: { registeredAt: 'desc' },
      });
      return {
        referralId: r.id,
        member: r.referred,
        registeredAt: r.registeredAt,
        firstPurchaseAt: r.firstPurchaseAt,
        children: children.map((c) => ({
          referralId: c.id,
          member: c.referred,
          registeredAt: c.registeredAt,
          firstPurchaseAt: c.firstPurchaseAt,
        })),
      };
    }),
  );

  const level2Count = nodes.reduce((sum, n) => sum + n.children.length, 0);

  res.json({
    level1: nodes,
    stats: {
      level1Count: nodes.length,
      level2Count,
      total: nodes.length + level2Count,
    },
  });
});

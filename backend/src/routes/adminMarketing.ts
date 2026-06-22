import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';

// ============================================================
// MARKETING / EMBUDO DE CONVERSIÓN
// Vista agregada del rendimiento del programa de referidos:
// clicks → leads → ventas, y ranking de referidores.
// Solo lectura, sin cambios de schema.
// ============================================================

export const adminMarketingRoutes = Router();
adminMarketingRoutes.use(requireAdmin);

const SOLD = ['confirmed', 'completed'];

// GET /api/admin/marketing/funnel
adminMarketingRoutes.get('/funnel', async (_req, res) => {
  try {
    const [
      clicksAgg,
      convAgg,
      leads,
      attributedLeads,
      contacts,
      attributedContacts,
      salesCount,
      salesAmount,
      attributedSales,
    ] = await Promise.all([
      prisma.referralLink.aggregate({ _sum: { clicks: true } }),
      prisma.referralLink.aggregate({ _sum: { conversions: true } }),
      prisma.productInquiry.count(),
      prisma.productInquiry.count({ where: { referralCode: { not: null } } }),
      prisma.contactSubmission.count(),
      prisma.contactSubmission.count({ where: { referralCode: { not: null } } }),
      prisma.purchase.count({ where: { status: { in: SOLD } } }),
      prisma.purchase.aggregate({ where: { status: { in: SOLD } }, _sum: { amount: true } }),
      prisma.purchase.count({ where: { status: { in: SOLD }, referrerId: { not: null } } }),
    ]);

    const clicks = clicksAgg._sum.clicks ?? 0;
    const totalLeads = leads + contacts;
    const attrLeads = attributedLeads + attributedContacts;

    const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);

    res.json({
      clicks,
      registrations: convAgg._sum.conversions ?? 0,
      leads: totalLeads,
      attributedLeads: attrLeads,
      sales: salesCount,
      attributedSales,
      salesAmount: salesAmount._sum.amount ?? 0,
      rates: {
        clickToLead: pct(totalLeads, clicks),
        leadToSale: pct(salesCount, totalLeads),
        attributedLeadShare: pct(attrLeads, totalLeads),
      },
    });
  } catch (err) {
    console.error('GET /api/admin/marketing/funnel', err);
    res.status(500).json({ error: 'Error al obtener el embudo' });
  }
});

// GET /api/admin/marketing/top-referrers
adminMarketingRoutes.get('/top-referrers', async (_req, res) => {
  try {
    const bySales = await prisma.purchase.groupBy({
      by: ['referrerId'],
      where: { status: { in: SOLD }, referrerId: { not: null } },
      _count: true,
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 20,
    });

    const ids = bySales.map((b) => b.referrerId!).filter(Boolean);
    const [members, earnings] = await Promise.all([
      prisma.referralMember.findMany({
        where: { id: { in: ids } },
        select: { id: true, fullName: true, referralCode: true, status: true, totalReferrals: true },
      }),
      prisma.commission.groupBy({
        by: ['memberId'],
        where: { memberId: { in: ids }, status: { not: 'REVERSED' } },
        _sum: { amount: true },
      }),
    ]);
    const memberMap = new Map(members.map((m) => [m.id, m]));
    const earnMap = new Map(earnings.map((e) => [e.memberId, e._sum.amount ?? 0]));

    res.json(
      bySales.map((b) => {
        const m = memberMap.get(b.referrerId!);
        return {
          memberId: b.referrerId,
          name: m?.fullName ?? '—',
          code: m?.referralCode ?? '—',
          status: m?.status ?? 'PREMIERE',
          referrals: m?.totalReferrals ?? 0,
          sales: b._count,
          salesAmount: b._sum.amount ?? 0,
          earned: earnMap.get(b.referrerId!) ?? 0,
        };
      }),
    );
  } catch (err) {
    console.error('GET /api/admin/marketing/top-referrers', err);
    res.status(500).json({ error: 'Error al obtener el ranking' });
  }
});

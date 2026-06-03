import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';

export const adminStatsRoutes = Router();
adminStatsRoutes.use(requireAdmin);

// GET /api/admin/stats — métricas del dashboard
adminStatsRoutes.get('/', async (_req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      salesMonth,
      commissionsPaidMonth,
      premiere,
      elite,
      kycPending,
      disputed,
      pendingPurchases,
      recentPurchases,
    ] = await Promise.all([
      prisma.purchase.aggregate({
        where: { status: { in: ['confirmed', 'completed'] }, confirmedAt: { gte: monthStart } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.commission.aggregate({
        where: { status: 'PAID', paidAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      prisma.referralMember.count({ where: { status: 'PREMIERE' } }),
      prisma.referralMember.count({ where: { status: 'ELITE' } }),
      prisma.referralMember.count({ where: { kycVerified: false } }),
      prisma.commission.count({ where: { status: 'CONFIRMED' } }),
      prisma.purchase.count({ where: { status: 'pending' } }),
      prisma.purchase.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { product: { select: { name: true } } },
      }),
    ]);

    // Ventas últimos 6 meses (barras) + miembros nuevos por mes (línea)
    const months: { label: string; sales: number; members: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const [s, m] = await Promise.all([
        prisma.purchase.aggregate({
          where: { status: { in: ['confirmed', 'completed'] }, confirmedAt: { gte: start, lt: end } },
          _sum: { amount: true },
        }),
        prisma.referralMember.count({ where: { createdAt: { gte: start, lt: end } } }),
      ]);
      months.push({
        label: start.toLocaleDateString('es-EC', { month: 'short' }),
        sales: s._sum.amount ?? 0,
        members: m,
      });
    }

    // Productos más vendidos (por compras confirmadas)
    const topGrouped = await prisma.purchase.groupBy({
      by: ['productId'],
      where: { status: { in: ['confirmed', 'completed'] } },
      _count: true,
      _sum: { amount: true },
      orderBy: { _count: { productId: 'desc' } },
      take: 5,
    });
    const topProducts = await Promise.all(
      topGrouped.map(async (g) => {
        const p = await prisma.product.findUnique({
          where: { id: g.productId },
          select: { name: true },
        });
        return { name: p?.name ?? '—', count: g._count, total: g._sum.amount ?? 0 };
      }),
    );

    res.json({
      salesMonth: { total: salesMonth._sum.amount ?? 0, count: salesMonth._count },
      commissionsPaidMonth: commissionsPaidMonth._sum.amount ?? 0,
      activeMembers: { premiere, elite, total: premiere + elite },
      alerts: { kycPending, disputed, pendingPurchases },
      months,
      topProducts,
      recentPurchases,
    });
  } catch (err) {
    console.error('GET /api/admin/stats', err);
    res.status(500).json({ error: 'Error al obtener métricas' });
  }
});

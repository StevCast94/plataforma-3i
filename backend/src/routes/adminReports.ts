import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';

export const adminReportRoutes = Router();
adminReportRoutes.use(requireAdmin);

function parseRange(req: { query: Record<string, unknown> }) {
  const from = req.query.from ? new Date(String(req.query.from)) : new Date(0);
  const to = req.query.to ? new Date(String(req.query.to)) : new Date();
  return { from, to };
}

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
}

// GET /api/admin/report/sales?from&to&format=csv|json
adminReportRoutes.get('/sales', async (req, res) => {
  const { from, to } = parseRange(req);
  const purchases = await prisma.purchase.findMany({
    where: { createdAt: { gte: from, lte: to } },
    orderBy: { createdAt: 'desc' },
    include: {
      product: { select: { name: true } },
      referrer: { select: { fullName: true, referralCode: true } },
      commissions: { select: { amount: true } },
    },
  });

  if (req.query.format === 'csv') {
    const rows = purchases.map((p) => [
      new Date(p.createdAt).toISOString().slice(0, 10),
      p.customerName,
      p.customerEmail,
      p.product.name,
      p.amount,
      p.status,
      p.referrer?.fullName ?? '',
      p.referrer?.referralCode ?? '',
      p.commissions.reduce((s, c) => s + c.amount, 0),
    ]);
    const csv = toCsv(
      ['Fecha', 'Cliente', 'Email', 'Producto', 'Monto', 'Estado', 'Referidor', 'Código', 'Comisión'],
      rows,
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-ventas.csv"');
    res.send(csv);
    return;
  }
  res.json(purchases);
});

// GET /api/admin/report/commissions?from&to&memberId&format=csv|json
adminReportRoutes.get('/commissions', async (req, res) => {
  const { from, to } = parseRange(req);
  const memberId = req.query.memberId ? String(req.query.memberId) : undefined;
  const commissions = await prisma.commission.findMany({
    where: { createdAt: { gte: from, lte: to }, ...(memberId ? { memberId } : {}) },
    orderBy: { createdAt: 'desc' },
    include: {
      member: { select: { fullName: true, email: true } },
      product: { select: { name: true } },
    },
  });

  if (req.query.format === 'csv') {
    const rows = commissions.map((c) => [
      new Date(c.createdAt).toISOString().slice(0, 10),
      c.member.fullName,
      c.member.email,
      c.product?.name ?? '',
      c.level,
      c.amount,
      c.type === 'fixed' ? 'fijo' : `${(c.rate * 100).toFixed(0)}%`,
      c.status,
    ]);
    const csv = toCsv(
      ['Fecha', 'Miembro', 'Email', 'Producto', 'Nivel', 'Monto', 'Tasa', 'Estado'],
      rows,
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-comisiones.csv"');
    res.send(csv);
    return;
  }
  res.json(commissions);
});

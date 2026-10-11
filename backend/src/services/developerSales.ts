import { prisma } from '../prisma';
import { createCommission } from './commissionCalculator';
import { notify } from './notifications';
import { onStageChange } from './crm';

// Ventas de proyectos de terceros.
// - feeRate se fija al declarar: contacto propio → ownLeadRate (2 %); si no, la tasa
//   del proyecto o la del desarrollador (8 %).
// - Cada pago del comprador es una cuota; su feeAmount es lo que el desarrollador nos debe.
// - Al COBRAR la cuota (collectInstallment) se generan las comisiones N1/N2 sobre el
//   monto de esa cuota: nunca pagamos a un referidor dinero que aún no cobramos.

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function feeRateForLead(leadId: string): Promise<number> {
  const lead = await prisma.projectLead.findUniqueOrThrow({
    where: { id: leadId },
    select: { source: true, project: { select: { commissionRate: true, developer: { select: { commissionRate: true, ownLeadRate: true } } } } },
  });
  const dev = lead.project.developer;
  if (!dev) throw new Error('El proyecto no es de un desarrollador externo');
  if (lead.source === 'DEVELOPER') return dev.ownLeadRate;
  return lead.project.commissionRate ?? dev.commissionRate;
}

export function installmentFee(amount: number, feeRate: number) {
  return round2(amount * feeRate);
}

/** Confirma la venta: contacto → Venta, lote → Vendido. */
export async function confirmSale(saleId: string) {
  const sale = await prisma.developerSale.update({
    where: { id: saleId },
    data: { status: 'CONFIRMED', confirmedAt: new Date(), reviewNote: null },
  });
  const before = await prisma.projectLead.findUnique({ where: { id: sale.leadId }, select: { status: true } });
  await prisma.projectLead.update({ where: { id: sale.leadId }, data: { status: 'WON' } });
  if (before) await onStageChange(sale.leadId, before.status, 'WON', 'staff');
  if (sale.lotCode) {
    await prisma.lot.updateMany({
      where: { projectId: sale.projectId, code: sale.lotCode, status: { not: 'SOLD' } },
      data: { status: 'SOLD' },
    });
  }
  return sale;
}

/** Desistimiento: se anulan las cuotas aún no cobradas; lo cobrado no se devuelve. */
export async function cancelSale(saleId: string, note: string) {
  await prisma.saleInstallment.updateMany({ where: { saleId, collectedAt: null }, data: { voided: true } });
  return prisma.developerSale.update({ where: { id: saleId }, data: { status: 'CANCELLED', reviewNote: note } });
}

/**
 * Grupo 3i cobró su parte de una cuota: se marca y se generan las comisiones de
 * los referidores (N1 y su upline N2) si el contacto llegó por referido.
 * Idempotente: una cuota ya cobrada no vuelve a generar comisiones.
 */
export async function collectInstallment(installmentId: string) {
  return prisma.$transaction(async (db) => {
    const inst = await db.saleInstallment.findUniqueOrThrow({
      where: { id: installmentId },
      include: {
        sale: {
          include: {
            lead: { select: { source: true, memberId: true, name: true } },
            project: { select: { name: true } },
          },
        },
      },
    });
    if (inst.collectedAt) return { already: true, commissions: [] as { memberId: string; amount: number }[] };
    if (inst.voided || inst.sale.status !== 'CONFIRMED') throw new Error('La venta no está confirmada o la cuota fue anulada');

    await db.saleInstallment.update({ where: { id: inst.id }, data: { collectedAt: new Date() } });

    const created: { memberId: string; amount: number }[] = [];
    const { lead } = inst.sale;
    if (lead.source !== 'REFERRAL' || !lead.memberId) return { already: false, commissions: created };

    const description = `${inst.sale.lotCode ? `Solar ${inst.sale.lotCode} · ` : ''}${inst.sale.project.name} — ${lead.name}`;
    const n1 = await db.referralMember.findUnique({ where: { id: lead.memberId }, select: { id: true, status: true, referrerId: true } });
    const chain: { id: string; status: string; level: 1 | 2 }[] = [];
    if (n1) {
      chain.push({ id: n1.id, status: n1.status, level: 1 });
      if (n1.referrerId) {
        const n2 = await db.referralMember.findUnique({ where: { id: n1.referrerId }, select: { id: true, status: true } });
        if (n2) chain.push({ id: n2.id, status: n2.status, level: 2 });
      }
    }
    for (const m of chain) {
      if (m.status === 'SUSPENDED') continue;
      const c = await createCommission(
        {
          memberId: m.id,
          memberStatus: m.status as 'PREMIERE' | 'ELITE',
          level: m.level,
          productType: 'LAND',
          netPrice: inst.amount,
          transactionId: inst.id,
        },
        db,
      );
      if (!c) continue;
      await db.commission.update({ where: { id: c.id }, data: { installmentId: inst.id, description } });
      created.push({ memberId: m.id, amount: c.amount });
      await notify(
        m.id,
        'commission_confirmed',
        '💰 Nueva comisión por venta',
        `Ganaste $${c.amount.toLocaleString('en-US')} por la venta en ${inst.sale.project.name}.`,
        db,
        '/oficina/comisiones',
      );
    }
    return { already: false, commissions: created };
  });
}

/** Totales de una venta: cobrado al comprador, lo que el desarrollador debe y lo ya cobrado. */
export function saleTotals(installments: { amount: number; feeAmount: number; collectedAt: Date | null; voided: boolean }[]) {
  const live = installments.filter((i) => !i.voided);
  return {
    paid: round2(live.reduce((s, i) => s + i.amount, 0)),
    feeTotal: round2(live.reduce((s, i) => s + i.feeAmount, 0)),
    feeCollected: round2(live.filter((i) => i.collectedAt).reduce((s, i) => s + i.feeAmount, 0)),
  };
}

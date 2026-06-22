import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../prisma';
import { notify } from './notifications';

type Db = PrismaClient | Prisma.TransactionClient;

// ============================================================
// LIQUIDACIÓN DE COMISIONES → ACREDITACIÓN AL WALLET
// Una comisión solo es retirable cuando pasa a LIQUIDATED y su monto se
// suma a `walletBalance` (+ `totalEarned`). Antes de este servicio NADA
// acreditaba el saldo, por lo que el socio nunca podía solicitar retiro.
//
// Dos caminos llegan a LIQUIDATED:
//  1) Automático: la comisión cumplió su `holdUntil` (retracto + liquidación).
//  2) Manual: el admin valida la comisión (resuelve a favor del miembro),
//     lo que renuncia al hold y acredita de inmediato.
// ============================================================

/**
 * Acredita UNA comisión al wallet del miembro y la marca LIQUIDATED.
 * Idempotente: si ya está LIQUIDATED/PAID/REVERSED no hace nada.
 * Debe ejecutarse dentro de una transacción.
 */
export async function creditCommission(
  tx: Prisma.TransactionClient,
  commission: { id: string; memberId: string; amount: number; status: string },
): Promise<boolean> {
  if (commission.status === 'LIQUIDATED' || commission.status === 'PAID' || commission.status === 'REVERSED') {
    return false;
  }
  await tx.commission.update({
    where: { id: commission.id },
    data: { status: 'LIQUIDATED' },
  });
  await tx.referralMember.update({
    where: { id: commission.memberId },
    data: {
      walletBalance: { increment: commission.amount },
      totalEarned: { increment: commission.amount },
    },
  });
  return true;
}

/**
 * Liquida (acredita al wallet) todas las comisiones cuyo `holdUntil` ya venció
 * y siguen en PENDING o CONFIRMED. Pensado para invocarse de forma perezosa al
 * leer comisiones/pagos, de modo que el saldo esté siempre actualizado sin
 * depender de un cron. Si se pasa `memberId`, limita a ese socio.
 */
export async function liquidateDueCommissions(
  memberId?: string,
  db: Db = prisma,
): Promise<number> {
  const now = new Date();
  const due = await db.commission.findMany({
    where: {
      ...(memberId ? { memberId } : {}),
      status: { in: ['PENDING', 'CONFIRMED'] },
      holdUntil: { not: null, lte: now },
    },
    select: { id: true, memberId: true, amount: true, status: true },
  });
  if (due.length === 0) return 0;

  let credited = 0;
  await prisma.$transaction(async (tx) => {
    for (const c of due) {
      const ok = await creditCommission(tx, c);
      if (ok) credited++;
    }
  });

  // Notificar (best-effort, fuera de la transacción).
  const byMember = new Map<string, number>();
  for (const c of due) byMember.set(c.memberId, (byMember.get(c.memberId) ?? 0) + c.amount);
  for (const [mid, amount] of byMember) {
    try {
      await notify(
        mid,
        'commission_confirmed',
        'Comisiones disponibles para retiro 💸',
        `Se liquidaron $${amount.toFixed(2)} en comisiones. Ya puedes solicitar tu retiro.`,
      );
    } catch {
      /* noop */
    }
  }

  return credited;
}

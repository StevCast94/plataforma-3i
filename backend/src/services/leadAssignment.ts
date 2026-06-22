import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../prisma';

type Db = PrismaClient | Prisma.TransactionClient;

// ============================================================
// ASIGNACIÓN DE LEADS A ASESORES (round-robin balanceado)
// Reparte cada solicitud nueva entre los asesores activos (StaffUser role
// 'advisor'), eligiendo al que menos leads tiene asignados. Si no hay
// asesores, el lead queda sin asignar (assignedToId = null) y se puede
// asignar a mano desde el panel.
// ============================================================

/** Devuelve el id del asesor con menos leads asignados, o null si no hay. */
export async function pickAdvisor(db: Db = prisma): Promise<string | null> {
  const advisors = await db.staffUser.findMany({
    where: { role: 'advisor', active: true },
    select: { id: true },
  });
  if (advisors.length === 0) return null;

  const counts = await db.productInquiry.groupBy({
    by: ['assignedToId'],
    where: { assignedToId: { in: advisors.map((a) => a.id) } },
    _count: true,
  });
  const countMap = new Map(counts.map((c) => [c.assignedToId, c._count]));

  // El asesor con menor carga (los que no aparecen tienen 0).
  let best = advisors[0].id;
  let bestCount = countMap.get(best) ?? 0;
  for (const a of advisors) {
    const n = countMap.get(a.id) ?? 0;
    if (n < bestCount) {
      best = a.id;
      bestCount = n;
    }
  }
  return best;
}

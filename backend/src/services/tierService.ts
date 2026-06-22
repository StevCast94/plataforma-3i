import type { Prisma, PrismaClient } from '@prisma/client';
import { ascendByPurchase } from './ascendService';

type Db = PrismaClient | Prisma.TransactionClient;

// ============================================================
// ASCENSO AUTOMÁTICO A ELITE
// Reglamento: cuando un socio HACE UNA COMPRA o se le REGALA una membresía,
// sube automáticamente a ELITE. Las comisiones ya generadas (a tasa Premiere)
// se guardan como montos fijos, por lo que quedan tal cual; solo cambian las
// tasas de las comisiones FUTURAS.
//
// Delegamos en `ascendByPurchase` (fuente única): setea status/eliteBy/
// eliteSince, notifica y anuncia en el feed. No degrada: ELITE/SUSPENDED
// se respetan. `_reason` se conserva para trazabilidad en los llamadores.
// ============================================================

export async function upgradeToElite(
  db: Db,
  memberId: string,
  _reason: string,
): Promise<boolean> {
  const result = await ascendByPurchase(memberId, db);
  return result.ascended;
}

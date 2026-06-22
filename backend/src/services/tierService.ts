import type { Prisma, PrismaClient } from '@prisma/client';
import { notify } from './notifications';

type Db = PrismaClient | Prisma.TransactionClient;

// ============================================================
// ASCENSO AUTOMÁTICO A ELITE
// Reglamento: cuando un socio HACE UNA COMPRA o se le REGALA una membresía,
// sube automáticamente a ELITE. Las comisiones ya generadas (a tasa Premiere)
// se guardan como montos fijos, por lo que quedan tal cual; solo cambian las
// tasas de las comisiones FUTURAS.
// No degrada: a un SUSPENDED no se le toca; un ELITE se mantiene.
// ============================================================

export async function upgradeToElite(
  db: Db,
  memberId: string,
  reason: string,
): Promise<boolean> {
  const member = await db.referralMember.findUnique({
    where: { id: memberId },
    select: { status: true },
  });
  if (!member || member.status !== 'PREMIERE') return false;

  await db.referralMember.update({
    where: { id: memberId },
    data: { status: 'ELITE' },
  });

  await notify(
    memberId,
    'new_referral',
    '¡Ascendiste a ELITE! 🏆',
    `Tu cuenta subió a ELITE (${reason}). Tus comisiones ya ganadas se mantienen; desde ahora ganas a tasa Elite.`,
    db,
  );

  return true;
}

import type { Prisma, PrismaClient } from '@prisma/client';
import { notify } from '../services/notifications';

type Db = PrismaClient | Prisma.TransactionClient;

// ============================================================
// FASE 5 V3 — Conectar VENTA de membresía → ACCESO al motor.
// Cuando se confirma la compra de un producto TRAVEL_MEMBERSHIP, el comprador
// (si tiene cuenta de socio con ese email) recibe la TravelMembership
// (source=PURCHASE). La comisión fija del reglamento la genera confirmPurchase
// aparte; aquí NO se toca dinero.
// ============================================================

export interface GrantOnPurchaseResult {
  granted: boolean;
  reason?: 'no-member' | 'already-active';
  memberId?: string;
}

/**
 * Otorga acceso al club de viajes al comprador de una membresía, emparejándolo
 * con un ReferralMember por email. Best-effort: nunca debe romper la
 * confirmación de la compra. Idempotente (no duplica membresías activas).
 */
export async function grantTravelMembershipOnPurchase(
  db: Db,
  opts: { customerEmail: string; purchaseId: string },
): Promise<GrantOnPurchaseResult> {
  const email = opts.customerEmail.toLowerCase().trim();
  const member = await db.referralMember.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!member) return { granted: false, reason: 'no-member' };

  const existing = await db.travelMembership.findFirst({
    where: { memberId: member.id, active: true },
    select: { id: true },
  });
  if (existing) return { granted: false, reason: 'already-active', memberId: member.id };

  await db.travelMembership.create({
    data: {
      memberId: member.id,
      source: 'PURCHASE',
      tier: 'standard',
      purchaseId: opts.purchaseId,
      note: `Compra ${opts.purchaseId}`,
    },
  });

  await notify(
    member.id,
    'first_purchase',
    '¡Tu membresía de viajes está activa! ✈️',
    'Gracias por unirte al Club de Viajes 3i. Ya puedes ver precios de socio al buscar hoteles.',
    db,
  );

  return { granted: true, memberId: member.id };
}

/** Revoca (desactiva) la membresía de viajes originada por una compra cancelada. */
export async function revokeTravelMembershipForPurchase(
  db: Db,
  purchaseId: string,
): Promise<number> {
  const result = await db.travelMembership.updateMany({
    where: { purchaseId, active: true },
    data: { active: false },
  });
  return result.count;
}

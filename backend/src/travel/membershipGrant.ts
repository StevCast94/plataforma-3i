import type { Prisma, PrismaClient } from '@prisma/client';
import { notify } from '../services/notifications';
import { upgradeToElite } from '../services/tierService';

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
  opts: { customerEmail: string; purchaseId: string; source?: 'PURCHASE' | 'REWARD'; note?: string },
): Promise<GrantOnPurchaseResult> {
  const source = opts.source ?? 'PURCHASE';
  const email = opts.customerEmail.toLowerCase().trim();
  const member = await db.referralMember.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!member) return { granted: false, reason: 'no-member' };

  // Adquirir una membresía sube al socio a ELITE (comisiones ya ganadas quedan tal cual).
  if (source === 'PURCHASE') {
    await upgradeToElite(db, member.id, 'compra de membresía de viajes');
  }

  const existing = await db.travelMembership.findFirst({
    where: { memberId: member.id, active: true },
    select: { id: true },
  });
  if (existing) return { granted: false, reason: 'already-active', memberId: member.id };

  await db.travelMembership.create({
    data: {
      memberId: member.id,
      source,
      tier: 'standard',
      purchaseId: opts.purchaseId,
      note: opts.note ?? `Compra ${opts.purchaseId}`,
    },
  });

  const isReward = source === 'REWARD';
  await notify(
    member.id,
    'first_purchase',
    isReward ? '🎁 ¡Membresía de viajes de regalo!' : '¡Tu membresía de viajes está activa! ✈️',
    isReward
      ? 'Como agradecimiento por tu compra, te regalamos el acceso al Club de Viajes 3i. Ya puedes ver precios de socio.'
      : 'Gracias por unirte al Club de Viajes 3i. Ya puedes ver precios de socio al buscar hoteles.',
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

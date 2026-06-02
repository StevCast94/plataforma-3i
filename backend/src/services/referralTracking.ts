import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../prisma';
import { createCommission } from './commissionCalculator';
import { checkReferralAscension } from './ascendService';
import { notify } from './notifications';

type Db = PrismaClient | Prisma.TransactionClient;

/** Busca al miembro dueño de un código de referido (acepta código de miembro o de link). */
export async function resolveReferrer(
  code: string,
  db: Db = prisma,
): Promise<{ id: string; referrerId: string | null } | null> {
  const member = await db.referralMember.findUnique({
    where: { referralCode: code },
    select: { id: true, referrerId: true },
  });
  if (member) return member;

  const link = await db.referralLink.findUnique({
    where: { code },
    select: { member: { select: { id: true, referrerId: true } } },
  });
  return link?.member ?? null;
}

/**
 * Crea la atribución de un nuevo miembro a su referidor (y al de 2do nivel si existe).
 * Reglas: no auto-referido, un referido pertenece a UN solo referidor (1er registro gana).
 * Actualiza contadores del referidor y conversiones del link.
 */
export async function attributeReferral(
  params: {
    newMemberId: string;
    referrerCode: string;
    attributionMethod?: string;
    cookieId?: string | null;
  },
  db: Db = prisma,
): Promise<{ attributed: boolean; reason?: string }> {
  const { newMemberId, referrerCode, attributionMethod = 'link', cookieId } = params;

  const referrer = await resolveReferrer(referrerCode, db);
  if (!referrer) return { attributed: false, reason: 'Código de referido inválido' };
  if (referrer.id === newMemberId)
    return { attributed: false, reason: 'No se permite auto-referido' };

  // Un referido solo puede atribuirse a un miembro (first-click gana).
  const existing = await db.referral.findFirst({
    where: { referredId: newMemberId, level: 1 },
    select: { id: true },
  });
  if (existing) return { attributed: false, reason: 'El referido ya está atribuido' };

  // Nivel 1
  await db.referral.create({
    data: {
      referrerId: referrer.id,
      referredId: newMemberId,
      level: 1,
      attributionMethod,
      cookieId: cookieId ?? null,
      status: 'active',
    },
  });

  // Nivel 2 (el referidor del referidor)
  if (referrer.referrerId) {
    await db.referral.create({
      data: {
        referrerId: referrer.referrerId,
        referredId: newMemberId,
        level: 2,
        attributionMethod,
        cookieId: cookieId ?? null,
        status: 'active',
      },
    });
  }

  // Actualizar contadores del referidor directo + reactivar.
  await db.referralMember.update({
    where: { id: referrer.id },
    data: {
      totalReferrals: { increment: 1 },
      lastReferralAt: new Date(),
      inactiveSince: null,
    },
  });

  // Sumar conversión al link si el código corresponde a uno.
  await db.referralLink.updateMany({
    where: { code: referrerCode },
    data: { conversions: { increment: 1 } },
  });

  await notify(
    referrer.id,
    'new_referral',
    'Nuevo referido registrado 🎯',
    'Una persona se registró con tu enlace. ¡Sigue compartiendo!',
    db,
  );

  return { attributed: true };
}

/** Registra un click en un enlace de referido (atribución first-click vía cookie). */
export async function recordClick(code: string, db: Db = prisma): Promise<boolean> {
  const result = await db.referralLink.updateMany({
    where: { code },
    data: { clicks: { increment: 1 } },
  });
  return result.count > 0;
}

/**
 * Procesa la primera compra de un miembro referido:
 * marca firstPurchaseAt, genera comisiones a sus referidores (nivel 1 y 2)
 * según sus respectivos estatus, y verifica el ascenso del referidor de nivel 1.
 * Pensado para invocarse desde el flujo de checkout (Fase futura) o desde el seed/tests.
 */
export async function processReferredPurchase(
  params: {
    referredMemberId: string;
    productId?: string | null;
    productType:
      | 'TRAVEL_MEMBERSHIP'
      | 'FRACTIONAL_PROPERTY'
      | 'TRADITIONAL_PROPERTY'
      | 'LAND';
    netPrice: number;
    transactionId?: string | null;
  },
  db: Db = prisma,
): Promise<{ commissionsCreated: number }> {
  const { referredMemberId, productId, productType, netPrice, transactionId } = params;

  // Referrals (niveles 1 y 2) donde este miembro es el referido.
  const referrals = await db.referral.findMany({
    where: { referredId: referredMemberId },
    select: { id: true, referrerId: true, level: true, firstPurchaseAt: true },
  });

  let created = 0;
  for (const r of referrals) {
    if (!r.firstPurchaseAt) {
      await db.referral.update({
        where: { id: r.id },
        data: { firstPurchaseAt: new Date(), status: 'active' },
      });
    }

    const referrer = await db.referralMember.findUnique({
      where: { id: r.referrerId },
      select: { status: true },
    });
    if (!referrer || referrer.status === 'SUSPENDED') continue;

    const commission = await createCommission(
      {
        memberId: r.referrerId,
        memberStatus: referrer.status === 'ELITE' ? 'ELITE' : 'PREMIERE',
        referralId: r.id,
        level: r.level === 2 ? 2 : 1,
        productType,
        netPrice,
        productId,
        transactionId,
      },
      db,
    );
    if (commission) {
      created++;
      await notify(
        r.referrerId,
        'first_purchase',
        'Tu referido realizó una compra 💰',
        'Generaste una comisión. Quedará disponible tras el período de espera.',
        db,
      );
    }

    // Solo el referidor de nivel 1 acumula para el ascenso por referidos.
    if (r.level === 1) {
      await checkReferralAscension(r.referrerId, db);
    }
  }

  return { commissionsCreated: created };
}

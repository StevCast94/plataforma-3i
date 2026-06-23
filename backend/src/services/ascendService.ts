import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../prisma';
import {
  ELITE_REFERRALS_REQUIRED,
  ELITE_REFERRALS_WINDOW_DAYS,
} from '../lib/referralRules';
import { notify } from './notifications';

type Db = PrismaClient | Prisma.TransactionClient;

export interface AscendResult {
  ascended: boolean;
  status: 'PREMIERE' | 'ELITE' | 'SUSPENDED';
  by?: 'PURCHASE' | 'REFERRALS';
}

/** Publica automáticamente en el feed el ascenso a Elite del miembro. */
async function announceElite(memberId: string, db: Db): Promise<void> {
  try {
    const member = await db.referralMember.findUnique({
      where: { id: memberId },
      select: { fullName: true },
    });
    if (!member) return;
    await db.socialPost.create({
      data: {
        userId: memberId,
        content: `¡${member.fullName} acaba de convertirse en Miembro Elite del Club 3i! 🎉🏆`,
        images: [],
      },
    });
  } catch (err) {
    console.error('announceElite', err);
  }
}

/**
 * Ascenso por compra: el miembro adquirió cualquier producto.
 * Irreversible. Las comisiones previas mantienen tasa Premiere; las nuevas, Elite.
 * NOTA: el referralCode NO cambia para no romper enlaces/QR ya compartidos.
 */
export async function ascendByPurchase(memberId: string, db: Db = prisma): Promise<AscendResult> {
  const member = await db.referralMember.findUnique({
    where: { id: memberId },
    select: { status: true },
  });
  if (!member) throw new Error('Miembro no encontrado');
  if (member.status === 'ELITE') return { ascended: false, status: 'ELITE' };
  if (member.status === 'SUSPENDED') return { ascended: false, status: 'SUSPENDED' };

  await db.referralMember.update({
    where: { id: memberId },
    data: { status: 'ELITE', eliteBy: 'PURCHASE', eliteSince: new Date() },
  });
  await notify(
    memberId,
    'elite_ascension',
    '¡Ahora eres Miembro Elite! 🎉',
    'Tu compra te convirtió en Elite. A partir de ahora ganas comisiones a tasas Elite.',
    db,
  );
  await announceElite(memberId, db);
  return { ascended: true, status: 'ELITE', by: 'PURCHASE' };
}

/**
 * Verifica el ascenso por referidos: 5 referidos directos con primera compra
 * dentro de los últimos 180 días. Si se cumple → Elite + membresía GRATIS.
 * Devuelve el conteo actualizado y si ascendió.
 */
export async function checkReferralAscension(
  memberId: string,
  db: Db = prisma,
): Promise<AscendResult & { count: number }> {
  const member = await db.referralMember.findUnique({
    where: { id: memberId },
    select: { status: true },
  });
  if (!member) throw new Error('Miembro no encontrado');

  const windowStart = new Date(
    Date.now() - ELITE_REFERRALS_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );

  // Referidos directos (nivel 1) que compraron un producto INMOBILIARIO dentro de la ventana.
  const count = await db.referral.count({
    where: {
      referrerId: memberId,
      level: 1,
      firstRealEstateAt: { gte: windowStart },
    },
  });

  await db.referralMember.update({
    where: { id: memberId },
    data: { referralsCountToElite: count },
  });

  if (member.status === 'PREMIERE' && count >= ELITE_REFERRALS_REQUIRED) {
    await db.referralMember.update({
      where: { id: memberId },
      data: {
        status: 'ELITE',
        eliteBy: 'REFERRALS',
        eliteSince: new Date(),
        membershipAwarded: true,
      },
    });
    // Otorgar la membresía de viajes GRATIS (idempotente: no duplica si ya tiene activa).
    const activeMembership = await db.travelMembership.findFirst({
      where: { memberId, active: true },
      select: { id: true },
    });
    if (!activeMembership) {
      await db.travelMembership.create({
        data: {
          memberId,
          source: 'REWARD',
          tier: 'standard',
          note: `Premio por ${ELITE_REFERRALS_REQUIRED} referidos inmobiliarios`,
        },
      });
    }
    await notify(
      memberId,
      'elite_ascension',
      '¡Felicidades, eres Miembro Elite! 🏆',
      `Alcanzaste ${ELITE_REFERRALS_REQUIRED} referidos exitosos. Eres Elite y tu membresía de viajes es GRATIS.`,
      db,
    );
    await announceElite(memberId, db);
    return { ascended: true, status: 'ELITE', by: 'REFERRALS', count };
  }

  return { ascended: false, status: member.status as 'PREMIERE' | 'ELITE' | 'SUSPENDED', count };
}

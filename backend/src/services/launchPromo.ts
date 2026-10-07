import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../prisma';
import {
  LAUNCH_PROMO_END,
  LAUNCH_PROMO_GRACE_DAYS,
  LAUNCH_PROMO_START,
  isLaunchPromoActive,
} from '../lib/launchPromo';
import { notify } from './notifications';

type Db = PrismaClient | Prisma.TransactionClient;

/** Regalo de lanzamiento: un Premiere con al menos un referido directo sube a Elite. */
export async function grantLaunchElite(memberId: string, db: Db = prisma): Promise<boolean> {
  if (!isLaunchPromoActive()) return false;
  const m = await db.referralMember.findUnique({ where: { id: memberId }, select: { status: true, claimed: true } });
  if (!m || m.status !== 'PREMIERE' || !m.claimed) return false;
  await db.referralMember.update({
    where: { id: memberId },
    data: { status: 'ELITE', eliteBy: 'LAUNCH_PROMO', eliteSince: new Date() },
  });
  await notify(
    memberId,
    'elite_ascension',
    '🎁 Regalo de lanzamiento: ¡ya eres Elite!',
    'Por inscribir a tu primer referido te regalamos el ascenso a Elite: desde ahora ganas 4% y 2% en comisiones inmobiliarias. Consigue 1 venta antes del 7 de noviembre para conservarlo.',
    db,
    '/oficina/dashboard',
  );
  return true;
}

/** Durante la temporada: regala el ascenso a quien ya tenga referidos (incluye a los inscritos antes). */
export async function backfillLaunchElite(): Promise<number> {
  if (!isLaunchPromoActive()) return 0;
  const members = await prisma.referralMember.findMany({
    where: { status: 'PREMIERE', claimed: true, sentReferrals: { some: { level: 1 } } },
    select: { id: true },
  });
  let n = 0;
  for (const m of members) if (await grantLaunchElite(m.id)) n++;
  return n;
}

/**
 * Cierre de la temporada (una vez pasado el período de gracia): conserva Elite
 * quien tuvo al menos 1 venta confirmada dentro de la temporada, propia o de un
 * referido directo; los demás vuelven a Premiere. Las comisiones ya ganadas no cambian.
 */
export async function closeLaunchPromo(now = new Date()): Promise<{ kept: number; reverted: number }> {
  const closeAt = new Date(LAUNCH_PROMO_END.getTime() + LAUNCH_PROMO_GRACE_DAYS * 86400000);
  if (now < closeAt) return { kept: 0, reverted: 0 };
  const members = await prisma.referralMember.findMany({
    where: { eliteBy: 'LAUNCH_PROMO' },
    select: { id: true, email: true },
  });
  let kept = 0;
  let reverted = 0;
  for (const m of members) {
    const window = { gte: LAUNCH_PROMO_START, lt: LAUNCH_PROMO_END };
    const sold = await prisma.purchase.findFirst({
      where: {
        status: { in: ['confirmed', 'completed'] },
        createdAt: window,
        OR: [{ referrerId: m.id }, { customerEmail: { equals: m.email, mode: 'insensitive' } }],
      },
      select: { referrerId: true },
    });
    if (sold) {
      await prisma.referralMember.update({
        where: { id: m.id },
        data: { eliteBy: sold.referrerId === m.id ? 'REFERRALS' : 'PURCHASE' },
      });
      await notify(m.id, 'elite_ascension', 'Conservas tu nivel Elite 🏆', 'Cerró la temporada de lanzamiento y, gracias a tu venta, sigues siendo Elite.');
      kept++;
    } else {
      await prisma.referralMember.update({
        where: { id: m.id },
        data: { status: 'PREMIERE', eliteBy: null, eliteSince: null },
      });
      await notify(
        m.id,
        'elite_ascension',
        'Terminó la temporada de lanzamiento',
        'Vuelves a Premiere (2% y 1%). Las comisiones que ganaste como Elite se mantienen. Con tu primera venta o 5 referidos con compra vuelves a ser Elite.',
      );
      reverted++;
    }
  }
  return { kept, reverted };
}

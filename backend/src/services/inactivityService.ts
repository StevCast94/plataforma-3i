import { prisma } from '../prisma';
import {
  INACTIVITY_LIMIT_DAYS,
  INACTIVITY_WARN_1_DAYS,
  INACTIVITY_WARN_2_DAYS,
} from '../lib/referralRules';
import { notify } from './notifications';

// ============================================================
// INACTIVIDAD DE MIEMBROS PREMIERE
// Reglamento: un Premiere sin referidos nuevos por 90 días causa baja
// (SUSPENDED). Avisos a los 60 y 80 días. Elite no aplica.
// La "fecha base" de inactividad es lastReferralAt; si nunca refirió, createdAt.
// ============================================================

const DAY = 24 * 60 * 60 * 1000;

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / DAY);
}

/** Procesa avisos y bajas por inactividad. Pensado para el cron diario. */
export async function processInactivity(): Promise<{
  warned: number;
  suspended: number;
}> {
  const candidates = await prisma.referralMember.findMany({
    where: { status: 'PREMIERE' },
    select: { id: true, createdAt: true, lastReferralAt: true, inactiveSince: true },
  });

  let warned = 0;
  let suspended = 0;

  for (const m of candidates) {
    const base = m.lastReferralAt ?? m.createdAt;
    const days = daysSince(base);

    if (days >= INACTIVITY_LIMIT_DAYS) {
      await prisma.referralMember.update({
        where: { id: m.id },
        data: { status: 'SUSPENDED', inactiveSince: m.inactiveSince ?? base },
      });
      await notify(
        m.id,
        'inactivity_warning',
        'Cuenta suspendida por inactividad',
        `Pasaron ${INACTIVITY_LIMIT_DAYS} días sin referidos nuevos. Tu cuenta quedó suspendida; contáctanos para reactivarla.`,
      );
      suspended++;
    } else if (days >= INACTIVITY_WARN_2_DAYS) {
      await notify(
        m.id,
        'inactivity_warning',
        '⚠️ URGENTE: tu cuenta está por suspenderse',
        `Te quedan ${INACTIVITY_LIMIT_DAYS - days} días para referir a alguien y mantener tu cuenta activa.`,
      );
      warned++;
    } else if (days >= INACTIVITY_WARN_1_DAYS) {
      await notify(
        m.id,
        'inactivity_warning',
        'Mantén tu cuenta activa',
        `Llevas ${days} días sin referidos. Te quedan ${INACTIVITY_LIMIT_DAYS - days} días para evitar la suspensión.`,
      );
      warned++;
    }
  }

  return { warned, suspended };
}

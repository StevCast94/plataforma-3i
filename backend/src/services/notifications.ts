import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../prisma';

type Db = PrismaClient | Prisma.TransactionClient;

export type NotificationType =
  | 'new_referral'
  | 'first_purchase'
  | 'commission_confirmed'
  | 'payout_processed'
  | 'elite_ascension'
  | 'inactivity_warning';

/** Crea una notificación para un miembro. Acepta un cliente de transacción. */
export async function notify(
  memberId: string,
  type: NotificationType,
  title: string,
  body: string,
  db: Db = prisma,
): Promise<void> {
  await db.notification.create({
    data: { memberId, type, title, body },
  });
}

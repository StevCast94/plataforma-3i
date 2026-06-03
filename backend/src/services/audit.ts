import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../prisma';

type Db = PrismaClient | Prisma.TransactionClient;

/** Registra una acción del staff en el audit log. Nunca lanza (best-effort). */
export async function audit(
  staffId: string | undefined,
  action: string,
  entity: string,
  entityId?: string | null,
  details?: Record<string, unknown>,
  db: Db = prisma,
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        staffId: staffId ?? null,
        action,
        entity,
        entityId: entityId ?? null,
        details: (details ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (err) {
    console.error('audit log error', err);
  }
}

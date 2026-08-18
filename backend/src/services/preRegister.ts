import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../prisma';
import { generateReferralCode, generateReferralSlug } from '../lib/referralRules';

type Db = PrismaClient | Prisma.TransactionClient;

function publicBase(): string {
  return process.env.PUBLIC_BASE_URL ?? 'https://plataforma-3i-production.up.railway.app';
}

export interface ProvisionalResult {
  memberId: string;
  referralCode: string;
  created: boolean;
  alreadyClaimed: boolean;
}

/**
 * Pre-registro SIN contraseña: cuando alguien pide info / reserva, queda como
 * miembro provisional (status PENDING, claimed=false, código generado pero
 * inactivo). Más tarde "reclama" su oficina creando su contraseña con el mismo
 * email → se activa su código de referidor. Idempotente por email.
 * Guarda `referredByCode` para atribuir su referidor al momento de reclamar.
 */
export async function ensureProvisionalMember(
  input: { fullName: string; email: string; phone?: string | null; referredByCode?: string | null },
  db: Db = prisma,
): Promise<ProvisionalResult> {
  const email = input.email.toLowerCase().trim();

  const existing = await db.referralMember.findUnique({
    where: { email },
    select: { id: true, referralCode: true, claimed: true },
  });
  if (existing) {
    return {
      memberId: existing.id,
      referralCode: existing.referralCode,
      created: false,
      alreadyClaimed: existing.claimed,
    };
  }

  // Código único (reintento ante colisión improbable).
  let code = generateReferralCode('PREMIERE');
  for (let i = 0; i < 5; i++) {
    const ex = await db.referralMember.findUnique({ where: { referralCode: code }, select: { id: true } });
    if (!ex) break;
    code = generateReferralCode('PREMIERE');
  }

  let slug = generateReferralSlug(input.fullName);
  for (let i = 0; i < 5; i++) {
    const ex = await db.referralMember.findUnique({ where: { referralSlug: slug }, select: { id: true } });
    if (!ex) break;
    slug = generateReferralSlug(input.fullName);
  }

  const member = await db.referralMember.create({
    data: {
      fullName: input.fullName.trim(),
      email,
      phone: input.phone ? String(input.phone).trim() : null,
      passwordHash: null,
      docId: null,
      status: 'PENDING',
      claimed: false,
      referredByCode: input.referredByCode ?? null,
      referralCode: code,
      referralSlug: slug,
    },
    select: { id: true, referralCode: true },
  });

  await db.referralLink.create({
    data: { memberId: member.id, code, fullUrl: `${publicBase()}/r/${slug}` },
  });

  return { memberId: member.id, referralCode: member.referralCode, created: true, alreadyClaimed: false };
}

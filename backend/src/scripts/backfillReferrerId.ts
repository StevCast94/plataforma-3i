/**
 * Backfill: rellena ReferralMember.referrerId a partir de las filas Referral
 * de nivel 1 ya existentes. Necesario para socios registrados ANTES del fix que
 * persistía referrerId en la atribución (sin esto, el 2do nivel de comisiones
 * nunca se calculaba porque referrer.referrerId estaba en null).
 *
 * Ejecutar una sola vez:  npx tsx src/scripts/backfillReferrerId.ts
 * Es idempotente: solo toca socios con referrerId nulo.
 */
import { prisma } from '../prisma';

async function main() {
  // PASE 1 — rellenar referrerId en TODOS los socios que lo tengan nulo,
  // derivándolo de su fila Referral de nivel 1.
  const missing = await prisma.referralMember.findMany({
    where: { referrerId: null },
    select: { id: true },
  });

  let fixed = 0;
  for (const m of missing) {
    const level1 = await prisma.referral.findFirst({
      where: { referredId: m.id, level: 1 },
      select: { referrerId: true },
    });
    if (!level1) continue;
    await prisma.referralMember.update({
      where: { id: m.id },
      data: { referrerId: level1.referrerId },
    });
    fixed++;
  }

  // PASE 2 — ya con todos los referrerId poblados, reconstruir las filas
  // Referral de 2do nivel faltantes (referido ← referidor del referidor).
  let createdL2 = 0;
  const all = await prisma.referralMember.findMany({
    where: { referrerId: { not: null } },
    select: { id: true, referrerId: true },
  });
  for (const m of all) {
    const referrer = await prisma.referralMember.findUnique({
      where: { id: m.referrerId! },
      select: { referrerId: true },
    });
    if (!referrer?.referrerId) continue;
    const existsL2 = await prisma.referral.findFirst({
      where: { referredId: m.id, level: 2 },
      select: { id: true },
    });
    if (existsL2) continue;
    await prisma.referral.create({
      data: {
        referrerId: referrer.referrerId,
        referredId: m.id,
        level: 2,
        attributionMethod: 'backfill',
        status: 'active',
      },
    });
    createdL2++;
  }

  console.log(`✔ referrerId rellenado en ${fixed} socios. Filas Referral N2 creadas: ${createdL2}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

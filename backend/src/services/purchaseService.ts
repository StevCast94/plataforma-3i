import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { createCommission } from './commissionCalculator';
import { notify } from './notifications';
import { upgradeToElite } from './tierService';
import {
  grantTravelMembershipOnPurchase,
  revokeTravelMembershipForPurchase,
} from '../travel/membershipGrant';

/**
 * Si el comprador es un socio, devuelve el Referral (nivel dado) que lo vincula
 * con `referrerId` y marca su primera compra. Permite que la comisión por
 * checkout se refleje en la vista "Mi Red" (que agrupa por referralId) y que
 * la columna "Compra" deje de aparecer vacía.
 */
async function linkReferralForPurchase(
  tx: Prisma.TransactionClient,
  buyerMemberId: string | null,
  referrerId: string,
  level: 1 | 2,
): Promise<string | null> {
  if (!buyerMemberId) return null;
  const referral = await tx.referral.findFirst({
    where: { referrerId, referredId: buyerMemberId, level },
    select: { id: true, firstPurchaseAt: true },
  });
  if (!referral) return null;
  if (!referral.firstPurchaseAt) {
    await tx.referral.update({
      where: { id: referral.id },
      data: { firstPurchaseAt: new Date(), status: 'active' },
    });
  }
  return referral.id;
}

/**
 * Confirma una compra y genera la(s) comisión(es) al referidor.
 *
 * Nota de diseño: el comprador de un checkout es un cliente arbitrario (no
 * necesariamente un ReferralMember), por lo que NO existe un Referral
 * miembro-a-miembro que `processReferredPurchase` pueda usar. Por eso
 * generamos la comisión directamente al `referrerId` de la compra,
 * reutilizando el MISMO calculador (`createCommission` / `computeCommission`)
 * — no se duplica la lógica de cálculo, hold ni límite mensual.
 *
 * Nivel 1 → el dueño del código de referido. Nivel 2 → su referidor.
 * Todo dentro de una transacción atómica.
 */
export async function confirmPurchase(purchaseId: string): Promise<{
  status: string;
  commissionsCreated: number;
}> {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        product: {
          select: {
            type: true,
            id: true,
            commissionType: true,
            commissionFixedPremiere: true,
            commissionFixedElite: true,
          },
        },
      },
    });
    if (!purchase) throw new Error('Compra no encontrada');
    if (purchase.status === 'confirmed' || purchase.status === 'completed') {
      return { status: purchase.status, commissionsCreated: 0 };
    }
    if (purchase.status === 'cancelled') {
      throw new Error('La compra está cancelada');
    }

    await tx.purchase.update({
      where: { id: purchaseId },
      data: { status: 'confirmed', confirmedAt: new Date() },
    });

    // ¿El comprador es un socio? (para atribuir referral + ascenso a ELITE)
    const buyerMember = await tx.referralMember.findUnique({
      where: { email: purchase.customerEmail.toLowerCase().trim() },
      select: { id: true },
    });

    // Hacer una compra sube al comprador a ELITE (lo ya ganado queda tal cual).
    if (buyerMember) {
      await upgradeToElite(tx, buyerMember.id, 'compra realizada');
    }

    let created = 0;
    if (purchase.referrerId) {
      const referrer = await tx.referralMember.findUnique({
        where: { id: purchase.referrerId },
        select: { id: true, status: true, referrerId: true },
      });

      if (referrer && referrer.status !== 'SUSPENDED') {
        // Nivel 1 — dueño del código
        const referralId1 = await linkReferralForPurchase(tx, buyerMember?.id ?? null, referrer.id, 1);
        const c1 = await createCommission(
          {
            memberId: referrer.id,
            memberStatus: referrer.status === 'ELITE' ? 'ELITE' : 'PREMIERE',
            purchaseId: purchase.id,
            referralId: referralId1,
            level: 1,
            productType: purchase.product.type,
            netPrice: purchase.amount,
            productId: purchase.product.id,
            commissionType: purchase.product.commissionType,
            commissionFixedPremiere: purchase.product.commissionFixedPremiere,
            commissionFixedElite: purchase.product.commissionFixedElite,
          },
          tx,
        );
        if (c1) {
          created++;
          await notify(
            referrer.id,
            'commission_confirmed',
            'Nueva comisión generada 💰',
            `Tu referido confirmó una compra. Comisión registrada por $${c1.amount}.`,
            tx,
          );
        }

        // Nivel 2 — referidor del referidor
        if (referrer.referrerId) {
          const grand = await tx.referralMember.findUnique({
            where: { id: referrer.referrerId },
            select: { id: true, status: true },
          });
          if (grand && grand.status !== 'SUSPENDED') {
            const referralId2 = await linkReferralForPurchase(tx, buyerMember?.id ?? null, grand.id, 2);
            const c2 = await createCommission(
              {
                memberId: grand.id,
                memberStatus: grand.status === 'ELITE' ? 'ELITE' : 'PREMIERE',
                purchaseId: purchase.id,
                referralId: referralId2,
                level: 2,
                productType: purchase.product.type,
                netPrice: purchase.amount,
                productId: purchase.product.id,
                commissionType: purchase.product.commissionType,
                commissionFixedPremiere: purchase.product.commissionFixedPremiere,
                commissionFixedElite: purchase.product.commissionFixedElite,
              },
              tx,
            );
            if (c2) {
              created++;
              await notify(
                grand.id,
                'commission_confirmed',
                'Comisión de 2º nivel generada 💰',
                `Un referido de tu red confirmó una compra. Comisión registrada por $${c2.amount}.`,
                tx,
              );
            }
          }
        }
      }
    }

    // V3 — Si es membresía de viajes, otorgar el ACCESO al motor (source=PURCHASE).
    // Best-effort: no rompe la confirmación si el comprador no tiene cuenta de socio.
    if (purchase.product.type === 'TRAVEL_MEMBERSHIP') {
      await grantTravelMembershipOnPurchase(tx, {
        customerEmail: purchase.customerEmail,
        purchaseId: purchase.id,
      });
    }

    // DOBLE INCENTIVO — Si el comprador ENTRÓ por un referido y compró un
    // producto INMOBILIARIO, se le regala (al referido) una membresía de viajes
    // (source=REWARD). Idempotente: no duplica si ya tiene una activa.
    const isRealEstate = purchase.product.type !== 'TRAVEL_MEMBERSHIP';
    if (isRealEstate && purchase.referrerId) {
      await grantTravelMembershipOnPurchase(tx, {
        customerEmail: purchase.customerEmail,
        purchaseId: purchase.id,
        source: 'REWARD',
        note: `Premio referido · compra ${purchase.id}`,
      });
    }

    return { status: 'confirmed', commissionsCreated: created };
  });
}

/**
 * Cancela una compra y reversa las comisiones que haya generado
 * (marca REVERSED y descuenta del wallet si ya se habían acreditado).
 */
export async function cancelPurchase(purchaseId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({ where: { id: purchaseId } });
    if (!purchase) throw new Error('Compra no encontrada');

    const commissions = await tx.commission.findMany({
      where: { purchaseId, status: { not: 'REVERSED' } },
      select: { id: true, memberId: true, amount: true, status: true },
    });

    for (const c of commissions) {
      // Si ya estaba pagada/liquidada y acreditada al wallet, revertir el saldo.
      if (c.status === 'PAID' || c.status === 'LIQUIDATED') {
        await tx.referralMember.update({
          where: { id: c.memberId },
          data: { walletBalance: { decrement: c.amount } },
        });
      }
      await tx.commission.update({ where: { id: c.id }, data: { status: 'REVERSED' } });
    }

    // V3 — Revocar el acceso al club de viajes si esta compra lo había otorgado.
    await revokeTravelMembershipForPurchase(tx, purchaseId);

    await tx.purchase.update({
      where: { id: purchaseId },
      data: { status: 'cancelled' },
    });
  });
}

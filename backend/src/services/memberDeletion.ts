import { prisma } from '../prisma';
import { deleteKycDocuments } from '../lib/kycStorage';

export interface DeleteMemberResult {
  deleted: boolean;
  reason?: string;
}

/**
 * Elimina COMPLETAMENTE un socio (uso: corregir un registro mal hecho en
 * pruebas, para poder volver a registrarse desde el link correcto).
 *
 * Protecciones:
 * - Bloquea el borrado si tiene comisiones PAID o LIQUIDATED (dinero ya
 *   acreditado/pagado) — en ese caso usar "Suspender", nunca borrar historial
 *   financiero real. Devuelve { deleted: false, reason }.
 * - Preserva ventas y reservas reales (Purchase, TravelBooking): se
 *   desvincula el FK (referrerId/memberId → null) en vez de borrarlas.
 * - Libera email y documento para que la persona pueda volver a registrarse
 *   (ambos son @unique en el schema).
 * - Si otros socios lo tenían como SU referidor (referrerId), se desvincula
 *   (no se puede inferir con seguridad un nuevo upline).
 */
export async function deleteMemberCompletely(memberId: string): Promise<DeleteMemberResult> {
  const member = await prisma.referralMember.findUnique({
    where: { id: memberId },
    select: { id: true, email: true, fullName: true },
  });
  if (!member) return { deleted: false, reason: 'Miembro no encontrado' };

  const financiallyLocked = await prisma.commission.count({
    where: { memberId, status: { in: ['PAID', 'LIQUIDATED'] } },
  });
  if (financiallyLocked > 0) {
    return {
      deleted: false,
      reason:
        'Tiene comisiones pagadas o liquidadas: no se puede eliminar (se perdería historial financiero). Usa "Suspender" en su lugar.',
    };
  }

  await prisma.$transaction(async (tx) => {
    // 1. Preservar ventas/reservas reales — solo se quita la atribución.
    await tx.purchase.updateMany({ where: { referrerId: memberId }, data: { referrerId: null } });
    await tx.travelBooking.updateMany({ where: { memberId }, data: { memberId: null } });

    // 2. Comisiones de OTROS miembros que apuntaban a una fila Referral donde
    //    este miembro participaba: desvincular el link (NO se toca esa
    //    comisión ni el dinero de su dueño, solo se limpia la referencia).
    const relatedReferrals = await tx.referral.findMany({
      where: { OR: [{ referrerId: memberId }, { referredId: memberId }] },
      select: { id: true },
    });
    const relatedIds = relatedReferrals.map((r) => r.id);
    if (relatedIds.length) {
      await tx.commission.updateMany({
        where: { referralId: { in: relatedIds } },
        data: { referralId: null },
      });
    }

    // 3. Borrar las filas Referral donde participa (como referrer o referido).
    await tx.referral.deleteMany({ where: { OR: [{ referrerId: memberId }, { referredId: memberId }] } });

    // 4. Si alguien lo tenía como SU referidor, liberar esa cadena.
    await tx.referralMember.updateMany({ where: { referrerId: memberId }, data: { referrerId: null } });

    // 5. Borrar sus propias comisiones (ya garantizado: ninguna PAID/LIQUIDATED).
    await tx.commission.deleteMany({ where: { memberId } });

    // 6. Borrar registros propios sin implicación financiera.
    await tx.payout.deleteMany({ where: { memberId } });
    await tx.notification.deleteMany({ where: { memberId } });
    await tx.referralLink.deleteMany({ where: { memberId } });
    await tx.travelMembership.deleteMany({ where: { memberId } });

    // 7. Rastro social (Fase 4 — userId sin FK Prisma, se limpia manualmente).
    await tx.directMessage.deleteMany({ where: { OR: [{ senderId: memberId }, { receiverId: memberId }] } });
    await tx.socialReaction.deleteMany({ where: { userId: memberId } });
    await tx.socialComment.deleteMany({ where: { userId: memberId } });
    await tx.socialPost.deleteMany({ where: { userId: memberId } });
    await tx.socialGroupMember.deleteMany({ where: { userId: memberId } });
    await tx.socialEventAttendee.deleteMany({ where: { userId: memberId } });

    // 8. Finalmente, el miembro. Email y documento quedan libres para
    //    volver a registrarse (ambos son @unique).
    await tx.referralMember.delete({ where: { id: memberId } });
  });

  // Fuera de la transacción (llamada externa a Cloudinary, no es atómica con
  // la BD): borra la cédula/pasaporte/selfie si había subido alguno.
  await deleteKycDocuments(memberId);

  return { deleted: true };
}

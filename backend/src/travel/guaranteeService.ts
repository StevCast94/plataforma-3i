import { prisma } from '../prisma';
import { notify } from '../services/notifications';
import { BookingError } from './bookingService';

// ============================================================
// FASE 5 V4 — Garantía de mejor precio.
// El socio reclama contra una reserva CONFIRMADA adjuntando el precio rival.
// `ourCents` se toma del total real de la reserva (no se confía en el cliente).
// El admin aprueba/rechaza. Es una herramienta de confianza: como el piso del
// precio es la tarifa neta, el reclamo rara vez se activa, pero queda auditable.
// ============================================================

export interface SubmitClaimInput {
  bookingId: string;
  memberId: string;
  competitorUrl: string;
  claimedCents: number;
  evidenceUrl?: string | null;
}

export async function submitClaim(input: SubmitClaimInput) {
  const url = String(input.competitorUrl ?? '').trim();
  if (!url) throw new BookingError('La URL del precio de la competencia es requerida');
  const claimedCents = Math.round(Number(input.claimedCents));
  if (!Number.isFinite(claimedCents) || claimedCents <= 0) {
    throw new BookingError('El precio reclamado no es válido');
  }

  const booking = await prisma.travelBooking.findUnique({
    where: { id: input.bookingId },
    select: { id: true, memberId: true, status: true, totalCents: true },
  });
  if (!booking) throw new BookingError('Reserva no encontrada');
  if (booking.memberId !== input.memberId) throw new BookingError('La reserva no es tuya');
  if (booking.status !== 'CONFIRMED') {
    throw new BookingError('Solo puedes reclamar sobre reservas confirmadas');
  }

  return prisma.priceGuaranteeClaim.create({
    data: {
      bookingId: booking.id,
      memberId: input.memberId,
      competitorUrl: url,
      evidenceUrl: input.evidenceUrl ? String(input.evidenceUrl).trim() : null,
      claimedCents,
      ourCents: booking.totalCents,
      status: 'open',
    },
  });
}

export async function listMemberClaims(memberId: string) {
  return prisma.priceGuaranteeClaim.findMany({
    where: { memberId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function listClaims(status?: string) {
  return prisma.priceGuaranteeClaim.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}

/** Resuelve un reclamo (admin). status: approved | rejected. */
export async function resolveClaim(id: string, status: 'approved' | 'rejected', resolution?: string) {
  const claim = await prisma.priceGuaranteeClaim.update({
    where: { id },
    data: { status, resolution: resolution ? String(resolution) : null },
  });
  if (claim.memberId) {
    await notify(
      claim.memberId,
      'commission_confirmed',
      status === 'approved' ? 'Garantía de precio aprobada ✅' : 'Garantía de precio revisada',
      status === 'approved'
        ? `Tu reclamo fue aprobado. ${resolution ?? 'Te contactaremos para el ajuste.'}`
        : `Tu reclamo no procedió. ${resolution ?? ''}`.trim(),
    );
  }
  return claim;
}

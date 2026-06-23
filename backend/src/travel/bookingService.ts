import type { TravelBooking } from '@prisma/client';
import { prisma } from '../prisma';
import { priceFromNet } from './markupEngine';
import { hasTravelAccess } from './membershipAccess';
import { getRawOffer, getHotelAdapter } from './searchService';
import { getPaymentProvider } from './payments';
import { sendBookingVoucher } from './email';
import { resolveReferrer } from '../services/referralTracking';
import { notify } from '../services/notifications';
import type { HotelQuery } from './types';

// ============================================================
// FASE 5 V2 — Servicio de reservas. El PRECIO lo decide el servidor (re-deriva
// la tarifa neta desde el rateKey); nunca se confía en el monto del cliente.
// Flujo: createBooking (PENDING_PAYMENT) -> confirmBooking (CONFIRMED + voucher).
// La comisión a la red de referidos se conecta en V3 (referrerId ya se guarda).
// ============================================================

/** Error de negocio (→ 400). Otros errores caen a 500. */
export class BookingError extends Error {}

/**
 * Quita los campos internos que NUNCA deben salir al cliente: la tarifa neta,
 * el markup, el reparto al propietario y el id del referidor. Aplicar SIEMPRE
 * antes de responder una reserva.
 */
export function toPublicBooking(b: TravelBooking) {
  const { netCents: _n, markupCents: _m, ownerPayoutCents: _o, referrerId: _r, ...safe } = b;
  return safe;
}

export interface CreateBookingInput {
  query: HotelQuery;
  rateKey: string;
  customer: { name: string; email: string; phone?: string | null };
  memberId?: string | null;
  referralCode?: string | null;
}

const VOUCHER_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function voucherCode(): string {
  let s = '';
  for (let i = 0; i < 6; i++) s += VOUCHER_CHARS[Math.floor(Math.random() * VOUCHER_CHARS.length)];
  return `3IV-${s}`;
}

export async function createBooking(input: CreateBookingInput) {
  const { query, rateKey, customer } = input;
  if (!customer?.name || !customer?.email) {
    throw new BookingError('Nombre y email del huésped son requeridos');
  }

  // 1) Revalidar tarifa y recuperar la NETA (autoritativa).
  const raw = await getRawOffer(query, rateKey);
  if (!raw) throw new BookingError('La tarifa ya no está disponible. Vuelve a buscar.');

  // 2) Precio según acceso de socio.
  const isMember = await hasTravelAccess(input.memberId);
  const { publicCents, memberCents } = priceFromNet(raw.netCents);
  const totalCents = isMember ? memberCents : publicCents;
  const markupCents = totalCents - raw.netCents;

  // 3) Atribución de referido (la comisión se genera en V3).
  let referrerId: string | null = null;
  if (input.referralCode) {
    const ref = await resolveReferrer(String(input.referralCode).trim());
    referrerId = ref?.id ?? null;
  }

  // 4) Crear la reserva en PENDING_PAYMENT.
  const booking = await prisma.travelBooking.create({
    data: {
      kind: 'HOTEL',
      supplier: raw.supplier,
      status: 'PENDING_PAYMENT',
      memberId: input.memberId ?? null,
      customerName: customer.name.trim(),
      customerEmail: customer.email.trim(),
      customerPhone: customer.phone ? String(customer.phone).trim() : null,
      netCents: raw.netCents,
      markupCents,
      totalCents,
      currency: raw.currency,
      referralCode: input.referralCode ?? null,
      referrerId,
      details: {
        name: raw.name,
        city: raw.city,
        country: raw.country,
        stars: raw.stars,
        image: raw.image,
        amenities: raw.amenities,
        refundable: raw.refundable,
        nights: raw.nights,
        checkIn: query.checkIn,
        checkOut: query.checkOut,
        guests: query.guests,
        isMemberPrice: isMember,
        publicCents,
        memberCents,
        // Guardamos el rateKey revalidado y la query para reservar en firme al
        // confirmar el pago (con RateHawk: book_hash del prebook).
        rateKey: raw.rateKey,
        query: {
          destination: query.destination,
          checkIn: query.checkIn,
          checkOut: query.checkOut,
          guests: query.guests,
        },
      },
    },
  });

  // 5) Iniciar el cobro con la pasarela.
  const payment = await getPaymentProvider().create({
    amountCents: totalCents,
    currency: raw.currency,
    reference: booking.id,
    description: `Reserva ${raw.name} (${query.checkIn} → ${query.checkOut})`,
    email: customer.email,
    phone: customer.phone ?? undefined,
  });

  await prisma.travelBooking.update({
    where: { id: booking.id },
    data: { paymentRef: payment.paymentRef },
  });

  return { booking: toPublicBooking({ ...booking, paymentRef: payment.paymentRef }), payment };
}

export async function confirmBooking(bookingId: string, transactionId?: string) {
  const booking = await prisma.travelBooking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new BookingError('Reserva no encontrada');
  if (booking.status === 'CONFIRMED') return toPublicBooking(booking); // idempotente
  if (booking.status !== 'PENDING_PAYMENT' && booking.status !== 'PAID') {
    throw new BookingError('La reserva no está en un estado pagable');
  }

  // 1) Confirmar el cobro con la pasarela.
  const pay = await getPaymentProvider().confirm({
    paymentRef: booking.paymentRef ?? '',
    transactionId,
  });
  if (!pay.approved) {
    throw new BookingError('El pago no fue aprobado');
  }

  // 2) Reservar en firme con el proveedor. Si el adapter soporta bookHotel
  //    (RateHawk), usamos su localizador real; si no (mock), generamos voucher.
  const details = (booking.details ?? {}) as {
    name?: string;
    rateKey?: string;
    query?: HotelQuery;
  };
  let supplierRef = voucherCode();
  const adapter = getHotelAdapter();
  if (adapter.bookHotel && details.rateKey && details.query) {
    try {
      const result = await adapter.bookHotel({
        rateKey: details.rateKey,
        query: details.query,
        orderId: booking.id,
        customer: {
          name: booking.customerName,
          email: booking.customerEmail,
          phone: booking.customerPhone,
        },
      });
      supplierRef = result.supplierRef;
    } catch (err) {
      // El pago ya se aprobó: dejamos la reserva en PAID para resolución manual
      // en lugar de perder el cobro. El admin completa la reserva con el proveedor.
      console.error('bookHotel falló tras pago aprobado', err);
      await prisma.travelBooking.update({
        where: { id: booking.id },
        data: { status: 'PAID' },
      });
      throw new BookingError(
        'Tu pago fue recibido pero la confirmación con el proveedor está pendiente. Te contactaremos en breve.',
      );
    }
  }

  const confirmed = await prisma.travelBooking.update({
    where: { id: booking.id },
    data: {
      status: 'CONFIRMED',
      supplierRef,
      confirmedAt: new Date(),
    },
  });

  // Voucher por correo (best-effort; no rompe la confirmación si falla).
  sendBookingVoucher({
    to: booking.customerEmail,
    customerName: booking.customerName,
    hotelName: details.name ?? 'tu reserva',
    voucher: supplierRef,
    totalCents: booking.totalCents,
    currency: booking.currency,
    details: booking.details,
  }).catch((err) => console.error('sendBookingVoucher', err));

  if (booking.memberId) {
    await notify(
      booking.memberId,
      'first_purchase',
      '¡Reserva confirmada! 🧳',
      `Tu reserva en ${details.name ?? 'el hotel'} está confirmada. Voucher: ${supplierRef}.`,
    );
  }

  return toPublicBooking(confirmed);
}

export async function getBookingForVoucher(bookingId: string, email?: string) {
  const booking = await prisma.travelBooking.findUnique({ where: { id: bookingId } });
  if (!booking) return null;
  // Privacidad: el voucher es accesible por el socio dueño o por email del huésped.
  if (email && booking.customerEmail.toLowerCase() !== email.toLowerCase()) return null;
  return toPublicBooking(booking);
}

export async function listMemberBookings(memberId: string) {
  const items = await prisma.travelBooking.findMany({
    where: { memberId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return items.map(toPublicBooking);
}

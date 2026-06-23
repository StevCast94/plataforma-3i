import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { optionalMember, authMember, type MemberRequest } from '../middleware/authMember';
import { searchHotels } from '../travel/searchService';
import { searchFlights } from '../travel/flightSearchService';
import {
  createBooking,
  confirmBooking,
  getBookingForVoucher,
  listMemberBookings,
  BookingError,
} from '../travel/bookingService';
import { submitClaim, listMemberClaims } from '../travel/guaranteeService';

// ============================================================
// FASE 5 — Rutas públicas del Motor de Viajes.
// optionalMember: si hay token de socio válido, se aplica precio de socio;
// si no, precio público. La búsqueda funciona sin BD (mock + markup por env).
// ============================================================

export const travelRoutes = Router();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/travel/hotels?destination=&checkIn=&checkOut=&guests=
travelRoutes.get(
  '/hotels',
  optionalMember,
  asyncHandler(async (req: MemberRequest, res) => {
    const destination = String(req.query.destination ?? '').trim();
    const checkIn = String(req.query.checkIn ?? '').trim();
    const checkOut = String(req.query.checkOut ?? '').trim();
    const guests = Math.max(1, Math.min(12, Number(req.query.guests) || 2));

    if (!destination) {
      res.status(400).json({ error: 'destination es requerido' });
      return;
    }
    if (!DATE_RE.test(checkIn) || !DATE_RE.test(checkOut)) {
      res.status(400).json({ error: 'checkIn y checkOut deben ser fechas YYYY-MM-DD' });
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      res.status(400).json({ error: 'checkOut debe ser posterior a checkIn' });
      return;
    }

    const result = await searchHotels(
      { destination, checkIn, checkOut, guests },
      { memberId: req.memberId },
    );
    res.json(result);
  }),
);

// GET /api/travel/flights?origin=&destination=&departDate=&returnDate=&passengers=
travelRoutes.get(
  '/flights',
  optionalMember,
  asyncHandler(async (req: MemberRequest, res) => {
    const origin = String(req.query.origin ?? '').trim();
    const destination = String(req.query.destination ?? '').trim();
    const departDate = String(req.query.departDate ?? '').trim();
    const returnDate = req.query.returnDate ? String(req.query.returnDate).trim() : undefined;
    const passengers = Math.max(1, Math.min(9, Number(req.query.passengers) || 1));

    if (!origin || !destination) {
      res.status(400).json({ error: 'origin y destination son requeridos' });
      return;
    }
    if (!DATE_RE.test(departDate)) {
      res.status(400).json({ error: 'departDate debe ser YYYY-MM-DD' });
      return;
    }
    if (returnDate && (!DATE_RE.test(returnDate) || new Date(returnDate) < new Date(departDate))) {
      res.status(400).json({ error: 'returnDate inválida' });
      return;
    }

    const result = await searchFlights(
      { origin, destination, departDate, returnDate, passengers },
      { memberId: req.memberId },
    );
    res.json(result);
  }),
);

// ============================================================
// FASE 5 V2 — Reservas (con pago + voucher).
// ============================================================

// POST /api/travel/bookings — crea la reserva (PENDING_PAYMENT) e inicia el cobro.
travelRoutes.post(
  '/bookings',
  optionalMember,
  asyncHandler(async (req: MemberRequest, res) => {
    const b = req.body ?? {};
    const destination = String(b.destination ?? '').trim();
    const checkIn = String(b.checkIn ?? '').trim();
    const checkOut = String(b.checkOut ?? '').trim();
    const guests = Math.max(1, Math.min(12, Number(b.guests) || 2));
    const rateKey = String(b.rateKey ?? '').trim();
    const customer = b.customer ?? {};

    if (!destination || !DATE_RE.test(checkIn) || !DATE_RE.test(checkOut) || !rateKey) {
      res.status(400).json({ error: 'Faltan datos de la reserva (destino, fechas, rateKey)' });
      return;
    }

    try {
      const result = await createBooking({
        query: { destination, checkIn, checkOut, guests },
        rateKey,
        customer: { name: customer.name, email: customer.email, phone: customer.phone },
        memberId: req.memberId,
        referralCode: b.referralCode ?? null,
      });
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof BookingError) {
        res.status(400).json({ error: err.message });
        return;
      }
      throw err;
    }
  }),
);

// POST /api/travel/bookings/:id/confirm — confirma el pago y emite el voucher.
travelRoutes.post(
  '/bookings/:id/confirm',
  optionalMember,
  asyncHandler(async (req: MemberRequest, res) => {
    try {
      const booking = await confirmBooking(req.params.id, req.body?.transactionId);
      res.json(booking);
    } catch (err) {
      if (err instanceof BookingError) {
        res.status(400).json({ error: err.message });
        return;
      }
      throw err;
    }
  }),
);

// GET /api/travel/payphone/callback?id=&clientTransactionId= — retorno de PayPhone.
// Confirma el pago y redirige al SPA con el resultado. Debe confirmarse en <5min.
travelRoutes.get(
  '/payphone/callback',
  asyncHandler(async (req, res) => {
    const id = req.query.id ? String(req.query.id) : undefined;
    const bookingId = String(req.query.clientTransactionId ?? '').trim();
    const base = process.env.PUBLIC_BASE_URL ?? 'https://plataforma-3i-production.up.railway.app';
    if (!bookingId) {
      res.redirect(`${base}/#/club/viajes?pago=error`);
      return;
    }
    try {
      await confirmBooking(bookingId, id);
      res.redirect(`${base}/#/club/viajes?pago=ok&reserva=${encodeURIComponent(bookingId)}`);
    } catch (err) {
      console.error('payphone callback', err);
      res.redirect(`${base}/#/club/viajes?pago=fallido&reserva=${encodeURIComponent(bookingId)}`);
    }
  }),
);

// GET /api/travel/bookings/mine — reservas del socio logueado.
travelRoutes.get(
  '/bookings/mine',
  authMember,
  asyncHandler(async (req: MemberRequest, res) => {
    res.json(await listMemberBookings(req.memberId!));
  }),
);

// ============================================================
// FASE 5 V4 — Garantía de mejor precio (socio).
// ============================================================

// POST /api/travel/guarantee — el socio reclama sobre una reserva confirmada.
travelRoutes.post(
  '/guarantee',
  authMember,
  asyncHandler(async (req: MemberRequest, res) => {
    const b = req.body ?? {};
    try {
      const claim = await submitClaim({
        bookingId: String(b.bookingId ?? ''),
        memberId: req.memberId!,
        competitorUrl: b.competitorUrl,
        claimedCents: b.claimedCents,
        evidenceUrl: b.evidenceUrl ?? null,
      });
      res.status(201).json(claim);
    } catch (err) {
      if (err instanceof BookingError) {
        res.status(400).json({ error: err.message });
        return;
      }
      throw err;
    }
  }),
);

// GET /api/travel/guarantee/mine — reclamos del socio.
travelRoutes.get(
  '/guarantee/mine',
  authMember,
  asyncHandler(async (req: MemberRequest, res) => {
    res.json(await listMemberClaims(req.memberId!));
  }),
);

// GET /api/travel/bookings/:id?email= — voucher (dueño socio o email del huésped).
travelRoutes.get(
  '/bookings/:id',
  optionalMember,
  asyncHandler(async (req: MemberRequest, res) => {
    const email = req.query.email ? String(req.query.email) : undefined;
    const booking = await getBookingForVoucher(req.params.id, email);
    if (!booking) {
      res.status(404).json({ error: 'Reserva no encontrada' });
      return;
    }
    res.json(booking);
  }),
);

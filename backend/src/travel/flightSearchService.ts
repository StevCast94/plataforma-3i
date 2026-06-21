import type { FlightAdapter } from './adapters/FlightAdapter';
import { MockFlightAdapter } from './adapters/mockFlightAdapter';
import { priceFromNet } from './markupEngine';
import { hasTravelAccess } from './membershipAccess';
import type { FlightQuery, FlightSearchResult, PricedFlightOffer } from './types';

// ============================================================
// FASE 5 V5 — Búsqueda de vuelos. Reutiliza el MISMO markup y gating de socio
// que los hoteles. La tarifa neta no sale del backend.
// ============================================================

function getFlightAdapter(): FlightAdapter {
  // if (process.env.DUFFEL_TOKEN) return new DuffelAdapter();
  return new MockFlightAdapter();
}

export async function searchFlights(
  query: FlightQuery,
  opts: { memberId?: string | null } = {},
): Promise<FlightSearchResult> {
  const adapter = getFlightAdapter();
  const [raw, isMember] = await Promise.all([
    adapter.searchFlights(query),
    hasTravelAccess(opts.memberId),
  ]);

  const offers: PricedFlightOffer[] = raw.map((o) => {
    const { publicCents, memberCents, savingsCents } = priceFromNet(o.netCents);
    return {
      rateKey: o.rateKey,
      supplier: o.supplier,
      airline: o.airline,
      flightNumber: o.flightNumber,
      origin: o.origin,
      destination: o.destination,
      departTime: o.departTime,
      arriveTime: o.arriveTime,
      durationMin: o.durationMin,
      stops: o.stops,
      cabin: o.cabin,
      roundTrip: o.roundTrip,
      currency: o.currency,
      publicCents,
      memberCents,
      priceCents: isMember ? memberCents : publicCents,
      isMemberPrice: isMember,
      savingsCents,
    };
  });

  offers.sort((a, b) => a.priceCents - b.priceCents);
  return { offers, isMember, currency: 'USD', query };
}

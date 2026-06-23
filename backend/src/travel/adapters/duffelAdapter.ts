import type { FlightAdapter } from './FlightAdapter';
import type { FlightQuery, RawFlightOffer } from '../types';

// ============================================================
// Adaptador REAL de Duffel (API v2). Auth: Bearer DUFFEL_TOKEN.
// Headers: Duffel-Version: v2. Dinero de Duffel viene en unidades decimales de
// la moneda (string) → CENTAVOS. Sandbox vs producción lo define el TOKEN
// (token de test 'duffel_test_...' vs live 'duffel_live_...').
//   POST /air/offer_requests?return_offers=true  → búsqueda
//   GET  /air/offers/{id}                          → revalidar oferta
//   POST /air/orders                               → reservar (ticketing)
// El booking de vuelos (instant order + pasajeros + pago balance) se conecta en
// el flujo de reservas; aquí cubrimos búsqueda y revalidación.
// ============================================================

const BASE = 'https://api.duffel.com';

function toCents(amount: string | undefined): number {
  const n = parseFloat(amount ?? '0');
  return Math.round((Number.isFinite(n) ? n : 0) * 100);
}

interface DuffelSegment {
  operating_carrier?: { name?: string; iata_code?: string };
  marketing_carrier_flight_number?: string;
  departing_at?: string;
  arriving_at?: string;
  origin?: { iata_code?: string };
  destination?: { iata_code?: string };
}
interface DuffelSlice {
  segments?: DuffelSegment[];
  duration?: string; // ISO8601 PnDTnHnM
}
interface DuffelOffer {
  id: string;
  total_amount?: string;
  total_currency?: string;
  owner?: { name?: string; iata_code?: string };
  slices?: DuffelSlice[];
  cabin_class?: string;
}

function isoDurationToMin(d?: string): number {
  if (!d) return 0;
  const m = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return 0;
  return (parseInt(m[1] ?? '0', 10) * 60) + parseInt(m[2] ?? '0', 10);
}

export class DuffelAdapter implements FlightAdapter {
  readonly name = 'duffel';
  private token = process.env.DUFFEL_TOKEN ?? '';

  private async req<T>(path: string, method: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Duffel-Version': 'v2',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`Duffel ${path} HTTP ${res.status}: ${t.slice(0, 300)}`);
    }
    const json = (await res.json()) as { data: T };
    return json.data;
  }

  async searchFlights(query: FlightQuery): Promise<RawFlightOffer[]> {
    const slices: Array<{ origin: string; destination: string; departure_date: string }> = [
      { origin: query.origin, destination: query.destination, departure_date: query.departDate },
    ];
    if (query.returnDate) {
      slices.push({ origin: query.destination, destination: query.origin, departure_date: query.returnDate });
    }
    const passengers = Array.from({ length: Math.max(1, query.passengers || 1) }, () => ({ type: 'adult' }));

    const data = await this.req<{ offers?: DuffelOffer[] }>(
      '/air/offer_requests?return_offers=true&supplier_timeout=15000',
      'POST',
      { data: { slices, passengers, cabin_class: 'economy' } },
    );

    const offers = (data.offers ?? []).slice(0, 30);
    return offers.map((o) => {
      const firstSlice = o.slices?.[0];
      const seg = firstSlice?.segments?.[0];
      const lastSeg = firstSlice?.segments?.[firstSlice.segments.length - 1];
      const stops = Math.max(0, (firstSlice?.segments?.length ?? 1) - 1);
      return {
        rateKey: o.id,
        supplier: this.name,
        airline: o.owner?.name ?? seg?.operating_carrier?.name ?? 'Aerolínea',
        flightNumber:
          (seg?.operating_carrier?.iata_code ?? '') + (seg?.marketing_carrier_flight_number ?? ''),
        origin: seg?.origin?.iata_code ?? query.origin,
        destination: lastSeg?.destination?.iata_code ?? query.destination,
        departTime: seg?.departing_at ?? '',
        arriveTime: lastSeg?.arriving_at ?? '',
        durationMin: isoDurationToMin(firstSlice?.duration),
        stops,
        cabin: o.cabin_class ?? 'economy',
        roundTrip: !!query.returnDate,
        netCents: toCents(o.total_amount),
        currency: o.total_currency ?? 'USD',
      };
    });
  }
}

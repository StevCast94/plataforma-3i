import type { FlightAdapter } from './FlightAdapter';
import type { FlightQuery, RawFlightOffer } from '../types';

// ============================================================
// Adaptador MOCK de vuelos — determinista (mismo origen/destino/fecha => mismas
// tarifas). Permite verificar el buscador de vuelos offline. Duffel entra como
// swap directo implementando FlightAdapter.
// ============================================================

const AIRLINES = [
  { name: 'Avianca', code: 'AV', base: 8900, stops: 0, cabin: 'Economy' },
  { name: 'LATAM', code: 'LA', base: 9500, stops: 0, cabin: 'Economy' },
  { name: 'Copa Airlines', code: 'CM', base: 11200, stops: 1, cabin: 'Economy' },
  { name: 'American Airlines', code: 'AA', base: 13800, stops: 1, cabin: 'Economy' },
  { name: 'LATAM Business', code: 'LA', base: 24500, stops: 0, cabin: 'Business' },
];

function seed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function code(s: string): string {
  return (s || 'XXX').trim().slice(0, 3).toUpperCase();
}

export class MockFlightAdapter implements FlightAdapter {
  readonly name = 'mock';

  async searchFlights(query: FlightQuery): Promise<RawFlightOffer[]> {
    const origin = code(query.origin);
    const destination = code(query.destination);
    const roundTrip = !!query.returnDate;
    const pax = Math.max(1, query.passengers || 1);
    const base = seed(`${origin}${destination}${query.departDate}`);

    return AIRLINES.map((a, i) => {
      const factor = 0.9 + ((base + i * 11) % 25) / 100; // 0.90–1.14
      const oneWayNet = Math.round(a.base * factor);
      const netPerPax = roundTrip ? Math.round(oneWayNet * 1.9) : oneWayNet;
      const durationMin = 90 + a.stops * 120 + ((base + i) % 40);
      const departHour = 6 + ((base + i * 3) % 14);
      const arriveMin = departHour * 60 + durationMin;
      const fmt = (mins: number) => {
        const h = Math.floor(mins / 60) % 24;
        const m = mins % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      };
      return {
        rateKey: `mockair:${seed(`${a.code}${a.cabin}${origin}${destination}${query.departDate}${query.returnDate ?? ''}${pax}`)}`,
        supplier: this.name,
        airline: a.name,
        flightNumber: `${a.code}${100 + ((base + i) % 800)}`,
        origin,
        destination,
        departTime: `${query.departDate} ${fmt(departHour * 60)}`,
        arriveTime: `${query.departDate} ${fmt(arriveMin)}`,
        durationMin,
        stops: a.stops,
        cabin: a.cabin,
        roundTrip,
        netCents: netPerPax * pax,
        currency: 'USD',
      };
    });
  }
}

import type { SupplierAdapter } from './SupplierAdapter';
import type { HotelQuery, RawHotelOffer } from '../types';

// ============================================================
// Adaptador MOCK — datos realistas y DETERMINISTAS (mismo destino+fechas =>
// mismas tarifas). Permite construir y verificar TODO el motor offline, sin
// credenciales ni contratos. RateHawk/Duffel entran como swap directo
// implementando la misma interfaz SupplierAdapter.
// La `netCents` simula la tarifa neta del proveedor.
// ============================================================

const HOTELS: Array<{ name: string; stars: number; baseNight: number; amenities: string[]; img: string }> = [
  { name: 'Hotel Ibiza Bay Resort', stars: 5, baseNight: 18000, amenities: ['Piscina', 'Spa', 'Frente al mar', 'Desayuno'], img: 'photo-1582719478250-c89cae4dc85b' },
  { name: 'Montañita Surf Lodge', stars: 4, baseNight: 9500, amenities: ['WiFi', 'Bar', 'Vista al mar', 'A/C'], img: 'photo-1566073771259-6a8506099945' },
  { name: 'Gran Hotel Colonial', stars: 4, baseNight: 8200, amenities: ['Desayuno', 'Gimnasio', 'Centro'], img: 'photo-1551882547-ff40c63fe5fa' },
  { name: 'Boutique Casa del Sol', stars: 3, baseNight: 6100, amenities: ['WiFi', 'Patio', 'Pet friendly'], img: 'photo-1571896349842-33c89424de2d' },
  { name: 'City Express Suites', stars: 3, baseNight: 5400, amenities: ['WiFi', 'Estacionamiento', 'Desayuno'], img: 'photo-1564501049412-61c2a3083791' },
  { name: 'Resort Paraíso All-Inclusive', stars: 5, baseNight: 24500, amenities: ['Todo incluido', 'Piscina', 'Spa', 'Playa privada'], img: 'photo-1520250497591-112f2f40a3f4' },
];

/** Hash entero estable a partir de un string (para variación determinista). */
function seed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn).getTime();
  const b = new Date(checkOut).getTime();
  const n = Math.round((b - a) / 86_400_000);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export class MockAdapter implements SupplierAdapter {
  readonly name = 'mock';

  async searchHotels(query: HotelQuery): Promise<RawHotelOffer[]> {
    const nights = nightsBetween(query.checkIn, query.checkOut);
    const dest = (query.destination || 'Destino').trim();
    const base = seed(`${dest}|${query.checkIn}`);

    return HOTELS.map((h, i) => {
      // Variación determinista por destino para que se sienta "vivo".
      const factor = 0.85 + ((base + i * 7) % 30) / 100; // 0.85–1.14
      const guestSurcharge = 1 + Math.max(0, (query.guests || 1) - 2) * 0.12;
      const netNight = Math.round(h.baseNight * factor * guestSurcharge);
      return {
        rateKey: `mock:${seed(`${h.name}|${query.checkIn}|${query.checkOut}|${query.guests}`)}`,
        supplier: this.name,
        name: h.name,
        city: dest,
        country: 'EC',
        stars: h.stars,
        image: `https://images.unsplash.com/${h.img}?auto=format&fit=crop&w=800&q=80`,
        amenities: h.amenities,
        refundable: i % 3 !== 0,
        nights,
        netCents: netNight * nights,
        currency: 'USD',
      };
    });
  }
}

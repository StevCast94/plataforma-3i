import type { SupplierAdapter, SupplierBookingResult } from './SupplierAdapter';
import type { HotelQuery, RawHotelOffer } from '../types';

// ============================================================
// Adaptador REAL de RateHawk (Emerging Travel Group · API B2B v3 / Worldota).
// Auth: HTTP Basic con KEY_ID:API_KEY. Dinero del proveedor viene en unidades
// decimales de la moneda → lo convertimos a CENTAVOS enteros.
// Endpoints (base sandbox/prod conmutable por env):
//   POST /search/multicomplete/        → region_id desde texto libre
//   POST /search/serp/region/          → hoteles + tarifas (book_hash)
//   POST /hotel/prebook/               → revalidar tarifa antes de cobrar
//   POST /hotel/order/booking/form/    → iniciar orden (partner_order_id)
//   POST /hotel/order/booking/finish/  → confirmar (pago deposit = saldo prepago)
//   POST /hotel/order/booking/finish/status/ → estado de la orden
//   POST /hotel/order/cancel/          → cancelar
// Nota: los nombres exactos de algunos campos de respuesta se afinan contra el
// sandbox durante el onboarding; el parseo es defensivo.
// ============================================================

const SANDBOX_BASE = 'https://api-sandbox.worldota.net/api/b2b/v3';
const PROD_BASE = 'https://api.worldota.net/api/b2b/v3';

function toCents(amount: string | number | undefined): number {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount ?? 0;
  return Math.round((Number.isFinite(n) ? n : 0) * 100);
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const n = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

interface RhRate {
  book_hash: string;
  payment_options?: {
    payment_types?: Array<{ amount?: string; show_amount?: string; currency_code?: string; show_currency_code?: string }>;
  };
  meal?: string;
  no_show?: unknown;
  cancellation_penalties?: { free_cancellation_before?: string | null } | null;
}
interface RhHotel {
  id?: string;
  hid?: number;
  rates?: RhRate[];
}

export class RateHawkAdapter implements SupplierAdapter {
  readonly name = 'ratehawk';
  private base: string;
  private authHeader: string;

  constructor() {
    const keyId = process.env.RATEHAWK_KEY_ID ?? '';
    const apiKey = process.env.RATEHAWK_API_KEY ?? '';
    this.base = process.env.RATEHAWK_SANDBOX === 'false' ? PROD_BASE : SANDBOX_BASE;
    this.authHeader = 'Basic ' + Buffer.from(`${keyId}:${apiKey}`).toString('base64');
  }

  private async post<T = unknown>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`RateHawk ${path} HTTP ${res.status}: ${text.slice(0, 300)}`);
    }
    const json = (await res.json()) as { status?: string; error?: string | null; data?: T };
    if (json.error) throw new Error(`RateHawk ${path} error: ${json.error}`);
    return (json.data ?? (json as unknown)) as T;
  }

  private guests(query: HotelQuery) {
    return [{ adults: Math.max(1, query.guests || 1), children: [] as number[] }];
  }

  /** Resuelve el region_id a partir del texto de destino. */
  private async regionId(destination: string): Promise<number | null> {
    const data = await this.post<{ regions?: Array<{ id?: number }> }>('/search/multicomplete/', {
      query: destination,
      language: 'es',
    });
    return data.regions?.[0]?.id ?? null;
  }

  async searchHotels(query: HotelQuery): Promise<RawHotelOffer[]> {
    const regionId = await this.regionId(query.destination);
    if (!regionId) return [];
    const nights = nightsBetween(query.checkIn, query.checkOut);

    const data = await this.post<{ hotels?: RhHotel[] }>('/search/serp/region/', {
      region_id: regionId,
      checkin: query.checkIn,
      checkout: query.checkOut,
      guests: this.guests(query),
      currency: 'USD',
      residency: 'us',
      language: 'es',
      hotels_limit: 30,
    });

    const offers: RawHotelOffer[] = [];
    for (const h of data.hotels ?? []) {
      const rate = h.rates?.[0];
      if (!rate) continue;
      const pt = rate.payment_options?.payment_types?.[0];
      const netCents = toCents(pt?.amount ?? pt?.show_amount);
      if (netCents <= 0) continue;
      offers.push({
        rateKey: rate.book_hash,
        supplier: this.name,
        name: h.id ?? `Hotel ${h.hid ?? ''}`.trim(),
        city: query.destination,
        country: '',
        stars: 0,
        image: '',
        amenities: rate.meal && rate.meal !== 'nomeal' ? [rate.meal] : [],
        refundable: !!rate.cancellation_penalties?.free_cancellation_before,
        nights,
        netCents,
        currency: pt?.currency_code ?? 'USD',
      });
    }
    return offers;
  }

  async getHotelRate(query: HotelQuery, rateKey: string): Promise<RawHotelOffer | null> {
    const data = await this.post<{ hotels?: RhHotel[] }>('/hotel/prebook/', {
      hash: rateKey,
      price_increase_percent: 20,
    });
    const rate = data.hotels?.[0]?.rates?.[0];
    if (!rate) return null;
    const pt = rate.payment_options?.payment_types?.[0];
    const netCents = toCents(pt?.amount ?? pt?.show_amount);
    if (netCents <= 0) return null;
    return {
      rateKey: rate.book_hash, // el hash puede rotar tras prebook
      supplier: this.name,
      name: data.hotels?.[0]?.id ?? 'Hotel',
      city: query.destination,
      country: '',
      stars: 0,
      image: '',
      amenities: rate.meal && rate.meal !== 'nomeal' ? [rate.meal] : [],
      refundable: !!rate.cancellation_penalties?.free_cancellation_before,
      nights: nightsBetween(query.checkIn, query.checkOut),
      netCents,
      currency: pt?.currency_code ?? 'USD',
    };
  }

  async bookHotel(input: {
    rateKey: string;
    query: HotelQuery;
    orderId: string;
    customer: { name: string; email: string; phone?: string | null };
  }): Promise<SupplierBookingResult> {
    // 1) Iniciar la orden con el book_hash vigente.
    await this.post('/hotel/order/booking/form/', {
      partner_order_id: input.orderId,
      book_hash: input.rateKey,
      language: 'es',
    });

    // 2) Confirmar pagando contra el saldo prepago (deposit).
    const [firstName, ...rest] = input.customer.name.trim().split(' ');
    await this.post('/hotel/order/booking/finish/', {
      partner: { partner_order_id: input.orderId },
      user: { email: input.customer.email, phone: input.customer.phone ?? '' },
      language: 'es',
      rooms: [
        {
          guests: [{ first_name: firstName || 'Guest', last_name: rest.join(' ') || 'Guest' }],
        },
      ],
      payment_type: { type: 'deposit' },
    });

    // 3) Consultar estado final.
    const status = await this.post<{ order_status?: string }>('/hotel/order/booking/finish/status/', {
      partner_order_id: input.orderId,
    });
    const ok = status.order_status === 'ok' || status.order_status === 'done';
    return {
      supplierRef: input.orderId,
      status: ok ? 'confirmed' : 'pending',
      raw: status,
    };
  }

  async cancelHotel(orderId: string): Promise<{ cancelled: boolean; raw?: unknown }> {
    const raw = await this.post('/hotel/order/cancel/', { partner_order_id: orderId });
    return { cancelled: true, raw };
  }
}

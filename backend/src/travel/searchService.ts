import type { SupplierAdapter } from './adapters/SupplierAdapter';
import { MockAdapter } from './adapters/mockAdapter';
import { priceFromNet } from './markupEngine';
import { hasTravelAccess } from './membershipAccess';
import type { HotelQuery, HotelSearchResult, PricedHotelOffer, RawHotelOffer } from './types';

// ============================================================
// FASE 5 — Orquestador de búsqueda. Une adaptador + markup + gating.
// La tarifa neta entra aquí y NO sale: el frontend solo recibe precios públicos
// y de socio. RateHawk se conecta cambiando getHotelAdapter() — el resto del
// motor no cambia.
// ============================================================

/**
 * Selecciona el adaptador hotelero. Hoy: mock (offline, sin contratos).
 * Cuando existan credenciales de RateHawk se devuelve RateHawkAdapter aquí y
 * todo lo demás sigue igual.
 */
function getHotelAdapter(): SupplierAdapter {
  // if (process.env.RATEHAWK_API_KEY) return new RateHawkAdapter();
  return new MockAdapter();
}

export async function searchHotels(
  query: HotelQuery,
  opts: { memberId?: string | null } = {},
): Promise<HotelSearchResult> {
  const adapter = getHotelAdapter();
  const [raw, isMember] = await Promise.all([
    adapter.searchHotels(query),
    hasTravelAccess(opts.memberId),
  ]);

  const offers: PricedHotelOffer[] = raw.map((o) => {
    const { publicCents, memberCents, savingsCents } = priceFromNet(o.netCents);
    return {
      rateKey: o.rateKey,
      supplier: o.supplier,
      name: o.name,
      city: o.city,
      country: o.country,
      stars: o.stars,
      image: o.image,
      amenities: o.amenities,
      refundable: o.refundable,
      nights: o.nights,
      currency: o.currency,
      publicCents,
      memberCents,
      priceCents: isMember ? memberCents : publicCents,
      isMemberPrice: isMember,
      savingsCents,
      // netCents NO se incluye — nunca sale del backend.
    };
  });

  // Ordenar por precio aplicable ascendente.
  offers.sort((a, b) => a.priceCents - b.priceCents);

  return { offers, isMember, currency: 'USD', query };
}

/**
 * Revalida y recupera la oferta cruda (con tarifa NETA) a partir del rateKey,
 * re-ejecutando la búsqueda. Así el precio de la reserva lo decide el SERVIDOR,
 * nunca el cliente. Con RateHawk esto será adapter.getHotelRate(rateKey).
 * Devuelve null si la tarifa ya no existe (expiró / cambió).
 */
export async function getRawOffer(
  query: HotelQuery,
  rateKey: string,
): Promise<RawHotelOffer | null> {
  const adapter = getHotelAdapter();
  const offers = await adapter.searchHotels(query);
  return offers.find((o) => o.rateKey === rateKey) ?? null;
}

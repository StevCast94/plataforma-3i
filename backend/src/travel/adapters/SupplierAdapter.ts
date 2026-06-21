import type { HotelQuery, RawHotelOffer } from '../types';

// ============================================================
// Interfaz única que TODO proveedor debe implementar.
// El resto del sistema nunca sabe si detrás está el mock, RateHawk, Duffel o
// el inventario propio (propiedades fraccionadas). Eso es lo que evita quedar
// atado a un proveedor y lo que separa este motor de un "buscador glorificado".
// ============================================================

export interface SupplierAdapter {
  readonly name: string;
  /** Busca hoteles y devuelve ofertas con tarifa NETA (uso interno). */
  searchHotels(query: HotelQuery): Promise<RawHotelOffer[]>;
  // V1+: getHotelRate(rateKey) para revalidar precio antes de cobrar.
  // V2+: bookHotel(req), cancelBooking(ref).
}

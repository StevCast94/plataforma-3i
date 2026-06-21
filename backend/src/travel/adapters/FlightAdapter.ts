import type { FlightQuery, RawFlightOffer } from '../types';

// ============================================================
// Interfaz de proveedor de vuelos (misma filosofía que SupplierAdapter de
// hoteles). Duffel/Kiwi/TBO se conectan implementando esto; el motor no cambia.
// ============================================================

export interface FlightAdapter {
  readonly name: string;
  /** Busca vuelos y devuelve ofertas con tarifa NETA (uso interno). */
  searchFlights(query: FlightQuery): Promise<RawFlightOffer[]>;
  // V-prod: getFlightOffer(rateKey) para revalidar, bookFlight(passengers...).
}

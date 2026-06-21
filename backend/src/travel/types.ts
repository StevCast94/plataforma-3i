// ============================================================
// FASE 5 — Tipos internos del Motor de Viajes.
// Regla de oro: `netCents` (tarifa neta del proveedor) JAMÁS sale del backend.
// El frontend solo recibe precios YA con markup (público y socio).
// Todo el dinero va en CENTAVOS enteros.
// ============================================================

export type TravelKind = 'HOTEL' | 'FLIGHT' | 'ACTIVITY' | 'CAR' | 'PACKAGE';

/** Parámetros de una búsqueda de hoteles. */
export interface HotelQuery {
  destination: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  guests: number;
}

/** Oferta cruda devuelta por un adaptador — INCLUYE la tarifa neta (uso interno). */
export interface RawHotelOffer {
  rateKey: string; // identificador opaco del proveedor para reservar
  supplier: string; // "mock" | "ratehawk" | "owned"...
  name: string;
  city: string;
  country: string;
  stars: number;
  image: string;
  amenities: string[];
  refundable: boolean;
  nights: number;
  netCents: number; // ⚠️ NUNCA exponer al frontend
  currency: string;
}

/** Oferta ya tarifada que SÍ viaja al frontend (sin tarifa neta). */
export interface PricedHotelOffer {
  rateKey: string;
  supplier: string;
  name: string;
  city: string;
  country: string;
  stars: number;
  image: string;
  amenities: string[];
  refundable: boolean;
  nights: number;
  currency: string;
  publicCents: number; // precio para visitante (markup normal)
  memberCents: number; // precio para socio (recuperación de costo)
  priceCents: number; // el que aplica al usuario actual
  isMemberPrice: boolean; // ¿el usuario actual paga precio de socio?
  savingsCents: number; // publicCents - memberCents (gancho de la membresía)
}

export interface HotelSearchResult {
  offers: PricedHotelOffer[];
  isMember: boolean;
  currency: string;
  query: HotelQuery;
}

// ---------- Vuelos (V5) ----------

export interface FlightQuery {
  origin: string; // IATA o ciudad
  destination: string;
  departDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD (opcional → ida y vuelta)
  passengers: number;
}

/** Oferta cruda de vuelo — INCLUYE tarifa neta (uso interno). */
export interface RawFlightOffer {
  rateKey: string;
  supplier: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departTime: string; // ISO-ish para mostrar
  arriveTime: string;
  durationMin: number;
  stops: number;
  cabin: string; // Economy | Business
  roundTrip: boolean;
  netCents: number; // ⚠️ nunca al frontend
  currency: string;
}

/** Oferta de vuelo tarifada que viaja al frontend (sin neta). */
export interface PricedFlightOffer {
  rateKey: string;
  supplier: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departTime: string;
  arriveTime: string;
  durationMin: number;
  stops: number;
  cabin: string;
  roundTrip: boolean;
  currency: string;
  publicCents: number;
  memberCents: number;
  priceCents: number;
  isMemberPrice: boolean;
  savingsCents: number;
}

export interface FlightSearchResult {
  offers: PricedFlightOffer[];
  isMember: boolean;
  currency: string;
  query: FlightQuery;
}

import type { HotelQuery, RawHotelOffer } from '../types';

// ============================================================
// Interfaz única que TODO proveedor debe implementar.
// El resto del sistema nunca sabe si detrás está el mock, RateHawk, Duffel o
// el inventario propio (propiedades fraccionadas). Eso es lo que evita quedar
// atado a un proveedor y lo que separa este motor de un "buscador glorificado".
// ============================================================

/** Resultado de reservar con el proveedor (localizador real + estado). */
export interface SupplierBookingResult {
  supplierRef: string; // localizador del proveedor (PNR/order id)
  status: 'confirmed' | 'pending';
  raw?: unknown; // payload crudo para auditoría
}

export interface SupplierAdapter {
  readonly name: string;
  /** Busca hoteles y devuelve ofertas con tarifa NETA (uso interno). */
  searchHotels(query: HotelQuery): Promise<RawHotelOffer[]>;

  /**
   * Revalida una tarifa concreta antes de cobrar (prebook). Devuelve la oferta
   * con la NETA vigente, o null si ya no existe / cambió de precio fuera de
   * tolerancia. Si el adaptador no lo implementa, el servicio cae a re-buscar.
   */
  getHotelRate?(query: HotelQuery, rateKey: string): Promise<RawHotelOffer | null>;

  /**
   * Reserva en firme contra el proveedor tras el pago aprobado. Devuelve el
   * localizador real. Si no se implementa, el servicio genera un voucher propio.
   */
  bookHotel?(input: {
    rateKey: string;
    query: HotelQuery;
    orderId: string; // partner_order_id propio (id de la reserva)
    customer: { name: string; email: string; phone?: string | null };
  }): Promise<SupplierBookingResult>;

  /** Cancela una reserva contra el proveedor. */
  cancelHotel?(orderId: string): Promise<{ cancelled: boolean; raw?: unknown }>;
}

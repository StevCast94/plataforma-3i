// Condiciones de financiamiento de los lotes (las usan el mapa, la ficha del
// lote y la página de aterrizaje). Módulo liviano: no arrastra Leaflet.
export const DOWN_PAYMENT = 0.3;
export const INSTALLMENTS = 24;

export function monthly(price: number) {
  return (price * (1 - DOWN_PAYMENT)) / INSTALLMENTS;
}

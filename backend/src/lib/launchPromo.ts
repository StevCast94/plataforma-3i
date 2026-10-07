// ============================================================
// PROMOCIÓN DE LANZAMIENTO — "Elite con tu primer referido"
// Del 6 de octubre al 7 de noviembre de 2026 (hora de Ecuador, UTC-5).
// Quien inscribe a su primer referido sube a Elite de regalo. Al cerrar la
// temporada lo conserva quien tuvo al menos 1 venta real (propia o de un
// referido directo) dentro de la temporada; el resto vuelve a Premiere.
// ============================================================

export const LAUNCH_PROMO_START = new Date('2026-10-06T05:00:00Z'); // 6 oct 00:00 Ecuador
export const LAUNCH_PROMO_END = new Date('2026-11-08T05:00:00Z'); // fin del 7 nov en Ecuador
/** Días tras el cierre para que el admin confirme ventas hechas dentro de la temporada. */
export const LAUNCH_PROMO_GRACE_DAYS = 7;

export function isLaunchPromoActive(now = new Date()): boolean {
  return now >= LAUNCH_PROMO_START && now < LAUNCH_PROMO_END;
}

// ============================================================
// PROMOCIÓN DE LANZAMIENTO — "Elite con tu primer referido"
// Del 6 de octubre de 2026 al 28 de febrero de 2027 (hora de Ecuador, UTC-5;
// ampliada el 15-oct-2026, antes cerraba el 7 de noviembre).
// Quien inscribe a su primer referido sube a Elite de regalo. Al cerrar la
// temporada lo conserva quien tuvo al menos 1 venta real (propia o de un
// referido directo) dentro de la temporada; el resto vuelve a Premiere.
// Durante la temporada no se explica el camino de 5 referidos / 180 días: el
// único objetivo es el primer referido. Esa información se da a quien vuelve a Premiere.
// ============================================================

export const LAUNCH_PROMO_START = new Date('2026-10-06T05:00:00Z'); // 6 oct 00:00 Ecuador
export const LAUNCH_PROMO_END = new Date('2027-03-01T05:00:00Z'); // fin del 28 feb 2027 en Ecuador
/** Días tras el cierre para que el admin confirme ventas hechas dentro de la temporada. */
export const LAUNCH_PROMO_GRACE_DAYS = 7;

export function isLaunchPromoActive(now = new Date()): boolean {
  return now >= LAUNCH_PROMO_START && now < LAUNCH_PROMO_END;
}

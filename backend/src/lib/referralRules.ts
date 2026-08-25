// ============================================================
// REGLAMENTO DEL PROGRAMA DE REFERIDOS — FUENTE ÚNICA DE VERDAD
// Cada valor proviene del reglamento oficial. NO modificar sin autorización.
// ============================================================

export type MemberStatus = 'PREMIERE' | 'ELITE' | 'SUSPENDED';

/** Comisiones inmobiliario (porcentaje del precio neto) por nivel y estatus. */
export const REAL_ESTATE_RATES: Record<'PREMIERE' | 'ELITE', { level1: number; level2: number }> = {
  PREMIERE: { level1: 0.02, level2: 0.01 },
  ELITE: { level1: 0.04, level2: 0.02 },
};

/** Comisión fija por membresía de viajes (USD) por nivel y estatus. */
export const TRAVEL_MEMBERSHIP_COMMISSION: Record<'PREMIERE' | 'ELITE', { level1: number; level2: number }> = {
  PREMIERE: { level1: 50, level2: 0 },
  ELITE: { level1: 100, level2: 0 },
};

/** Límite mensual de comisiones (null = ilimitado). No hay tope real para ningún nivel. */
export const MONTHLY_LIMIT: Record<'PREMIERE' | 'ELITE', number | null> = {
  PREMIERE: null,
  ELITE: null,
};

/** Período de espera (hold) antes de liquidar, en días, desde la confirmación. */
export const LIQUIDATION_DAYS: Record<'PREMIERE' | 'ELITE', number> = {
  PREMIERE: 30,
  ELITE: 3,
};

/** Mínimo de retiro (USD) por método y estatus. */
export const MIN_PAYOUT: Record<'PREMIERE' | 'ELITE', { transfer: number; paypal: number }> = {
  PREMIERE: { transfer: 100, paypal: 50 },
  ELITE: { transfer: 50, paypal: 25 },
};

/** Período de retracto (días) → la comisión está en PENDING hasta cumplirlo. */
export const RETRACTION_DAYS = 14;

/** Inactividad: días sin referidos para que un Premiere cause baja. */
export const INACTIVITY_LIMIT_DAYS = 90;
export const INACTIVITY_WARN_1_DAYS = 60; // "te quedan 30 días"
export const INACTIVITY_WARN_2_DAYS = 80; // "URGENTE: 10 días"

/** Ascenso por referidos: cantidad y ventana (días). */
export const ELITE_REFERRALS_REQUIRED = 5;
export const ELITE_REFERRALS_WINDOW_DAYS = 180;

/** Ventana de atribución de la cookie de referido (días, first-click). */
export const ATTRIBUTION_WINDOW_DAYS = 90;

/**
 * Prefijo único del código de referido. Todo socio se registra Premiere
 * (el ascenso a Elite es posterior y NUNCA regenera el código, justo para no
 * romper enlaces/QR ya compartidos — ver `ascendService.ts`), así que nunca
 * existió un prefijo "3IE-" real: hubo uno definido pero jamás se invocaba.
 * Se deja como constante única para que quede imposible reintroducir esa
 * confusión (el reglamento público llegó a documentar el prefijo Elite falso).
 */
export const CODE_PREFIX = '3IP';

/** Métodos de pago válidos y a qué mínimo (transfer/paypal) mapean. */
export const PAYOUT_METHODS: Record<string, 'transfer' | 'paypal'> = {
  transfer: 'transfer',
  bank: 'transfer',
  payoneer: 'transfer',
  wise: 'transfer',
  paypal: 'paypal',
};

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Genera un código de referido: 3IP-XXXXXX (6 alfanuméricos). */
export function generateReferralCode(): string {
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return `${CODE_PREFIX}-${suffix}`;
}

const SLUG_SUFFIX_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Genera un slug legible a partir del nombre completo, con un sufijo corto
 * aleatorio para evitar colisiones triviales entre homónimos (ej. "juan-perez-k3f9").
 * El llamador aún debe verificar unicidad en BD y reintentar ante colisión real.
 */
export function generateReferralSlug(fullName: string): string {
  const base = fullName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita acentos
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
    .replace(/^-|-$/g, '');

  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += SLUG_SUFFIX_CHARS[Math.floor(Math.random() * SLUG_SUFFIX_CHARS.length)];
  }
  return `${base || 'socio'}-${suffix}`;
}

/** Mínimo de retiro aplicable a un miembro según estatus y método. */
export function minPayoutFor(status: 'PREMIERE' | 'ELITE', method: string): number {
  const kind = PAYOUT_METHODS[method] ?? 'transfer';
  return MIN_PAYOUT[status][kind];
}

/** ¿La edad (a partir de fecha de nacimiento) es >= 18? */
export function isAdult(birthDate: Date): boolean {
  const now = new Date();
  const age =
    now.getFullYear() -
    birthDate.getFullYear() -
    (now < new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate()) ? 1 : 0);
  return age >= 18;
}

// Helpers de presentación del programa de referidos (cliente).
// Las tasas aquí son SOLO para simuladores/UI. El cálculo real vive en el backend.
import type { MemberStatus, CommissionStatus } from '@shared/types';

export const RATES = {
  PREMIERE: { realEstateL1: 0.02, realEstateL2: 0.01, travelL1: 50 },
  ELITE: { realEstateL1: 0.04, realEstateL2: 0.02, travelL1: 100 },
} as const;

export const ELITE_REFERRALS_REQUIRED = 5;
export const ELITE_REFERRALS_WINDOW_DAYS = 180;
export const INACTIVITY_LIMIT_DAYS = 90;

/** Estima la comisión mensual de un escenario para un nivel dado. */
export function estimateMonthly(
  status: 'PREMIERE' | 'ELITE',
  membershipsPerMonth: number,
  fractionalSales: number,
  avgPropertyPrice: number,
): number {
  const r = RATES[status];
  const fromTravel = membershipsPerMonth * r.travelL1;
  const fromRealEstate = fractionalSales * avgPropertyPrice * r.realEstateL1;
  return fromTravel + fromRealEstate;
}

/** Días restantes desde una fecha hasta cumplir N días. */
export function daysRemaining(fromIso: string | null | undefined, limit: number): number {
  const from = fromIso ? new Date(fromIso).getTime() : Date.now();
  const elapsed = Math.floor((Date.now() - from) / 86400000);
  return Math.max(limit - elapsed, 0);
}

export function statusLabel(status: MemberStatus): string {
  return status === 'ELITE' ? 'Elite' : status === 'SUSPENDED' ? 'Suspendido' : 'Premiere';
}

export const COMMISSION_BADGE: Record<CommissionStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pendiente', className: 'bg-gray-200 text-gray-700' },
  CONFIRMED: { label: 'Confirmada', className: 'bg-blue-100 text-blue-700' },
  LIQUIDATED: { label: 'Liquidada', className: 'bg-amber-100 text-amber-700' },
  PAID: { label: 'Pagada', className: 'bg-green-100 text-green-700' },
  REVERSED: { label: 'Reversada', className: 'bg-red-100 text-red-700' },
};

/** Mensaje de WhatsApp pre-armado con el enlace de referido. */
export function whatsappShareUrl(fullUrl: string, message?: string): string {
  const msg = message
    ? `${message} ${fullUrl}`
    : `¡Únete al Club 3i conmigo! 🌍 Viaja con descuentos de hasta 70% y gana ingresos por referir. Regístrate aquí: ${fullUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

/** Valida el formato de un código de referido 3IP-XXXXXX / 3IE-XXXXXX. */
export function isValidReferralCode(code: string): boolean {
  return /^3I[PE]-[A-Z0-9]{6}$/i.test(code.trim());
}

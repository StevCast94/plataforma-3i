import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../prisma';
import {
  REAL_ESTATE_RATES,
  TRAVEL_MEMBERSHIP_COMMISSION,
  MONTHLY_LIMIT,
  LIQUIDATION_DAYS,
  RETRACTION_DAYS,
} from '../lib/referralRules';

type Db = PrismaClient | Prisma.TransactionClient;

export interface CommissionInput {
  /** Miembro que recibe la comisión. */
  memberId: string;
  /** Estatus del miembro al momento de generar la comisión (define la tasa). */
  memberStatus: 'PREMIERE' | 'ELITE';
  /** Referral miembro-a-miembro que originó la comisión (si aplica). */
  referralId?: string | null;
  /** Compra (checkout) que originó la comisión (si aplica). */
  purchaseId?: string | null;
  /** Nivel del referido respecto al miembro (1 o 2). */
  level: 1 | 2;
  /** Tipo de producto vendido. */
  productType:
    | 'TRAVEL_MEMBERSHIP'
    | 'FRACTIONAL_PROPERTY'
    | 'TRADITIONAL_PROPERTY'
    | 'LAND';
  /** Precio neto de la transacción (para inmobiliario). */
  netPrice: number;
  productId?: string | null;
  transactionId?: string | null;
  /** Config de comisión del producto (override). 'percentage' | 'fixed'. */
  commissionType?: string | null;
  /** Valores fijos N1 por rango (solo si commissionType === 'fixed'). */
  commissionFixedPremiere?: number | null;
  commissionFixedElite?: number | null;
}

export interface CommissionComputation {
  amount: number;
  rate: number;
  type: 'percentage' | 'fixed';
}

/**
 * Calcula el monto de comisión según el reglamento.
 * - Membresía de viajes: monto fijo ($50 Premiere / $100 Elite, solo nivel 1).
 * - Inmobiliario: porcentaje del precio neto según nivel y estatus.
 */
export function computeCommission(input: CommissionInput): CommissionComputation {
  const { memberStatus, level, productType, netPrice } = input;

  // Tipo efectivo: override del producto; si no, las membresías son fijas y el
  // resto porcentaje (compatibilidad con productos sin config).
  const effectiveType =
    input.commissionType === 'fixed' || input.commissionType === 'percentage'
      ? input.commissionType
      : productType === 'TRAVEL_MEMBERSHIP'
        ? 'fixed'
        : 'percentage';

  if (effectiveType === 'fixed') {
    // Nivel 2 nunca gana en comisión fija.
    if (level === 2) return { amount: 0, rate: 0, type: 'fixed' };

    // Valor por rango: config del producto; si falta, cae al reglamento de membresías.
    const configured =
      memberStatus === 'ELITE' ? input.commissionFixedElite : input.commissionFixedPremiere;
    const fallback = TRAVEL_MEMBERSHIP_COMMISSION[memberStatus].level1;
    const amount = configured != null ? round2(configured) : fallback;
    return { amount, rate: 0, type: 'fixed' };
  }

  // Porcentaje: tasas globales del reglamento (4/2 Elite, 2/1 Premiere).
  const rate =
    level === 1 ? REAL_ESTATE_RATES[memberStatus].level1 : REAL_ESTATE_RATES[memberStatus].level2;
  return { amount: round2(netPrice * rate), rate, type: 'percentage' };
}

/** Suma de comisiones (no reversadas) generadas por un miembro en el mes corriente. */
export async function monthlyCommissionTotal(memberId: string, db: Db = prisma): Promise<number> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const agg = await db.commission.aggregate({
    where: {
      memberId,
      status: { not: 'REVERSED' },
      createdAt: { gte: start },
    },
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}

/**
 * Crea la comisión aplicando el límite mensual, si `MONTHLY_LIMIT` llegara a
 * definir uno para el rango (hoy ninguno lo tiene: ambos son `null`, sin tope).
 * Estado inicial PENDING; holdUntil = ahora + retracto(14) + liquidación(según estatus).
 * Devuelve la comisión creada, o null si el límite ya estaba alcanzado.
 */
export async function createCommission(
  input: CommissionInput,
  db: Db = prisma,
): Promise<{ id: string; amount: number } | null> {
  const computed = computeCommission(input);

  // Sin tope hoy (ver referralRules.ts); el código queda listo por si en el
  // futuro se reintroduce un límite para algún rango.
  const limit = MONTHLY_LIMIT[input.memberStatus];
  let amount = computed.amount;
  if (limit != null) {
    const used = await monthlyCommissionTotal(input.memberId, db);
    const remaining = Math.max(limit - used, 0);
    if (remaining <= 0) return null;
    amount = Math.min(amount, remaining);
  }
  if (amount <= 0) return null;

  const holdUntil = new Date(
    Date.now() +
      (RETRACTION_DAYS + LIQUIDATION_DAYS[input.memberStatus]) * 24 * 60 * 60 * 1000,
  );

  const commission = await db.commission.create({
    data: {
      memberId: input.memberId,
      referralId: input.referralId ?? null,
      purchaseId: input.purchaseId ?? null,
      productId: input.productId ?? null,
      transactionId: input.transactionId ?? null,
      level: input.level,
      amount,
      rate: computed.rate,
      type: computed.type,
      status: 'PENDING',
      holdUntil,
    },
    select: { id: true, amount: true },
  });

  return commission;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

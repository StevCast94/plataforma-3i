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
  /** Referral que originó la comisión. */
  referralId: string;
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

  if (productType === 'TRAVEL_MEMBERSHIP') {
    const fixed =
      level === 1 ? TRAVEL_MEMBERSHIP_COMMISSION[memberStatus].level1 : TRAVEL_MEMBERSHIP_COMMISSION[memberStatus].level2;
    return { amount: fixed, rate: 0, type: 'fixed' };
  }

  // Inmobiliario (fraccionada, tradicional, terreno)
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
 * Crea la comisión aplicando el límite mensual (recorta el excedente para Premiere).
 * Estado inicial PENDING; holdUntil = ahora + retracto(14) + liquidación(según estatus).
 * Devuelve la comisión creada, o null si el límite ya estaba alcanzado.
 */
export async function createCommission(
  input: CommissionInput,
  db: Db = prisma,
): Promise<{ id: string; amount: number } | null> {
  const computed = computeCommission(input);

  // Aplicar límite mensual (Premiere = $5,000; Elite = ilimitado).
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
      referralId: input.referralId,
      productId: input.productId ?? null,
      transactionId: input.transactionId ?? null,
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

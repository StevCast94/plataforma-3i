import { createContext, useContext } from 'react';

// Condiciones de financiamiento de las unidades (las usan el mapa, la ficha de la
// unidad y la página de aterrizaje). Cada proyecto define su plan en el admin;
// sin plan, solo se muestra el precio. Módulo liviano: no arrastra Leaflet.

export interface PaymentPlan {
  /** Porcentaje de entrada (30 = 30 %). */
  downPct: number;
  installments: number;
  interestFree: boolean;
}

export function asPlan(v: unknown): PaymentPlan | null {
  const p = v as Partial<PaymentPlan> | null | undefined;
  return p && Number(p.installments) > 0 ? { downPct: Number(p.downPct) || 0, installments: Number(p.installments), interestFree: Boolean(p.interestFree) } : null;
}

export const downPayment = (price: number, plan: PaymentPlan) => (price * plan.downPct) / 100;
export const monthly = (price: number, plan: PaymentPlan) => (price * (1 - plan.downPct / 100)) / plan.installments;

/** Plan de pagos y ubicación del proyecto, para las piezas del mapa y la ficha. */
export const ProjectTermsContext = createContext<{ plan: PaymentPlan | null; location: string | null }>({ plan: null, location: null });
export const useProjectTerms = () => useContext(ProjectTermsContext);

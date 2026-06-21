// ============================================================
// FASE 5 — Motor de Markup. EL CORAZÓN DEL MODELO.
// Filosofía (decisión del dueño): el club NO es centro de lucro. El precio de
// SOCIO se calibra a RECUPERACIÓN DE COSTO (cubre el ~3.5% de la pasarela de
// pago + costo de API + operación), no a margen. El precio PÚBLICO lleva un
// markup normal: financia el sistema y crea el incentivo a hacerse socio.
// El delta (público - socio) ES el argumento de venta de la membresía.
//
// Todo en CENTAVOS enteros. La tarifa neta jamás sale de aquí.
// ============================================================

export interface MarkupConfig {
  publicPercent: number; // markup para visitantes
  memberPercent: number; // markup para socios (recuperación de costo)
  minCents: number; // piso absoluto del markup (cubre el fee fijo de pasarela)
}

/** Config por defecto vía env (configurable luego con MarkupRule en BD/admin). */
export function defaultMarkupConfig(): MarkupConfig {
  const num = (v: string | undefined, fb: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fb;
  };
  return {
    publicPercent: num(process.env.TRAVEL_PUBLIC_MARKUP, 0.15),
    memberPercent: num(process.env.TRAVEL_MEMBER_MARKUP, 0.05),
    minCents: Math.round(num(process.env.TRAVEL_MIN_MARKUP_CENTS, 250)),
  };
}

/** Aplica markup a una tarifa neta. El markup nunca baja del piso `minCents`. */
function applyMarkup(netCents: number, percent: number, minCents: number): number {
  const markup = Math.max(Math.round(netCents * percent), minCents);
  return netCents + markup;
}

export interface PricedPair {
  publicCents: number;
  memberCents: number;
  savingsCents: number;
}

/** Calcula precio público y de socio a partir de la tarifa neta. */
export function priceFromNet(netCents: number, cfg: MarkupConfig = defaultMarkupConfig()): PricedPair {
  const publicCents = applyMarkup(netCents, cfg.publicPercent, cfg.minCents);
  const memberCents = applyMarkup(netCents, cfg.memberPercent, cfg.minCents);
  // Por construcción memberPercent <= publicPercent, pero protegemos por si una
  // regla mal configurada invierte el orden: el socio nunca paga más.
  const safeMember = Math.min(memberCents, publicCents);
  return {
    publicCents,
    memberCents: safeMember,
    savingsCents: Math.max(0, publicCents - safeMember),
  };
}

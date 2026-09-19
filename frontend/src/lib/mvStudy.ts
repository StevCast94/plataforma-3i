// ============================================================
// Estudio de factibilidad 2026 — Montañita View Lobby
//
// Modelo propio, independiente del "Informe Montañita View" (2021–2023).
// Todos los supuestos salen de fuentes públicas citadas en MV_SOURCES y se
// pueden recalcular en vivo: la página de la propuesta dibuja las gráficas
// directamente desde estas funciones (no hay cifras copiadas a mano).
//
// Hotel: flujo anual a 10 años + valor terminal por capitalización del NOI.
// Etapas de apartamentos: flujo trimestral de construcción y ventas.
// ============================================================

export type Scenario = 'pesimista' | 'base' | 'optimista';
export const SCENARIOS: Scenario[] = ['pesimista', 'base', 'optimista'];

/** Tasa de descuento anual: bono EE.UU. 10a (~4.3%) + riesgo país (~4.4%) + prima del proyecto (~5.3%). */
export const DISCOUNT = 0.14;

export const MV_SOURCES = {
  airroi: { label: 'AirROI — Montañita, ago-2025 a jul-2026', url: 'https://www.airroi.com/airbnb-data/ecuador/santa-elena-province/monta%C3%B1ita' },
  ocupNacional: { label: 'Primicias — ocupación hotelera nacional 2025 (34.1%) y tarifa promedio $83', url: 'https://www.primicias.ec/economia/ecuador-turismo-tarifa-hoteles-balance-primer-feriado-86845/' },
  dharma: { label: 'Booking.com — Dharma Beach, Montañita (desde $147/noche)', url: 'https://www.booking.com/hotel/ec/dharma-beach.html' },
  gop: { label: 'HotelData.com — margen GOP 2025 (37.7%)', url: 'https://hoteldata.com/reports/q3-2025-profit-report/' },
  hvs: { label: 'HVS — U.S. Hotel Development Cost Survey 2025', url: 'https://www.hvs.com/article/10219-hvs-us-hotel-development-cost-survey-2025' },
  costo: { label: 'EcuaCost — costo de construcción por m² 2026 (Costa)', url: 'https://ecuacost.com/blog/precio-metro-cuadrado-construccion-ecuador/' },
  plusvalia: { label: 'Plusvalía — departamentos en venta en Olón (sep-2026)', url: 'https://www.plusvalia.com/venta/departamentos/santa-elena/santa-elena/olon' },
  mls: { label: 'MLS Ecuador — Condo del Valle, Olón ($115,000 / 78 m²)', url: 'https://mls-ecuador.com/es/inmuebles/olon-y-montanita' },
  riesgo: { label: 'Tagline — riesgo país 438 pb (18-ago-2026, BCE)', url: 'https://tagline-soluciones.com/indicadores/riesgo-pais/' },
} as const;

// ---------- utilidades financieras ----------
export function npv(rate: number, flows: number[]): number {
  return flows.reduce((acc, f, t) => acc + f / Math.pow(1 + rate, t), 0);
}

/** TIR por bisección; null si el flujo no cambia de signo. */
export function irr(flows: number[]): number | null {
  let lo = -0.99, hi = 5;
  const f = (r: number) => npv(r, flows);
  if (f(lo) * f(hi) > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (f(lo) * f(mid) <= 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

const perPeriod = (annual: number, periodsPerYear: number) => Math.pow(1 + annual, 1 / periodsPerYear) - 1;
const annualize = (r: number, periodsPerYear: number) => Math.pow(1 + r, periodsPerYear) - 1;

/** Periodo (en unidades del flujo, con fracción) en que el acumulado descontado se vuelve ≥ 0. */
export function paybackDiscounted(rate: number, flows: number[]): number | null {
  let acc = 0;
  for (let t = 0; t < flows.length; t++) {
    const prev = acc;
    acc += flows[t] / Math.pow(1 + rate, t);
    if (t > 0 && prev < 0 && acc >= 0) return t - 1 + -prev / (acc - prev);
  }
  return null;
}

// ---------- HOTEL ----------
export const HOTEL_KEYS = 104;

export const HOTEL_ASSUMPTIONS: Record<Scenario, {
  adr: number; occ: [number, number, number]; nonRoomShare: number; gop: number; capex: number; exitCap: number;
}> = {
  //         tarifa   ocupación año 1 / 2 / 3+     % ingresos no-habitación   margen GOP   inversión     tasa de salida
  pesimista: { adr: 70, occ: [0.25, 0.30, 0.34], nonRoomShare: 0.25, gop: 0.28, capex: 9_900_000, exitCap: 0.11 },
  base: { adr: 90, occ: [0.30, 0.36, 0.42], nonRoomShare: 0.30, gop: 0.33, capex: 9_000_000, exitCap: 0.10 },
  optimista: { adr: 115, occ: [0.35, 0.45, 0.52], nonRoomShare: 0.33, gop: 0.38, capex: 8_250_000, exitCap: 0.09 },
};

/** Otros cargos sobre ingresos totales: administración 3% + reserva de reposición (FF&E) 4%. */
const HOTEL_FEES = 0.07;
/** Seguros e impuestos prediales: 1% anual de la inversión. */
const HOTEL_FIXED = 0.01;
/** Años de construcción antes de operar. */
const HOTEL_BUILD_YEARS = 2;
const HOTEL_OPERATING_YEARS = 10;

export interface HotelYear { year: number; occ: number; revenue: number; noi: number; flow: number }

export function hotelModel(s: Scenario) {
  const a = HOTEL_ASSUMPTIONS[s];
  const years: HotelYear[] = [];
  // Construcción: 40% año 0, 60% año 1.
  years.push({ year: 0, occ: 0, revenue: 0, noi: 0, flow: -a.capex * 0.4 });
  years.push({ year: 1, occ: 0, revenue: 0, noi: 0, flow: -a.capex * 0.6 });
  let noi = 0;
  for (let i = 0; i < HOTEL_OPERATING_YEARS; i++) {
    const occ = a.occ[Math.min(i, 2)];
    const rooms = HOTEL_KEYS * 365 * occ * a.adr;
    const revenue = rooms / (1 - a.nonRoomShare);
    noi = revenue * (a.gop - HOTEL_FEES) - a.capex * HOTEL_FIXED;
    years.push({ year: HOTEL_BUILD_YEARS + i, occ, revenue, noi, flow: noi });
  }
  // Valor terminal: NOI del último año capitalizado a la tasa de salida.
  const terminal = noi / a.exitCap;
  years[years.length - 1].flow += terminal;
  const flows = years.map((y) => y.flow);
  const stabilized = years[HOTEL_BUILD_YEARS + 2];
  return {
    assumptions: a,
    years,
    flows,
    terminal,
    npv: npv(DISCOUNT, flows),
    irr: irr(flows),
    payback: paybackDiscounted(DISCOUNT, flows),
    stabilizedRevenue: stabilized.revenue,
    stabilizedNoi: stabilized.noi,
    noiYield: stabilized.noi / a.capex,
    /** Ocupación estabilizada que haría VAN = 0 con la tarifa del escenario. */
    breakEvenOcc: breakEvenHotelOcc(s),
  };
}

function breakEvenHotelOcc(s: Scenario): number | null {
  const a = HOTEL_ASSUMPTIONS[s];
  const valueAt = (occ: number) => {
    const flows = [-a.capex * 0.4, -a.capex * 0.6];
    let noi = 0;
    for (let i = 0; i < HOTEL_OPERATING_YEARS; i++) {
      const o = occ * (i === 0 ? 0.7 : i === 1 ? 0.85 : 1);
      noi = ((HOTEL_KEYS * 365 * o * a.adr) / (1 - a.nonRoomShare)) * (a.gop - HOTEL_FEES) - a.capex * HOTEL_FIXED;
      flows.push(noi);
    }
    flows[flows.length - 1] += noi / a.exitCap;
    return npv(DISCOUNT, flows);
  };
  let lo = 0, hi = 1;
  if (valueAt(hi) < 0) return null;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (valueAt(m) < 0) lo = m;
    else hi = m;
  }
  return hi;
}

// ---------- ETAPAS DE APARTAMENTOS ----------
export const APT_M2 = 151;

export const STAGE_BASE = [
  // soft = inversión preliminar + complementarios del informe original, actualizados +20% (inflación de construcción 2020–2026, EcuaCost).
  { name: 'Arrecife', units: 18, soft: (279_350 + 244_200) * 1.2 },
  { name: 'Coral', units: 39, soft: (825_600 + 567_600) * 1.2 },
  { name: 'Manglar', units: 24, soft: (411_200 + 357_230) * 1.2 },
];

export interface AptAssumption { price: number; cost: number; unitsPerQuarter: number }
export type AptAssumptions = Record<Scenario, AptAssumption>;

/** Supuestos por defecto; el súper admin puede sobrescribirlos (SiteContent propuesta_mv). */
export const APT_ASSUMPTIONS: AptAssumptions = {
  //         precio venta $/m²   costo construcción $/m²   ventas por trimestre
  pesimista: { price: 1_300, cost: 950, unitsPerQuarter: 2 },
  base: { price: 1_450, cost: 850, unitsPerQuarter: 3 },
  optimista: { price: 1_650, cost: 760, unitsPerQuarter: 5 },
};

/** Trimestres de obra; la entrega (y el cobro del 70%) ocurre al terminar. */
const BUILD_Q = 6;
const ENTRY = 0.3;

export function stageModel(
  stage: (typeof STAGE_BASE)[number],
  s: Scenario,
  a: AptAssumption = APT_ASSUMPTIONS[s],
  discount: number = DISCOUNT,
) {
  // Valores inválidos (0, vacío) desde el editor no deben romper el cálculo.
  a = { price: a.price || 1, cost: a.cost || 0, unitsPerQuarter: Math.max(1, Math.round(a.unitsPerQuarter) || 1) };
  const unitPrice = APT_M2 * a.price;
  const build = stage.units * APT_M2 * a.cost;
  const quarters = Math.max(BUILD_Q + 1, Math.ceil(stage.units / a.unitsPerQuarter)) + 1;
  const flows = new Array(quarters + 1).fill(0);
  flows[0] -= stage.soft * 0.6; // estudios, diseño, permisos
  flows[1] -= stage.soft * 0.4;
  for (let q = 1; q <= BUILD_Q; q++) flows[q] -= build / BUILD_Q;
  let sold = 0;
  for (let q = 0; q < quarters && sold < stage.units; q++) {
    const n = Math.min(a.unitsPerQuarter, stage.units - sold);
    sold += n;
    flows[q] += n * unitPrice * ENTRY;
    // Saldo al entregar: en la entrega si ya vendida, o al firmar si se vende después.
    flows[Math.max(q, BUILD_Q + 1)] += n * unitPrice * (1 - ENTRY);
  }
  const rq = perPeriod(discount, 4);
  const revenue = stage.units * unitPrice;
  const cost = build + stage.soft;
  const qIrr = irr(flows);
  let acc = 0, peak = 0;
  for (const f of flows) { acc += f; peak = Math.min(peak, acc); }
  return {
    ...stage,
    unitPrice,
    revenue,
    cost,
    profit: revenue - cost,
    margin: (revenue - cost) / revenue,
    flows,
    npv: npv(rq, flows),
    irr: qIrr == null ? null : annualize(qIrr, 4),
    peakEquity: -peak,
    quarters: flows.length,
  };
}

/** Valor residual del predio: VAN de todo el desarrollo, que es lo máximo que un desarrollador podría pagar por el terreno. */
export function portfolio(s: Scenario) {
  const hotel = hotelModel(s);
  const stages = STAGE_BASE.map((st) => stageModel(st, s));
  const total = hotel.npv + stages.reduce((a, x) => a + x.npv, 0);
  return { hotel, stages, residualLandValue: total };
}

/** Perfil del VAN (para la gráfica): VAN a distintas tasas. */
export function npvProfile(flows: number[], periodsPerYear: number, rates = [0, 0.05, 0.1, 0.14, 0.2, 0.25, 0.3]) {
  return rates.map((r) => ({ rate: r, npv: npv(perPeriod(r, periodsPerYear), flows) }));
}

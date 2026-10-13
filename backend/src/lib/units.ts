// Inventario de cualquier tipo de proyecto. Un «Lot» es una unidad: lote, casa,
// departamento, local… Las que no vienen del plano (sin geometría) se crean a mano
// desde el panel y se listan en la ficha, sin dibujarse en el mapa.

export const UNIT_TYPES = ['lotes', 'casas', 'departamentos', 'suites', 'locales', 'oficinas', 'bodegas', 'terrenos'] as const;

const num = (v: unknown) => (v === null || v === '' || v === undefined ? null : Number.isFinite(Number(v)) ? Number(v) : null);
const int = (v: unknown) => { const n = num(v); return n == null ? null : Math.round(n); };
const str = (v: unknown) => (v == null || String(v).trim() === '' ? null : String(v).trim().slice(0, 120));

/** Campos de unidad que se aceptan del panel (admin y desarrolladora). */
export function unitFields(body: Record<string, unknown>): Record<string, unknown> {
  const d: Record<string, unknown> = {};
  if ('unitType' in body) {
    if (!UNIT_TYPES.includes(String(body.unitType) as never)) throw new Error('Tipo de unidad inválido');
    d.unitType = String(body.unitType);
  }
  for (const k of ['builtM2', 'bathrooms', 'areaM2'] as const) if (k in body) d[k] = num(body[k]);
  for (const k of ['bedrooms', 'parking'] as const) if (k in body) d[k] = int(body[k]);
  for (const k of ['floor', 'block'] as const) if (k in body) d[k] = str(body[k]);
  return d;
}

/** Datos para crear una unidad sin plano. */
export function newUnit(body: Record<string, unknown>) {
  const code = str(body.code);
  if (!code) throw new Error('Escribe el código de la unidad');
  return {
    code,
    unitType: 'casas',
    ...unitFields(body),
    status: 'AVAILABLE' as const,
    price: num(body.price),
    description: str(body.description),
  };
}

export function cleanTypes(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return [...new Set(v.map(String).filter((t) => UNIT_TYPES.includes(t as never)))];
}

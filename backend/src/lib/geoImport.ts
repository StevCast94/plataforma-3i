// Importación de planos de lotización (GeoJSON exportado de GEO 3i, QGIS o AutoCAD Map).
// Acepta coordenadas WGS84 (lon/lat) o UTM zona 17 Sur (Ecuador costa), que convierte.
// Solo trae GEOMETRÍA: el merge es por código y nunca pisa precio, estado ni dueño.

type Pos = number[];
type Ring = Pos[];

/** UTM (zona 17 S por defecto) → [lon, lat] WGS84. */
export function utmToLonLat(e: number, n: number, zone = 17, south = true): [number, number] {
  const a = 6378137;
  const f = 1 / 298.257223563;
  const k0 = 0.9996;
  const e2 = f * (2 - f);
  const ep2 = e2 / (1 - e2);
  const x = e - 500000;
  const y = south ? n - 10000000 : n;
  const m = y / k0;
  const mu = m / (a * (1 - e2 / 4 - (3 * e2 * e2) / 64 - (5 * e2 ** 3) / 256));
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 * e1) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu);
  const n1 = a / Math.sqrt(1 - e2 * Math.sin(phi1) ** 2);
  const t1 = Math.tan(phi1) ** 2;
  const c1 = ep2 * Math.cos(phi1) ** 2;
  const r1 = (a * (1 - e2)) / (1 - e2 * Math.sin(phi1) ** 2) ** 1.5;
  const d = x / (n1 * k0);
  const lat =
    phi1 -
    ((n1 * Math.tan(phi1)) / r1) *
      ((d * d) / 2 - ((5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * ep2) * d ** 4) / 24 + ((61 + 90 * t1 + 298 * c1 + 45 * t1 * t1 - 252 * ep2 - 3 * c1 * c1) * d ** 6) / 720);
  const lon =
    (d - ((1 + 2 * t1 + c1) * d ** 3) / 6 + ((5 - 2 * c1 + 28 * t1 - 3 * c1 * c1 + 8 * ep2 + 24 * t1 * t1) * d ** 5) / 120) / Math.cos(phi1);
  const lon0 = ((zone - 1) * 6 - 180 + 3) * (Math.PI / 180);
  return [(lon0 + lon) * (180 / Math.PI), lat * (180 / Math.PI)];
}

/** Área (m²) de un anillo en lon/lat, proyección local equirectangular (error < 0,5 % en lotes). */
function areaM2(ring: Ring): number {
  const lat0 = (ring.reduce((s, p) => s + p[1], 0) / ring.length) * (Math.PI / 180);
  const mx = 111_320 * Math.cos(lat0);
  const my = 110_540;
  let s = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    s += x1 * mx * (y2 * my) - x2 * mx * (y1 * my);
  }
  return Math.abs(s / 2);
}

const pick = (props: Record<string, unknown>, keys: string[]) => {
  for (const k of Object.keys(props)) if (keys.includes(k.toLowerCase())) {
    const v = props[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return null;
};

export interface ImportedLot {
  code: string;
  block: string | null;
  geometry: { type: 'Polygon'; coordinates: Ring[] };
  centroidLat: number;
  centroidLng: number;
  areaM2: number;
}

/** Lee un FeatureCollection y devuelve lotes listos para guardar, más avisos. */
export function parseLots(geojson: unknown): { lots: ImportedLot[]; warnings: string[] } {
  const fc = geojson as { type?: string; features?: { geometry?: { type?: string; coordinates?: unknown }; properties?: Record<string, unknown> }[] };
  if (fc?.type !== 'FeatureCollection' || !Array.isArray(fc.features)) throw new Error('El archivo no es un GeoJSON FeatureCollection');
  const warnings: string[] = [];
  const lots: ImportedLot[] = [];
  const seen = new Set<string>();
  fc.features.forEach((f, i) => {
    const g = f.geometry;
    let ring: Ring | undefined;
    if (g?.type === 'Polygon') ring = (g.coordinates as Ring[])?.[0];
    else if (g?.type === 'MultiPolygon') ring = (g.coordinates as Ring[][])?.[0]?.[0];
    if (!ring || ring.length < 4) {
      warnings.push(`Elemento ${i + 1}: no es un polígono, se omitió`);
      return;
    }
    const props = f.properties ?? {};
    const code = pick(props, ['code', 'codigo', 'código', 'lote', 'lot', 'name', 'nombre', 'id', 'num', 'numero']);
    if (!code) {
      warnings.push(`Elemento ${i + 1}: sin código de lote, se omitió`);
      return;
    }
    if (seen.has(code.toUpperCase())) {
      warnings.push(`Código repetido: ${code} (se usó el primero)`);
      return;
    }
    seen.add(code.toUpperCase());
    const utm = Math.abs(ring[0][0]) > 180 || Math.abs(ring[0][1]) > 90;
    const ll: Ring = ring.map(([x, y]) => (utm ? utmToLonLat(x, y) : [x, y]));
    const open = ll.slice(0, -1);
    const declared = Number(pick(props, ['area', 'área', 'area_m2', 'superficie']));
    lots.push({
      code,
      block: pick(props, ['block', 'manzana', 'mz']),
      geometry: { type: 'Polygon', coordinates: [ll] },
      centroidLng: open.reduce((s, p) => s + p[0], 0) / open.length,
      centroidLat: open.reduce((s, p) => s + p[1], 0) / open.length,
      areaM2: Number.isFinite(declared) && declared > 0 ? declared : Math.round(areaM2(open) * 100) / 100,
    });
  });
  return { lots, warnings };
}

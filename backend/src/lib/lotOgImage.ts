import jpeg from 'jpeg-js';
import { prisma } from '../prisma';

/**
 * Imagen para la vista previa (WhatsApp/Facebook) de la ficha de un solar:
 * foto satelital de la zona con el solar resaltado y sus vecinos delineados.
 *
 * Se arma en el servidor pegando teselas de Esri World Imagery (el mismo mapa
 * del sitio) y dibujando los polígonos a mano, en JavaScript puro: sin
 * dependencias nativas que puedan romper el despliegue.
 */

const W = 1200;
const H = 630;
const TILE = 256;
const MAX_Z = 18; // Esri no tiene imagen más detallada en Manglaralto
const TILE_URL = (z: number, x: number, y: number) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;

type Ring = [number, number][]; // [lng, lat]

/** Coordenada de píxel global (Web Mercator) a un zoom dado. */
function mercator(lng: number, lat: number, z: number): [number, number] {
  const s = TILE * 2 ** z;
  const x = ((lng + 180) / 360) * s;
  const r = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * s;
  return [x, y];
}

const tileKey = (x: number, y: number) => x + "/" + y;
const cache = new Map<string, Buffer>();
const tileCache = new Map<string, { data: Uint8Array; width: number; height: number } | null>();

async function getTile(z: number, x: number, y: number) {
  const key = `${z}/${x}/${y}`;
  if (tileCache.has(key)) return tileCache.get(key)!;
  try {
    const r = await fetch(TILE_URL(z, x, y));
    if (!r.ok) throw new Error(String(r.status));
    const img = jpeg.decode(Buffer.from(await r.arrayBuffer()), { useTArray: true, formatAsRGBA: true });
    const t = { data: img.data, width: img.width, height: img.height };
    if (tileCache.size > 400) tileCache.clear();
    tileCache.set(key, t);
    return t;
  } catch {
    tileCache.set(key, null);
    return null;
  }
}

/** Mezcla un color sobre el lienzo RGBA. */
function blend(buf: Uint8Array, x: number, y: number, rgb: [number, number, number], a: number) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  buf[i] = buf[i] * (1 - a) + rgb[0] * a;
  buf[i + 1] = buf[i + 1] * (1 - a) + rgb[1] * a;
  buf[i + 2] = buf[i + 2] * (1 - a) + rgb[2] * a;
}

/** Relleno por barrido (regla par-impar). */
function fill(buf: Uint8Array, pts: [number, number][], rgb: [number, number, number], a: number) {
  const ys = pts.map((p) => p[1]);
  const y0 = Math.max(0, Math.floor(Math.min(...ys)));
  const y1 = Math.min(H - 1, Math.ceil(Math.max(...ys)));
  for (let y = y0; y <= y1; y++) {
    const cy = y + 0.5;
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[(i + 1) % pts.length];
      if ((ay <= cy && by > cy) || (by <= cy && ay > cy)) xs.push(ax + ((cy - ay) / (by - ay)) * (bx - ax));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = Math.max(0, Math.ceil(xs[k])); x <= Math.min(W - 1, Math.floor(xs[k + 1])); x++) blend(buf, x, y, rgb, a);
    }
  }
}

/** Contorno grueso: se estampa un disco a lo largo de cada tramo. */
function stroke(buf: Uint8Array, pts: [number, number][], width: number, rgb: [number, number, number], a: number) {
  const r = width / 2;
  const seen = new Set<number>();
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % pts.length];
    const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay)));
    for (let s = 0; s <= steps; s++) {
      const cx = ax + ((bx - ax) * s) / steps;
      const cy = ay + ((by - ay) * s) / steps;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) {
        for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
          if (dx * dx + dy * dy > r * r) continue;
          const x = Math.round(cx + dx);
          const y = Math.round(cy + dy);
          const k = y * W + x;
          if (seen.has(k)) continue; // sin doble mezcla en las esquinas
          seen.add(k);
          blend(buf, x, y, rgb, a);
        }
      }
    }
  }
}

function ringOf(geometry: unknown): Ring | null {
  const g = geometry as { coordinates?: number[][][] } | null;
  const ring = g?.coordinates?.[0];
  return Array.isArray(ring) && ring.length >= 3 ? (ring as Ring) : null;
}

/** JPEG 1200×630 del solar, o null si no tiene geometría. Cacheado por versión del solar. */
export async function lotOgImage(projectSlug: string, code: string): Promise<Buffer | null> {
  const project = await prisma.project.findUnique({ where: { slug: projectSlug }, select: { id: true } });
  if (!project) return null;
  const lot = await prisma.lot.findFirst({
    where: { projectId: project.id, code, active: true },
    select: { id: true, geometry: true, updatedAt: true },
  });
  const ring = lot ? ringOf(lot.geometry) : null;
  if (!lot || !ring) return null;

  const key = `${lot.id}:${lot.updatedAt.getTime()}`;
  const hit = cache.get(key);
  if (hit) return hit;

  // Zoom: el mayor en que el solar ocupa como mucho ~40% del ancho y ~50% del alto.
  // Por encima de MAX_Z se amplía la imagen del nivel 18 (zoom digital, hasta x4).
  let z = MAX_Z + 2;
  for (; z > 12; z--) {
    const px = ring.map(([lng, lat]) => mercator(lng, lat, z));
    const w = Math.max(...px.map((p) => p[0])) - Math.min(...px.map((p) => p[0]));
    const h = Math.max(...px.map((p) => p[1])) - Math.min(...px.map((p) => p[1]));
    if (w <= W * 0.4 && h <= H * 0.5) break;
  }
  const px = ring.map(([lng, lat]) => mercator(lng, lat, z));
  const cx = (Math.max(...px.map((p) => p[0])) + Math.min(...px.map((p) => p[0]))) / 2;
  const cy = (Math.max(...px.map((p) => p[1])) + Math.min(...px.map((p) => p[1]))) / 2;
  const ox = cx - W / 2;
  const oy = cy - H / 2;

  const buf = new Uint8Array(W * H * 4).fill(40);
  const tz = Math.min(z, MAX_Z);
  const k = 2 ** (z - tz); // factor de ampliación digital
  const tx0 = Math.floor(ox / k / TILE);
  const ty0 = Math.floor(oy / k / TILE);
  const tx1 = Math.floor((ox + W) / k / TILE);
  const ty1 = Math.floor((oy + H) / k / TILE);
  const tiles = new Map<string, Awaited<ReturnType<typeof getTile>>>();
  const jobs: Promise<void>[] = [];
  for (let ty = ty0; ty <= ty1; ty++)
    for (let tx = tx0; tx <= tx1; tx++) jobs.push(getTile(tz, tx, ty).then((t) => void tiles.set(tileKey(tx, ty), t)));
  await Promise.all(jobs);
  // Cada píxel de salida toma su color de la tesela de origen (vecino más cercano).
  for (let dy = 0; dy < H; dy++) {
    const gy = (oy + dy) / k;
    const ty = Math.floor(gy / TILE);
    const sy = Math.min(TILE - 1, Math.floor(gy - ty * TILE));
    for (let dx = 0; dx < W; dx++) {
      const gx = (ox + dx) / k;
      const tx = Math.floor(gx / TILE);
      const t = tiles.get(tileKey(tx, ty));
      if (!t) continue;
      const sx = Math.min(t.width - 1, Math.floor(gx - tx * TILE));
      const si = (sy * t.width + sx) * 4;
      const d = (dy * W + dx) * 4;
      buf[d] = t.data[si];
      buf[d + 1] = t.data[si + 1];
      buf[d + 2] = t.data[si + 2];
      buf[d + 3] = 255;
    }
  }

  // Oscurece un poco la foto para que resalte el solar.
  for (let i = 0; i < buf.length; i += 4) {
    buf[i] *= 0.78;
    buf[i + 1] *= 0.78;
    buf[i + 2] *= 0.78;
  }

  // Vecinos: solo contorno fino.
  const neighbors = await prisma.lot.findMany({
    where: { projectId: project.id, active: true, id: { not: lot.id }, kind: 'LOT' },
    select: { geometry: true },
  });
  const toScreen = (r: Ring) => r.map(([lng, lat]) => {
    const [x, y] = mercator(lng, lat, z);
    return [x - ox, y - oy] as [number, number];
  });
  for (const n of neighbors) {
    const r = ringOf(n.geometry);
    if (!r) continue;
    const s = toScreen(r);
    if (s.every(([x, y]) => x < -50 || y < -50 || x > W + 50 || y > H + 50)) continue;
    stroke(buf, s, 2, [255, 255, 255], 0.55);
  }

  // El solar: relleno dorado y contorno blanco grueso.
  const main = toScreen(ring);
  fill(buf, main, [255, 196, 40], 0.5);
  stroke(buf, main, 6, [255, 255, 255], 1);

  const out = jpeg.encode({ data: buf, width: W, height: H }, 82).data;
  if (cache.size > 200) cache.clear();
  cache.set(key, out);
  return out;
}

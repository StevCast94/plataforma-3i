import { adminApi } from '@/lib/adminApi';
import type { Panorama } from '@shared/types';

// ============================================================
// Corta una imagen 360° en mosaicos en el navegador del admin y los sube a
// Cloudinary. El visitante descarga primero una versión liviana (2048 px) y
// después solo los mosaicos de la zona que está mirando, con más detalle a
// medida que acerca la vista.
//
// Dos tipos de imagen:
//  - Equirectangular completa (2:1): cubre 360° × 180°.
//  - Panorámica parcial (p. ej. la del iPhone): cubre `hfov` grados de lado a
//    lado y solo una franja vertical. Se coloca centrada dentro de una esfera
//    virtual; los mosaicos que caen fuera de la foto no se generan (null) y el
//    visor limita el giro a la zona con imagen.
//
// Niveles de 4096, 8192 y 16384 px de ancho (esfera completa), hasta alcanzar
// la densidad de la foto original. Cada mosaico es de 512×512 px en JPEG.
// ============================================================

const TILE = 512;
const QUALITY = 0.85;
const BG = '#1f2937';

function toBlob(canvas: HTMLCanvasElement, quality = QUALITY): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo generar la imagen'))), 'image/jpeg', quality),
  );
}

function blobToDataUri(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(b);
  });
}

async function upload(b: Blob, folder: string): Promise<string> {
  const dataUri = await blobToDataUri(b);
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await adminApi.post<{ url: string }>('/admin/seed-images', { dataUri, folder });
      return res.url;
    } catch (err) {
      if (attempt >= 2) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

export interface EquirectInfo {
  width: number;
  height: number;
  /** true si no es 2:1: se trata como panorámica parcial. */
  partial: boolean;
  /** Ángulo horizontal estimado (grados) para una panorámica parcial. */
  hfov: number;
  warning?: string;
  /** Datos de la foto (GPS del teléfono o dron). */
  lat?: number;
  lng?: number;
  altitude?: number;
  /** Rumbo de la cámara en grados (0 = norte). */
  heading?: number;
}

/** Revisa la imagen antes de procesarla: tamaño, tipo (completa o parcial) y datos GPS. */
export async function inspectEquirect(file: File): Promise<EquirectInfo> {
  const bmp = await createImageBitmap(file);
  const { width, height } = bmp;
  bmp.close();
  const ratio = width / height;
  const partial = Math.abs(ratio - 2) > 0.05;
  // Panorámica de teléfono: la franja vertical cubre unos 65°.
  const hfov = partial ? Math.min(360, Math.round(65 * ratio)) : 360;
  let warning: string | undefined;
  if (partial && ratio < 2)
    warning = `La imagen mide ${width}×${height}: es más alta que una 360°. Revisa que sea una panorámica.`;
  else if (!partial && width < 4096)
    warning = `La imagen mide ${width} px de ancho: se verá con poco detalle. Lo ideal es 8192 px o más.`;

  const info: EquirectInfo = { width, height, partial, hfov, warning };
  try {
    const exifr = (await import('exifr')).default;
    const m = await exifr.parse(file, { gps: true, exif: true });
    if (m?.latitude != null && m?.longitude != null) {
      info.lat = m.latitude;
      info.lng = m.longitude;
    }
    if (typeof m?.GPSAltitude === 'number') info.altitude = Math.round(m.GPSAltitude * 10) / 10;
    if (typeof m?.GPSImgDirection === 'number') info.heading = m.GPSImgDirection;
  } catch {
    /* sin datos de la cámara */
  }
  return info;
}

/**
 * Procesa y sube la imagen. `hfov` < 360 la trata como panorámica parcial.
 * `onProgress` recibe (hechos, total) para la barra.
 */
export async function buildPanoramaTiles(
  file: File,
  onProgress: (done: number, total: number) => void,
  hfov = 360,
): Promise<Panorama['tiles']> {
  const bmp = await createImageBitmap(file);
  const folder = `grupo3i/pano/${Date.now().toString(36)}`;

  // Esfera virtual: ancho completo (360°) y la foto centrada en ella.
  const partial = hfov < 359;
  const fullW = partial ? (bmp.width * 360) / hfov : bmp.width;
  const fullH = fullW / 2;
  const ox = (fullW - bmp.width) / 2;
  const oy = (fullH - bmp.height) / 2;
  const vfov = partial ? (bmp.height / fullH) * 180 : 180;

  // Niveles hasta la densidad de la original (sin agrandar de más).
  const widths = [4096];
  while (widths[widths.length - 1] < 16384 && widths[widths.length - 1] * 1.25 < fullW) widths.push(widths[widths.length - 1] * 2);

  // Mosaicos con imagen en cada nivel.
  type Job = { col: number; row: number; sx: number; sy: number; sw: number; sh: number; dx: number; dy: number; dw: number; dh: number };
  const plan = widths.map((width) => {
    const s = fullW / width; // px de la esfera virtual por px del nivel
    const cols = width / TILE;
    const rows = cols / 2;
    const jobs: Job[] = [];
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < cols; col++) {
        // Rectángulo del mosaico en coordenadas de la foto original.
        const x0 = col * TILE * s - ox;
        const y0 = row * TILE * s - oy;
        const x1 = x0 + TILE * s;
        const y1 = y0 + TILE * s;
        const ix0 = Math.max(0, x0);
        const iy0 = Math.max(0, y0);
        const ix1 = Math.min(bmp.width, x1);
        const iy1 = Math.min(bmp.height, y1);
        if (ix1 <= ix0 || iy1 <= iy0) continue; // fuera de la foto
        jobs.push({
          col,
          row,
          sx: ix0,
          sy: iy0,
          sw: ix1 - ix0,
          sh: iy1 - iy0,
          dx: (ix0 - x0) / s,
          dy: (iy0 - y0) / s,
          dw: (ix1 - ix0) / s,
          dh: (iy1 - iy0) / s,
        });
      }
    return { width, cols, rows, jobs };
  });

  const total = 1 + plan.reduce((n, l) => n + l.jobs.length, 0);
  let done = 0;
  const tick = () => onProgress(++done, total);
  onProgress(0, total);

  // Versión liviana (esfera completa) que se ve al instante.
  const base = document.createElement('canvas');
  base.width = 2048;
  base.height = 1024;
  const bctx = base.getContext('2d')!;
  bctx.fillStyle = BG;
  bctx.fillRect(0, 0, 2048, 1024);
  const bs = 2048 / fullW;
  bctx.drawImage(bmp, ox * bs, oy * bs, bmp.width * bs, bmp.height * bs);
  const baseUrl = await upload(await toBlob(base, 0.8), folder);
  tick();

  const levels: Panorama['tiles']['levels'] = [];
  for (const { width, cols, rows, jobs } of plan) {
    const tiles: (string | null)[] = new Array(cols * rows).fill(null);
    let next = 0;
    // 4 subidas en paralelo.
    const worker = async () => {
      const c = document.createElement('canvas');
      c.width = TILE;
      c.height = TILE;
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingQuality = 'high';
      while (next < jobs.length) {
        const j = jobs[next++];
        ctx.fillStyle = BG;
        ctx.fillRect(0, 0, TILE, TILE);
        ctx.drawImage(bmp, j.sx, j.sy, j.sw, j.sh, j.dx, j.dy, j.dw, j.dh);
        tiles[j.row * cols + j.col] = await upload(await toBlob(c), folder);
        tick();
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    levels.push({ width, cols, rows, tiles });
  }
  bmp.close();
  return partial ? { baseUrl, levels, range: { hfov, vfov: Math.round(vfov * 10) / 10 } } : { baseUrl, levels };
}

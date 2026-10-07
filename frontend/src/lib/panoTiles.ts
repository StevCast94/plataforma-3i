import { adminApi } from '@/lib/adminApi';
import type { Panorama } from '@shared/types';

// ============================================================
// Corta una imagen equirectangular en mosaicos en el navegador del admin y
// los sube a Cloudinary. El visitante descarga primero una versión liviana
// (2048 px) y después solo los mosaicos de la zona que está mirando, con más
// detalle a medida que acerca la vista.
//
// Niveles: 4096 px (8×4 mosaicos) y, si la imagen original lo permite,
// 8192 px (16×8). Cada mosaico es de 512×512 px en JPEG.
// ============================================================

const TILE = 512;
const QUALITY = 0.85;

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

/** Revisa la imagen antes de procesarla: tamaño y proporción 2:1. */
export async function inspectEquirect(file: File): Promise<{ width: number; height: number; warning?: string }> {
  const bmp = await createImageBitmap(file);
  const { width, height } = bmp;
  bmp.close();
  const ratio = width / height;
  let warning: string | undefined;
  if (Math.abs(ratio - 2) > 0.03)
    warning = `La imagen mide ${width}×${height} (proporción ${ratio.toFixed(2)}:1). Una equirectangular debe ser 2:1; se verá deformada.`;
  else if (width < 4096) warning = `La imagen mide ${width} px de ancho: se verá con poco detalle. Lo ideal es 8192 px o más.`;
  return { width, height, warning };
}

/**
 * Procesa y sube la imagen. `onProgress` recibe (hechos, total) para la barra.
 */
export async function buildPanoramaTiles(
  file: File,
  onProgress: (done: number, total: number) => void,
): Promise<Panorama['tiles']> {
  const bmp = await createImageBitmap(file);
  const folder = `grupo3i/pano/${Date.now().toString(36)}`;
  const widths = bmp.width >= 6000 ? [4096, 8192] : [4096];
  const total = 1 + widths.reduce((n, w) => n + (w / TILE) * (w / 2 / TILE), 0);
  let done = 0;
  const tick = () => onProgress(++done, total);
  onProgress(0, total);

  // Versión liviana que se ve al instante mientras cargan los mosaicos.
  const base = document.createElement('canvas');
  base.width = 2048;
  base.height = 1024;
  base.getContext('2d')!.drawImage(bmp, 0, 0, 2048, 1024);
  const baseUrl = await upload(await toBlob(base, 0.8), folder);
  tick();

  const levels: Panorama['tiles']['levels'] = [];
  for (const width of widths) {
    const height = width / 2;
    const cols = width / TILE;
    const rows = height / TILE;
    // Escala de la imagen original a este nivel (por mosaico, para no crear un lienzo gigante).
    const sx = bmp.width / width;
    const sy = bmp.height / height;
    const jobs: { col: number; row: number }[] = [];
    for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) jobs.push({ col, row });
    const tiles: string[] = new Array(jobs.length);
    const tileCanvas = () => {
      const c = document.createElement('canvas');
      c.width = TILE;
      c.height = TILE;
      return c;
    };
    // 4 subidas en paralelo.
    let next = 0;
    const worker = async () => {
      const c = tileCanvas();
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingQuality = 'high';
      while (next < jobs.length) {
        const { col, row } = jobs[next++];
        ctx.drawImage(bmp, col * TILE * sx, row * TILE * sy, TILE * sx, TILE * sy, 0, 0, TILE, TILE);
        tiles[row * cols + col] = await upload(await toBlob(c), folder);
        tick();
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    levels.push({ width, cols, rows, tiles });
  }
  bmp.close();
  return { baseUrl, levels };
}

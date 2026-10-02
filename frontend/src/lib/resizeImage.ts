const MAX_SIDE = 2000;
const SKIP_BYTES = 400 * 1024;

/**
 * Reduce una foto antes de subirla: lado largo máximo de 2000 px y JPEG al 85 %.
 * Una foto de celular de 8 MB queda en ~400 KB, de sobra para pantallas retina.
 * Los GIF/SVG y las imágenes ya pequeñas se suben tal cual.
 */
export async function resizeForUpload(file: File): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size <= SKIP_BYTES) {
      bmp.close();
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.fillStyle = '#fff'; // los PNG con transparencia no se ponen negros al pasar a JPEG
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const out = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
    return out && out.size < file.size ? out : file;
  } catch {
    return file; // el navegador no pudo decodificarla: se sube original
  }
}

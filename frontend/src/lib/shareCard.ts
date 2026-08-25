// Genera una tarjeta vertical (formato Instagram/WhatsApp Status, 1080x1920)
// con el QR del socio + isotipo de marca superpuesto. El QR "pelado" que ya
// se podía descargar sirve para imprimir, pero para redes necesita contexto
// visual — nadie comparte un cuadrado blanco y negro suelto en su Story.

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Devuelve un PNG data URL listo para descargar/compartir. */
export async function generateShareCard(
  qrDataUrl: string,
  firstName: string,
): Promise<string> {
  // Espera las fuentes antes de dibujar texto — si no, cae al fallback del
  // sistema y se ve genérico (el canvas no re-dibuja solo cuando cargan).
  await document.fonts?.ready?.catch(() => {});

  const [qrImg, isotipoImg] = await Promise.all([
    loadImage(qrDataUrl),
    loadImage('/images/isotipo.svg'),
  ]);

  const W = 1080;
  const H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no soportado');

  // Fondo oscuro degradado — mismo lenguaje visual que og-cover.png.
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#1f1f1f');
  grad.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';

  // Isotipo
  const markSize = 200;
  ctx.drawImage(isotipoImg, W / 2 - markSize / 2, 220, markSize, markSize);

  // Wordmark
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 76px "Playfair Display", Georgia, serif';
  ctx.fillText('Grupo 3i', W / 2, 540);

  ctx.fillStyle = '#d5c03d';
  ctx.font = '600 30px Inter, sans-serif';
  ctx.fillText('INVERSIÓN INMOBILIARIA · CLUB DE VIAJES', W / 2, 590);

  // Tarjeta blanca con el QR
  const cardW = 760;
  const cardH = 760;
  const cardX = W / 2 - cardW / 2;
  const cardY = 700;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, cardX, cardY, cardW, cardH, 36);
  ctx.fill();

  const qrPad = 70;
  ctx.drawImage(qrImg, cardX + qrPad, cardY + qrPad, cardW - qrPad * 2, cardH - qrPad * 2);

  // Invitación
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 48px Inter, sans-serif';
  ctx.fillText(`Te invita ${firstName}`, W / 2, cardY + cardH + 110);

  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '400 32px Inter, sans-serif';
  ctx.fillText('Escanea y únete al Club 3i', W / 2, cardY + cardH + 165);

  return canvas.toDataURL('image/png');
}

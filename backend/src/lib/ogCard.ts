import type { Request } from 'express';
import type { OgCampaign } from './ogCampaigns';

/**
 * Bots que piden la página SOLO para armar la vista previa del enlace. No son
 * visitantes: no se les setea cookie de referido ni se les cuenta el click
 * (WhatsApp pide el enlace apenas lo escribes en el chat — contarlo inflaba
 * las estadísticas del socio con clicks que nunca ocurrieron).
 */
const CRAWLER_UA =
  /(whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|pinterest|redditbot|skypeuripreview|vkshare|embedly|quora link preview|bitlybot|applebot|iframely)/i;

export function isSocialCrawler(req: Request): boolean {
  return CRAWLER_UA.test(String(req.get('user-agent') ?? ''));
}

/** Origen público del sitio. Railway va detrás de proxy, así que se prefiere
 *  la variable de entorno antes que adivinar por los headers. */
export function publicOrigin(req: Request): string {
  const fromEnv = process.env.PUBLIC_BASE_URL?.trim().replace(/\/+$/, '');
  if (fromEnv) return fromEnv;
  const host = req.get('x-forwarded-host') ?? req.get('host');
  const proto = req.get('x-forwarded-proto') ?? req.protocol ?? 'https';
  return host ? `${proto}://${host}` : 'https://grupo3i.com';
}

/**
 * URL absoluta y "crawler-safe" de la imagen de la tarjeta.
 *
 * Para las de Cloudinary se inyecta la misma transformación que usa ImeldiShop
 * (cuya tarjeta cuadrada sí se ve grande en WhatsApp):
 *   - w_1080,h_1080,c_pad  → cuadra sin recortar nada de la foto
 *   - f_jpg                → JPG explícito, NO f_auto: los crawlers no mandan
 *                            un header Accept confiable y algunos no leen WebP
 *   - q_auto               → peso bajo (WhatsApp descarta imágenes pesadas)
 */
export function ogImageUrl(image: string, origin: string): string {
  const src = (image ?? '').trim();
  if (!src) return `${origin}/images/og-cover.png`;
  if (src.includes('/image/upload/')) {
    return src.replace(
      '/image/upload/',
      '/image/upload/w_1080,h_1080,c_pad,b_auto,q_auto,f_jpg/',
    );
  }
  if (/^https?:\/\//i.test(src)) return src;
  return `${origin}${src.startsWith('/') ? '' : '/'}${src}`;
}

/** Escapa texto para meterlo dentro de un atributo HTML. */
function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * HTML mínimo con las meta tags de la tarjeta. Solo lo reciben los crawlers;
 * aun así lleva redirección (meta refresh + JS) por si algún navegador real
 * llega aquí con un User-Agent raro — así nunca queda nadie en una hoja en
 * blanco.
 */
export function renderOgCard(opts: {
  campaign: OgCampaign;
  referrerName: string | null;
  canonicalUrl: string;
  redirectTo: string;
  origin: string;
}): string {
  const { campaign, referrerName, canonicalUrl, redirectTo, origin } = opts;

  // {nombre} → primer nombre del socio. Si no se pudo resolver (código
  // inválido, o la BD no respondió) cae a la marca en vez de borrar el
  // placeholder: quitarlo dejaba títulos sin sujeto ("Te invita a invertir…").
  const title = campaign.title.replace(/\{nombre\}/g, referrerName || 'Grupo 3i');

  const image = ogImageUrl(campaign.image, origin);

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(campaign.description)}" />
<link rel="canonical" href="${esc(canonicalUrl)}" />

<meta property="og:type" content="website" />
<meta property="og:site_name" content="Grupo 3i" />
<meta property="og:url" content="${esc(canonicalUrl)}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(campaign.description)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:image:secure_url" content="${esc(image)}" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:width" content="1080" />
<meta property="og:image:height" content="1080" />
<meta property="og:image:alt" content="${esc(title)}" />
<meta property="og:locale" content="es_EC" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(campaign.description)}" />
<meta name="twitter:image" content="${esc(image)}" />

<meta http-equiv="refresh" content="0; url=${esc(redirectTo)}" />
</head>
<body>
<p><a href="${esc(redirectTo)}">${esc(title)}</a></p>
<script>window.location.replace(${JSON.stringify(redirectTo)});</script>
</body>
</html>`;
}

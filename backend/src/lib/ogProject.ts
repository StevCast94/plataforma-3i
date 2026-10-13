import fs from 'fs';
import path from 'path';
import type { Request, Response } from 'express';
import { prisma } from '../prisma';
import { publicBaseUrl } from './publicUrl';

/**
 * Tarjeta social de la página de un proyecto (/proyectos/:slug).
 *
 * WhatsApp y Facebook NO ejecutan JavaScript: leen el HTML tal cual sale del
 * servidor, así que las meta tags que pone react-helmet dentro del SPA no les
 * llegan. Aquí se reescriben sobre el index.html antes de enviarlo, con la
 * imagen y el texto de cada proyecto. El HTML sigue siendo el mismo documento
 * del SPA, así que un visitante real no nota nada.
 */

/** Imagen y texto propios por proyecto. Sin entrada, se usa la portada y la descripción del proyecto. */
const OVERRIDES: Record<string, { title: string; description: string; image: string }> = {
  'montanita-view': {
    title: 'Montañita View — mapa interactivo de lotes',
    description:
      'Explora los 90 lotes disponibles en el mapa satelital: toca cualquiera y mira su precio, su cuota mensual, sus linderos y su frente a la calle. Manglaralto, Ruta del Spondylus, desde $85/m².',
    image: '/images/og/og-montanita-view.jpg',
  },
  'ibiza-condohotel': {
    title: 'Ibiza Condohotel — fracciones desde $12,000',
    description:
      'Propiedad fraccionada en un condohotel a 300 m del mar en la costa ecuatoriana: disfruta tus 4 semanas al año, gana con la plusvalía y deja un patrimonio a tu familia.',
    image: '/images/og/og-ibiza.jpg',
  },
};

/** Lo mismo en inglés, para los enlaces /en/proyectos/:slug. */
const OVERRIDES_EN: Record<string, { title: string; description: string; image: string }> = {
  'montanita-view': {
    title: 'Montañita View — interactive lot map',
    description:
      'Explore all 90 available lots on the satellite map — tap any lot to see its price, monthly payment, boundaries and street frontage. Manglaralto, on the Ruta del Spondylus, from $85/m².',
    image: '/images/og/og-montanita-view.jpg',
  },
  'ibiza-condohotel': {
    title: 'Ibiza Condohotel — shares from $12,000',
    description:
      'Own a share of a condo-hotel 300 m from the beach on Ecuador’s coast: enjoy 4 weeks a year, build equity and pass it on to your family.',
    image: '/images/og/og-ibiza.jpg',
  },
};

const esc = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Primer párrafo de la descripción del proyecto, recortado para la tarjeta. */
function summarize(text: string | null, max = 200): string {
  const first = (text ?? '').split('\n').map((l) => l.trim()).filter(Boolean)[0] ?? '';
  return first.length > max ? `${first.slice(0, max - 1).trimEnd()}…` : first;
}

/**
 * Sustituye el valor de una meta por property/name. `\s+` cubre también las que
 * el formateador parte en varias líneas; si la meta no existe, devuelve el HTML igual.
 */
function setMeta(html: string, attr: 'property' | 'name', key: string, value: string): string {
  const re = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`, 'i');
  // Reemplazo por función, no por cadena: un precio como "$100" dentro del texto
  // se interpretaría como la referencia $1 al grupo capturado.
  return html.replace(re, (_m, open: string, close: string) => `${open}${esc(value)}${close}`);
}

export function projectOgHandler(frontendPath: string) {
  const indexPath = path.join(frontendPath, 'index.html');

  return async (req: Request, res: Response) => {
    try {
      const slug = String(req.params.slug ?? '');
      const project = await prisma.project.findUnique({
        where: { slug },
        select: { name: true, description: true, coverImage: true, active: true },
      });
      if (!project) {
        res.sendFile(indexPath);
        return;
      }
      const origin = publicBaseUrl();
      // El idioma lo marca el prefijo de la ruta (/en/proyectos/...).
      const lang = req.path.startsWith('/en/') ? 'en' : 'es';
      const ov = lang === 'en' ? OVERRIDES_EN[slug] : OVERRIDES[slug];
      const title = ov?.title ?? `${project.name} — Grupo 3i`;
      const description = ov?.description ?? summarize(project.description);
      const rawImage = ov?.image ?? project.coverImage ?? '/images/og-cover.png';
      const image = /^https?:\/\//i.test(rawImage) ? rawImage : `${origin}${rawImage}`;
      const url = `${origin}${lang === 'en' ? '/en' : ''}/proyectos/${slug}`;

      let html = fs.readFileSync(indexPath, 'utf8');
      html = html.replace(/<title>[^<]*<\/title>/i, `<title>${esc(title)}</title>`);
      html = setMeta(html, 'name', 'description', description);
      html = setMeta(html, 'property', 'og:url', url);
      html = setMeta(html, 'property', 'og:title', title);
      html = setMeta(html, 'property', 'og:description', description);
      html = setMeta(html, 'property', 'og:image', image);
      html = setMeta(html, 'property', 'og:image:secure_url', image);
      html = setMeta(html, 'property', 'og:image:type', /\.png($|\?)/i.test(image) ? 'image/png' : 'image/jpeg');
      html = setMeta(html, 'property', 'og:image:alt', title);
      html = setMeta(html, 'property', 'og:locale', lang === 'en' ? 'en_US' : 'es_EC');
      html = setMeta(html, 'name', 'twitter:title', title);
      html = setMeta(html, 'name', 'twitter:description', description);
      html = setMeta(html, 'name', 'twitter:image', image);
      res.type('html').send(html);
    } catch (err) {
      console.error('GET /proyectos/:slug (tarjeta social)', err);
      res.sendFile(indexPath);
    }
  };
}

const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

/**
 * Tarjeta social de la ficha de un lote (/proyectos/:slug/lote/:code): título con
 * el código, el área y el precio, e imagen satelital con la forma del lote.
 */
const UNIT_ES: Record<string, string> = { lotes: 'Lote', casas: 'Casa', departamentos: 'Departamento', suites: 'Suite', locales: 'Local', oficinas: 'Oficina', bodegas: 'Bodega', terrenos: 'Terreno' };
const UNIT_EN: Record<string, string> = { lotes: 'Lot', casas: 'Home', departamentos: 'Condo', suites: 'Suite', locales: 'Retail unit', oficinas: 'Office', bodegas: 'Warehouse', terrenos: 'Land' };

/** «Financiamiento: 30 % de entrada y 24 cuotas sin intereses.» según el plan del proyecto. */
function planText(plan: unknown, en: boolean): string {
  const p = plan as { downPct?: number; installments?: number; interestFree?: boolean } | null;
  if (!p?.installments) return '';
  return en
    ? `Financing: ${p.downPct ?? 0}% down and ${p.installments} ${p.interestFree ? 'interest-free ' : ''}monthly payments.`
    : `Financiamiento: ${p.downPct ?? 0} % de entrada y ${p.installments} cuotas${p.interestFree ? ' sin intereses' : ''}.`;
}

export function lotOgHandler(frontendPath: string) {
  const indexPath = path.join(frontendPath, 'index.html');

  return async (req: Request, res: Response) => {
    try {
      const slug = String(req.params.slug ?? '');
      const code = String(req.params.code ?? '').toUpperCase();
      const project = await prisma.project.findUnique({ where: { slug }, select: { id: true, name: true, location: true, paymentPlan: true, coverImage: true } });
      const lot = project
        ? await prisma.lot.findFirst({
            where: { projectId: project.id, code: { equals: code, mode: 'insensitive' }, active: true },
            select: { code: true, unitType: true, builtM2: true, areaM2: true, price: true, status: true, name: true, cashOnly: true, geometry: true },
          })
        : null;
      if (!project || !lot) {
        res.sendFile(indexPath);
        return;
      }
      const en = req.path.startsWith('/en/');
      const origin = publicBaseUrl();
      const label = `${(en ? UNIT_EN : UNIT_ES)[lot.unitType] ?? (en ? 'Lot' : 'Lote')} ${lot.code}`;
      const parts = [label];
      const area = lot.builtM2 ?? lot.areaM2;
      if (area) parts.push(`${Math.round(area).toLocaleString('en-US')} m²`);
      if (lot.price && lot.status === 'AVAILABLE') parts.push(usd(lot.price));
      const title = `${parts.join(' · ')} — ${project.name}`;
      const status =
        lot.status === 'AVAILABLE'
          ? lot.cashOnly
            ? en
              ? 'Promotional cash price.'
              : 'Precio promocional de contado.'
            : planText(project.paymentPlan, en)
          : lot.status === 'SOLD'
            ? en ? 'Sold.' : 'Vendido.'
            : lot.status === 'RESERVED'
              ? en ? 'Reserved.' : 'Reservado.'
              : '';
      const place = project.location ? ` ${project.location}.` : '';
      const description = lot.geometry
        ? en
          ? `See its shape and location on the satellite map, dimensions, boundaries and price.${place} ${status}`
          : `Mira su forma y ubicación en el mapa satelital, medidas, linderos y precio.${place} ${status}`
        : en
          ? `Price, size and availability.${place} ${status}`
          : `Precio, medidas y disponibilidad.${place} ${status}`;
      const cover = project.coverImage ? (/^https?:\/\//i.test(project.coverImage) ? project.coverImage : `${origin}${project.coverImage}`) : `${origin}/images/og-cover.png`;
      const image = lot.geometry ? `${origin}/api/og/lot/${slug}/${encodeURIComponent(lot.code)}.jpg` : cover;
      const url = `${origin}${en ? '/en' : ''}/proyectos/${slug}/lote/${encodeURIComponent(lot.code)}`;

      let html = fs.readFileSync(indexPath, 'utf8');
      html = html.replace(/<title>[^<]*<\/title>/i, `<title>${esc(title)}</title>`);
      html = setMeta(html, 'name', 'description', description);
      html = setMeta(html, 'property', 'og:url', url);
      html = setMeta(html, 'property', 'og:title', title);
      html = setMeta(html, 'property', 'og:description', description);
      html = setMeta(html, 'property', 'og:image', image);
      html = setMeta(html, 'property', 'og:image:secure_url', image);
      html = setMeta(html, 'property', 'og:image:type', 'image/jpeg');
      html = setMeta(html, 'property', 'og:image:alt', title);
      html = setMeta(html, 'property', 'og:locale', en ? 'en_US' : 'es_EC');
      html = setMeta(html, 'name', 'twitter:title', title);
      html = setMeta(html, 'name', 'twitter:description', description);
      html = setMeta(html, 'name', 'twitter:image', image);
      res.type('html').send(html);
    } catch (err) {
      console.error('GET /proyectos/:slug/lote/:code (tarjeta social)', err);
      res.sendFile(indexPath);
    }
  };
}

// ------------------------------------------------------------------
// Vista previa de las demás páginas públicas (portada, club, referidos, bosque…).
// Cada una tiene su tarjeta 1200×630 con la estética del hero (frontend/public/images/og).
// ------------------------------------------------------------------

interface PageMeta {
  title: string;
  description: string;
  image: string;
}

const PAGE_OG: Record<string, { es: PageMeta; en: PageMeta }> = {
  '/': {
    es: {
      title: 'Grupo 3i — Invierte en la costa ecuatoriana',
      description: 'Fracciones en Ibiza Condohotel desde $12,000 y lotes con vista al mar en Montañita View desde $41,721, con financiamiento sin intereses.',
      image: '/images/og/og-home.jpg',
    },
    en: {
      title: 'Grupo 3i — Real estate on Ecuador’s coast',
      description: 'Ibiza Condohotel shares from $12,000 and ocean-view lots at Montañita View from $41,721, with interest-free financing.',
      image: '/images/og/og-home.jpg',
    },
  },
  '/proyectos': {
    es: {
      title: 'Proyectos de Grupo 3i',
      description: 'Ibiza Condohotel (fracciones desde $12,000) y Montañita View (lotes con vista al mar desde $41,721) en Santa Elena, Ecuador.',
      image: '/images/og/og-proyectos.jpg',
    },
    en: {
      title: 'Grupo 3i projects',
      description: 'Ibiza Condohotel (shares from $12,000) and Montañita View (ocean-view lots from $41,721) in Santa Elena, Ecuador.',
      image: '/images/og/og-proyectos.jpg',
    },
  },
  '/propuesta/montanita-view': {
    es: {
      title: 'Montañita View — propuesta de inversión',
      description: 'La lotización completa, el Lobby completo o ambos proyectos en una sola operación, en Manglaralto, Santa Elena.',
      image: '/images/og/og-propuesta-montanita.jpg',
    },
    en: {
      title: 'Montañita View — private investment offering',
      description: 'Buy the entire subdivision, the entire Lobby, or both in one deal — in Manglaralto, Santa Elena, Ecuador.',
      image: '/images/og/og-propuesta-montanita.jpg',
    },
  },
  '/club': {
    es: {
      title: 'Club 3i — viajes, beneficios y comunidad',
      description: 'Membresía de viajes con hasta 70% de descuento en hoteles, beneficios para socios y una comunidad de inversionistas.',
      image: '/images/og/og-club.jpg',
    },
    en: {
      title: 'Club 3i — travel, perks and community',
      description: 'A travel membership with up to 70% off hotels, members-only perks and a community of investors.',
      image: '/images/og/og-club.jpg',
    },
  },
  '/club/viajes': {
    es: {
      title: 'Club de Viajes 3i — hasta 70% de descuento',
      description: 'Descuentos en hoteles y experiencias en todo el mundo, y un certificado vacacional cada año en más de 120 destinos.',
      image: '/images/og/og-viajes-club.jpg',
    },
    en: {
      title: 'Club 3i Travel — save up to 70%',
      description: 'Discounts on hotels and experiences worldwide, plus a vacation certificate every year in 120+ destinations.',
      image: '/images/og/og-viajes-club.jpg',
    },
  },
  '/oficina': {
    es: {
      title: 'Refiere y gana con Grupo 3i',
      description: 'Recomienda un lote en Montañita View o una fracción en Ibiza Condohotel y gana hasta el 4% de la venta. Registro gratis.',
      image: '/images/og/og-refiere.jpg',
    },
    en: {
      title: 'Refer & Earn with Grupo 3i',
      description: 'Refer a buyer for a Montañita View lot or an Ibiza Condohotel share and earn up to 4% of the sale. Free to join.',
      image: '/images/og/og-refiere.jpg',
    },
  },
  '/publica-tu-proyecto': {
    es: {
      title: 'Publica tu proyecto inmobiliario en Grupo 3i',
      description: 'Lotes, terrenos, casas, departamentos, suites, locales y oficinas: inventario en vivo, recorridos 360°, sello de verificación y una red de referidores. Ganamos cuando tú vendes.',
      image: '/images/og/montanita-view-mapa.jpg?v=20261012',
    },
    en: {
      title: 'List your real estate project on Grupo 3i',
      description: 'Lots, land, homes, condos, suites, retail and office space: live inventory, 360° tours, a verification seal and a referral network. We get paid when you sell.',
      image: '/images/og/montanita-view-mapa.jpg?v=20261012',
    },
  },
  '/publica-tu-proyecto/propuesta': {
    es: {
      title: 'Propuesta comercial para desarrolladoras · Grupo 3i',
      description: 'Ganamos cuando tú vendes: mapa interactivo de lotes, recorridos 360°, CRM con tus asesores, verificación legal y red de referidores.',
      image: '/images/og/montanita-view-mapa.jpg?v=20261012',
    },
    en: {
      title: 'Partner proposal for developers · Grupo 3i',
      description: 'We get paid when you sell: an interactive lot map, 360° tours, a CRM for your agents, legal vetting and a referral network.',
      image: '/images/og/montanita-view-mapa.jpg?v=20261012',
    },
  },
  '/publica-tu-proyecto/galeria': {
    es: {
      title: 'Galería del sistema para desarrolladoras · Grupo 3i',
      description: 'Capturas reales del portal: proyecto, mapa de lotes, 360°, CRM, asesores, métricas, ventas y mapa para tu web.',
      image: '/images/propuesta-dev/crm.jpg',
    },
    en: {
      title: 'Developer portal screenshot gallery · Grupo 3i',
      description: 'Real screenshots of the portal: listings, lot map, 360° tours, CRM, agents, analytics, sales and a map for your website.',
      image: '/images/propuesta-dev/crm.jpg',
    },
  },
  '/publica-tu-proyecto/manual': {
    es: {
      title: 'Manual de herramientas para desarrolladoras · Grupo 3i',
      description: 'Proyectos, mapa de lotes, 360°, CRM, asesores, avisos, métricas, ventas y mapa para tu web, paso a paso.',
      image: '/images/og/montanita-view-mapa.jpg?v=20261012',
    },
    en: {
      title: 'Developer platform guide · Grupo 3i',
      description: 'Listings, lot map, 360° tours, CRM, agents, notifications, analytics, sales and your website map — step by step.',
      image: '/images/og/montanita-view-mapa.jpg?v=20261012',
    },
  },
  '/sobre-nosotros': {
    es: {
      title: 'Sobre Grupo 3i',
      description: 'Grupo inmobiliario en la costa ecuatoriana: propiedad fraccionada, lotes con vista al mar y membresías de viaje.',
      image: '/images/og/og-home.jpg',
    },
    en: {
      title: 'About Grupo 3i',
      description: 'A real estate group on Ecuador’s coast: fractional ownership, ocean-view lots and travel memberships.',
      image: '/images/og/og-home.jpg',
    },
  },
  '/contacto': {
    es: {
      title: 'Contacto · Grupo 3i',
      description: 'Escríbenos por WhatsApp o déjanos tus datos y un asesor te contacta en menos de 24 horas.',
      image: '/images/og/og-home.jpg',
    },
    en: {
      title: 'Contact · Grupo 3i',
      description: 'Message us on WhatsApp or leave your details and an agent will reach out within 24 hours.',
      image: '/images/og/og-home.jpg',
    },
  },
  '/reglamento': {
    es: {
      title: 'Reglamento de Refiere y gana · Grupo 3i',
      description: 'Reglas oficiales del programa: comisiones, niveles, ascensos, incentivos, liquidación y retiros.',
      image: '/images/og/og-refiere.jpg',
    },
    en: {
      title: 'Refer & Earn program terms · Grupo 3i',
      description: 'Official program rules: commissions, tiers, upgrades, rewards, payouts and withdrawals.',
      image: '/images/og/og-refiere.jpg',
    },
  },
  '/servicios': {
    es: { title: 'Servicios integrales · Grupo 3i', description: 'Topografía, levantamientos georreferenciados, planos, fraccionamientos, trámites notariales y municipales, marketing, audiovisual y desarrollo de proyectos en la costa de Ecuador.', image: '/images/og/og-home.jpg' },
    en: { title: 'Full-service support · Grupo 3i', description: 'Surveying, geo-referenced mapping, site plans, subdivisions, notary and municipal paperwork, marketing, video and project development on Ecuador’s coast.', image: '/images/og/og-home.jpg' },
  },
  '/privacidad': {
    es: { title: 'Política de privacidad · Grupo 3i', description: 'Qué datos recoge Grupo 3i, para qué los usa, con quién los comparte y cómo ejercer tus derechos.', image: '/images/og/og-home.jpg' },
    en: { title: 'Privacy policy · Grupo 3i', description: 'What data Grupo 3i collects, how we use it, who we share it with and how to exercise your rights.', image: '/images/og/og-home.jpg' },
  },
  '/terminos': {
    es: { title: 'Términos y condiciones · Grupo 3i', description: 'Condiciones de uso de grupo3i.com: información de proyectos y precios, compras, Club 3i y desarrolladoras aliadas.', image: '/images/og/og-home.jpg' },
    en: { title: 'Terms of use · Grupo 3i', description: 'Terms of use for grupo3i.com: project and pricing information, purchases, Club 3i and partner developers.', image: '/images/og/og-home.jpg' },
  },
  '/fiesta': {
    es: {
      title: 'Comparte y Grupo 3i te invita un trago 🍹',
      description: 'Fiesta en el Lobby de Montañita View: comparte en tu estado o historia y recibe tu bebida.',
      image: '/images/og/og-camp-montanita.jpg',
    },
    en: {
      title: 'Share and Grupo 3i buys you a drink 🍹',
      description: 'Party at the Montañita View Lobby: share on your status or story and get your drink.',
      image: '/images/og/og-camp-montanita.jpg',
    },
  },
  '/bosque': {
    es: {
      title: 'Bosque Montañita — adopta un árbol',
      description:
        'Adopta un árbol con tu nombre en un bosque de conservación en Manglaralto. Certificado con QR, ubicación GPS y 3 años de cuidado.',
      image: '/images/og/og-bosque.jpg',
    },
    en: {
      title: 'Bosque Montañita — adopt a tree',
      description: 'Adopt a tree in your name in a conservation forest in Manglaralto.',
      image: '/images/og/og-bosque.jpg',
    },
  },
};

// Rutas que comparten la tarjeta de otra.
const PAGE_ALIAS: Record<string, string> = {
  '/oficina/registro': '/oficina',
  '/oficina/login': '/oficina',
  '/tienda/membresia-viajes-club-3i': '/club/viajes',
};

function renderMeta(indexPath: string, m: PageMeta, url: string, en: boolean, origin: string): string {
  const image = /^https?:\/\//i.test(m.image) ? m.image : `${origin}${m.image}`;
  let html = fs.readFileSync(indexPath, 'utf8');
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${esc(m.title)}</title>`);
  html = setMeta(html, 'name', 'description', m.description);
  html = setMeta(html, 'property', 'og:url', url);
  html = setMeta(html, 'property', 'og:title', m.title);
  html = setMeta(html, 'property', 'og:description', m.description);
  html = setMeta(html, 'property', 'og:image', image);
  html = setMeta(html, 'property', 'og:image:secure_url', image);
  html = setMeta(html, 'property', 'og:image:type', /\.png($|\?)/i.test(image) ? 'image/png' : 'image/jpeg');
  html = setMeta(html, 'property', 'og:image:alt', m.title);
  html = setMeta(html, 'property', 'og:locale', en ? 'en_US' : 'es_EC');
  html = setMeta(html, 'name', 'twitter:title', m.title);
  html = setMeta(html, 'name', 'twitter:description', m.description);
  html = setMeta(html, 'name', 'twitter:image', image);
  return html;
}

/** Rutas públicas con tarjeta propia (se montan antes del comodín del SPA). */
export const PAGE_OG_PATHS: string[] = [...Object.keys(PAGE_OG), ...Object.keys(PAGE_ALIAS)]
  .flatMap((p) => [p, p === '/' ? '/en' : `/en${p}`])
  .concat(['/bosque/*']);

export function pageOgHandler(frontendPath: string) {
  const indexPath = path.join(frontendPath, 'index.html');
  return (req: Request, res: Response) => {
    try {
      const en = req.path === '/en' || req.path.startsWith('/en/');
      const bare = (en ? req.path.slice(3) : req.path) || '/';
      const key = bare.startsWith('/bosque') ? '/bosque' : (PAGE_ALIAS[bare] ?? bare);
      const entry = PAGE_OG[key];
      if (!entry) {
        res.sendFile(indexPath);
        return;
      }
      const origin = publicBaseUrl();
      res.type('html').send(renderMeta(indexPath, en ? entry.en : entry.es, `${origin}${req.path}`, en, origin));
    } catch (err) {
      console.error('GET (tarjeta social de página)', err);
      res.sendFile(indexPath);
    }
  };
}

/**
 * Tarjeta social de la página de aterrizaje (/l/:slug): pensada para anuncios y
 * difusión. Título y descripción con datos vivos del inventario; imagen propia
 * (images/og/l/<slug>-<lang>.jpg, generada con precios y CTA) o la portada.
 */
export function landingOgHandler(frontendPath: string) {
  const indexPath = path.join(frontendPath, 'index.html');

  return async (req: Request, res: Response) => {
    try {
      const slug = String(req.params.slug ?? '');
      const project = await prisma.project.findUnique({
        where: { slug },
        select: { id: true, name: true, location: true, priceFrom: true, priceLabel: true, coverImage: true, paymentPlan: true },
      });
      if (!project) {
        res.sendFile(indexPath);
        return;
      }
      const lang = req.path.startsWith('/en/') ? 'en' : 'es';
      const lots = await prisma.lot.findMany({
        where: { projectId: project.id, active: true, kind: 'LOT', status: 'AVAILABLE' },
        select: { price: true },
      });
      const prices = lots.map((l) => l.price).filter((p): p is number => p != null);
      const min = prices.length ? Math.min(...prices) : project.priceFrom;
      const place = project.location?.split(',')[0] ?? '';
      const inst = (project.paymentPlan as { installments?: number } | null)?.installments ?? null;

      let title: string;
      let description: string;
      if (lang === 'en') {
        title = lots.length && min != null ? `${project.name} · Lots from ${usd(min)}${inst ? `, ${inst} monthly payments` : ''}` : min != null ? `${project.name} · From ${usd(min)}` : project.name;
        description = lots.length
          ? `${lots.length} lots available in ${place}, Ecuador. Leave your WhatsApp and we’ll send you pricing, the site plan and payment options.`
          : `Leave your WhatsApp and we’ll send you pricing and payment options for ${project.name} in ${place}, Ecuador.`;
      } else {
        title = lots.length && min != null ? `${project.name} · Lotes desde ${usd(min)}${inst ? ` en ${inst} cuotas` : ''}` : `${project.name} · ${project.priceLabel ?? 'Recibe precios'}`;
        description = lots.length
          ? `${lots.length} lotes disponibles en ${place}. Déjanos tu WhatsApp y te enviamos precios, el plano de lotes y las formas de pago.`
          : `Déjanos tu WhatsApp y te enviamos precios y formas de pago de ${project.name} en ${place}.`;
      }

      const origin = publicBaseUrl();
      const file = path.join(frontendPath, 'images', 'og', 'l', `${slug}-${lang}.jpg`);
      const image = fs.existsSync(file)
        ? `${origin}/images/og/l/${slug}-${lang}.jpg?v=${Math.round(fs.statSync(file).mtimeMs / 1000)}`
        : /^https?:\/\//i.test(project.coverImage ?? '')
          ? project.coverImage!
          : `${origin}${project.coverImage ?? '/images/og-cover.png'}`;
      const url = `${origin}${lang === 'en' ? '/en' : ''}/l/${slug}`;

      let html = fs.readFileSync(indexPath, 'utf8');
      html = html.replace(/<title>[^<]*<\/title>/i, `<title>${esc(title)}</title>`);
      html = setMeta(html, 'name', 'description', description);
      html = setMeta(html, 'property', 'og:url', url);
      html = setMeta(html, 'property', 'og:title', title);
      html = setMeta(html, 'property', 'og:description', description);
      html = setMeta(html, 'property', 'og:image', image);
      html = setMeta(html, 'property', 'og:image:secure_url', image);
      html = setMeta(html, 'property', 'og:image:type', 'image/jpeg');
      html = setMeta(html, 'property', 'og:image:alt', title);
      html = setMeta(html, 'property', 'og:locale', lang === 'en' ? 'en_US' : 'es_EC');
      html = setMeta(html, 'name', 'twitter:title', title);
      html = setMeta(html, 'name', 'twitter:description', description);
      html = setMeta(html, 'name', 'twitter:image', image);
      res.type('html').send(html);
    } catch (err) {
      console.error('GET /l/:slug (tarjeta social)', err);
      res.sendFile(indexPath);
    }
  };
}

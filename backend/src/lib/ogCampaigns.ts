import { prisma } from '../prisma';

// ============================================================
// Campañas de tarjeta social para los enlaces de referido.
//
// WhatsApp/Facebook/X no ejecutan JavaScript: la tarjeta que ven al pegar un
// enlace sale de los <meta property="og:*"> del HTML que responde el servidor.
// Como el sitio usa HashRouter (grupo3i.com/#/ruta) y el fragmento "#" NUNCA
// llega al servidor, NINGUNA ruta del SPA puede tener tarjeta propia.
//
// /r/:code sí es una ruta real de Express, así que es el único punto del
// sistema donde esto es posible — y justo es el enlace que comparten los
// socios. Cada campaña (?c=slug) define su propia tarjeta y su propio mensaje.
//
// El formato es 1080x1080 (cuadrado), no 1.91:1: WhatsApp respeta el alto
// declarado en og:image:width/height y le da una tarjeta mucho más grande y
// visible en el chat. El texto va en la franja central de la imagen porque
// Facebook/LinkedIn/X sí recortan el cuadrado a apaisado tomando el centro.
// ============================================================

export const OG_SECTION = 'referral_og';

export interface OgCampaign {
  /** Nombre visible en el admin y en Herramientas. */
  label: string;
  /** og:title. Admite {nombre} → primer nombre del socio que refiere. */
  title: string;
  /** og:description. */
  description: string;
  /** Ruta local (/images/...) o URL de Cloudinary. */
  image: string;
  /** Plantilla de WhatsApp que acompaña al enlace. */
  message: string;
  /** Ruta del SPA a la que aterriza el humano. */
  to: string;
}

/**
 * Campañas por defecto. Se usan mientras el superadmin no las edite desde
 * Configuración > Contenido > Tarjetas de referido (sección `referral_og`).
 *
 * Las 4 primeras usan imágenes hechas para tarjeta (texto en la franja
 * central). Las 3 últimas reutilizan los banners cuadrados de materiales
 * promocionales con mensajes alternativos, para que un socio pueda variar el
 * mensaje sin repetir siempre la misma imagen en los chats de sus contactos.
 */
export const DEFAULT_CAMPAIGNS: Record<string, OgCampaign> = {
  inversion: {
    label: 'Inversión desde $12,000',
    title: '{nombre} te invita a invertir desde $12,000',
    description:
      'Propiedad fraccionada en la costa ecuatoriana. Conoce los proyectos de Grupo 3i.',
    image: '/images/og/og-inversion.jpg',
    message:
      '¿Sabías que puedes invertir en propiedades desde $12,000? No pierdas tu oportunidad, te cuento cómo con Grupo 3i:',
    to: '/proyectos',
  },
  viajes: {
    label: 'Club de Viajes — 70% menos',
    title: '{nombre} te invita al Club de Viajes 3i',
    description:
      'Viaja con hasta 70% de descuento en hoteles y experiencias en todo el mundo.',
    image: '/images/og/og-viajes.jpg',
    message:
      '¡Hola! Te invito al Club 3i 🌍 Viaja con hasta 70% de descuento en hoteles. Regístrate con mi enlace:',
    to: '/club/viajes',
  },
  referidos: {
    label: 'Gana comisiones refiriendo',
    title: '{nombre} te invita a ganar comisiones refiriendo',
    description:
      'Refiere y gana por cada membresía y propiedad. Sin costo de ingreso.',
    image: '/images/og/og-referidos.jpg',
    message:
      'Estoy ganando ingresos refiriendo al Club 3i, y no cuesta nada entrar. Únete a mi equipo aquí:',
    to: '/oficina/registro',
  },
  comunidad: {
    label: 'Comunidad 3i',
    title: '{nombre} te invita a la comunidad 3i',
    description:
      'Más que una inversión: una comunidad de socios, viajes y oportunidades.',
    image: '/images/og/og-comunidad.jpg',
    message:
      'Grupo 3i es más que una inversión, es una comunidad. Te dejo mi enlace para que la conozcas:',
    to: '/comunidad',
  },
  // — Mensajes alternativos sobre los banners promocionales ya existentes —
  propiedad: {
    label: 'Propiedad frente al mar (banner)',
    title: '{nombre} te muestra estos proyectos frente al mar',
    description:
      'Departamentos frente al mar en la costa ecuatoriana, con opción de compra fraccionada.',
    image: '/images/banners/banner-inversion.jpg',
    message:
      'Mira estos proyectos frente al mar en Ecuador. Se puede entrar por fracciones, no necesitas comprar todo el departamento:',
    to: '/proyectos',
  },
  escapadas: {
    label: 'Escapadas premium (banner)',
    title: '{nombre} te invita a viajar con el Club 3i',
    description:
      'Hoteles y experiencias premium a precio de miembro, en todo el mundo.',
    image: '/images/banners/banner-viajes.jpg',
    message:
      '🎁 Compra tu propiedad o fracción con Grupo 3i por mi enlace y te llevas GRATIS la membresía del Club de Viajes:',
    to: '/club',
  },
  red: {
    label: 'Construye tu red (banner)',
    title: '{nombre} te invita a generar ingresos extra',
    description:
      'Comisiones por cada referido, sin costo de ingreso y sin límite de crecimiento.',
    image: '/images/banners/banner-comunidad.jpg',
    message:
      'Estoy construyendo mi red con Grupo 3i y me está yendo bien. Si te interesa generar ingresos extra, entra por aquí:',
    to: '/oficina/registro',
  },
};

/**
 * Lee las campañas efectivas: las de la BD pisan a las de por defecto, campo a
 * campo (si el admin solo cambió la imagen, el resto se conserva). Una campaña
 * nueva creada desde el admin también aparece aquí.
 */
export async function loadCampaigns(): Promise<Record<string, OgCampaign>> {
  const merged: Record<string, OgCampaign> = { ...DEFAULT_CAMPAIGNS };
  let rows: { key: string; value: string }[] = [];
  try {
    rows = await prisma.siteContent.findMany({
      where: { section: OG_SECTION },
      select: { key: true, value: true },
    });
  } catch {
    return merged; // BD caída: la tarjeta por defecto es mejor que ninguna.
  }

  for (const row of rows) {
    let parsed: Partial<OgCampaign>;
    try {
      parsed = JSON.parse(row.value);
    } catch {
      continue; // Valor corrupto: se ignora y queda el default.
    }
    if (!parsed || typeof parsed !== 'object') continue;
    merged[row.key] = { ...(merged[row.key] ?? EMPTY_CAMPAIGN), ...parsed };
  }
  return merged;
}

const EMPTY_CAMPAIGN: OgCampaign = {
  label: '',
  title: 'Grupo 3i — Inversión Inmobiliaria Inteligente',
  description:
    'Propiedades fraccionadas, membresías de viaje y experiencias premium en la costa ecuatoriana.',
  image: '/images/og-cover.png',
  message: '',
  to: '/oficina/registro',
};

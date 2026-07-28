import {
  MapPin,
  Building2,
  DollarSign,
  TrendingUp,
  Home,
  Users,
  ShieldCheck,
  Wallet,
  Landmark,
  Waves,
  Gift,
  Sparkle,
  Sun,
  Anchor,
  Star,
  Heart,
  type LucideIcon,
} from 'lucide-react';

// ============================================================
// Contenido del Brochure Digital — editable desde Admin > Proyectos
// (campo JSON "brochureContent"). Todo opcional: lo que falte se
// completa con DEFAULT_BROCHURE_CONTENT.
// ============================================================

/** Claves de ícono disponibles para keyFacts / pillars / whyInvest. */
export const ICON_MAP: Record<string, LucideIcon> = {
  mappin: MapPin,
  building: Building2,
  dollar: DollarSign,
  trending: TrendingUp,
  home: Home,
  users: Users,
  shield: ShieldCheck,
  wallet: Wallet,
  landmark: Landmark,
  waves: Waves,
  gift: Gift,
  sparkle: Sparkle,
  sun: Sun,
  anchor: Anchor,
  star: Star,
  heart: Heart,
};

export const ICON_KEYS = Object.keys(ICON_MAP);

export function resolveIcon(key?: string): LucideIcon {
  return (key && ICON_MAP[key]) || Sparkle;
}

export interface BrochureIconEntry {
  icon: string;
  label: string;
  value: string;
}

export interface BrochurePillar {
  icon: string;
  title: string;
  body: string;
}

export interface BrochureKV {
  label: string;
  value: string;
}

export interface BrochureStat {
  v: string;
  l: string;
}

export interface BrochureBigStat {
  big: string;
  small: string;
}

export interface BrochureProjection {
  year: string;
  label: string;
  value: number;
  note: string;
}

export interface BrochureTestimonial {
  name: string;
  role: string;
  text: string;
}

/** Id de cada bloque reordenable/ocultable del brochure (el hero siempre va primero, fijo). */
export type BrochureSectionId =
  | 'pillars'
  | 'keyFacts'
  | 'gallery'
  | 'overview'
  | 'location'
  | 'investment'
  | 'amenities'
  | 'whyInvest'
  | 'banner'
  | 'testimonials'
  | 'cta';

export const SECTION_DEFS: { id: BrochureSectionId; label: string }[] = [
  { id: 'pillars', label: 'Pilares de valor' },
  { id: 'keyFacts', label: 'Datos clave' },
  { id: 'gallery', label: 'Galería / recorrido visual' },
  { id: 'overview', label: 'Vista general' },
  { id: 'location', label: 'Ubicación (mapa)' },
  { id: 'investment', label: 'Plan de inversión' },
  { id: 'amenities', label: 'Amenidades' },
  { id: 'whyInvest', label: '¿Por qué invertir?' },
  { id: 'banner', label: 'Banner emotivo' },
  { id: 'testimonials', label: 'Testimonios' },
  { id: 'cta', label: 'Cierre (CTA final)' },
];

const DEFAULT_ORDER: BrochureSectionId[] = SECTION_DEFS.map((s) => s.id);

export interface BrochureLayout {
  order?: BrochureSectionId[];
  hidden?: BrochureSectionId[];
}

export interface BrochureContent {
  eyebrow?: string;
  heroTagline?: string;
  heroLocation?: string;
  keyFacts?: BrochureIconEntry[];
  pillars?: BrochurePillar[];
  overviewText?: string;
  overviewStats?: BrochureBigStat[];
  paymentPlan?: BrochureKV[];
  valueProjection?: BrochureProjection[];
  chart?: number[];
  routeStats?: BrochureStat[];
  rentingStats?: BrochureStat[];
  amenities?: string[];
  whyInvest?: BrochurePillar[];
  insurances?: BrochureKV[];
  testimonials?: BrochureTestimonial[];
  bannerEyebrow?: string;
  bannerTitle?: string;
  bannerBody?: string;
  ctaSubtitle?: string;
  ctaStats?: BrochureStat[];
  pdfUrl?: string;
  contactLine?: string;
  /** Orden y visibilidad de secciones (Nivel 1 del editor de página). */
  layout?: BrochureLayout;
}

/** Orden final de secciones a renderizar: respeta el guardado, agrega al final
 * cualquier sección nueva que no estuviera contemplada (forward-compat). */
export function resolveSectionOrder(layout?: BrochureLayout): BrochureSectionId[] {
  const saved = layout?.order?.filter((id) => DEFAULT_ORDER.includes(id)) ?? [];
  const missing = DEFAULT_ORDER.filter((id) => !saved.includes(id));
  return [...saved, ...missing];
}

export function isSectionHidden(id: BrochureSectionId, layout?: BrochureLayout): boolean {
  return !!layout?.hidden?.includes(id);
}

/** Contenido por defecto (datos reales de Ibiza Condohotel) — se usa como respaldo campo por campo. */
export const DEFAULT_BROCHURE_CONTENT: Required<BrochureContent> = {
  eyebrow: 'Primera oportunidad de inversión',
  heroTagline: 'Disfruta tu playa, gana con la plusvalía y hereda tu patrimonio',
  heroLocation: 'Propiedad Fraccionada de Lujo · Manglaralto, Santa Elena, Ecuador',
  keyFacts: [
    { icon: 'mappin', label: 'Ubicación', value: 'Manglaralto, Santa Elena' },
    { icon: 'building', label: 'Tipo', value: 'Condohotel de Lujo' },
    { icon: 'dollar', label: 'Inversión desde', value: 'USD $12,000 / fracción' },
    { icon: 'trending', label: 'Rentabilidad bruta', value: '16.3% anual' },
    { icon: 'home', label: 'Unidades', value: '17 lofts · 4 niveles' },
    { icon: 'users', label: 'Capacidad', value: '6 personas · 71.66 m²' },
  ],
  pillars: [
    {
      icon: 'waves',
      title: 'Tu playa, todo el año',
      body: 'Una semana de uso vacacional garantizada de por vida frente al mar, en un condohotel de lujo pensado para disfrutar en familia.',
    },
    {
      icon: 'trending',
      title: 'Plusvalía real',
      body: 'Hasta +65% de valorización proyectada en 5 años, en una de las zonas costeras de mayor crecimiento turístico del Ecuador.',
    },
    {
      icon: 'gift',
      title: 'Patrimonio heredable',
      body: 'Una fracción a tu nombre, con acciones preferentes transferibles: un legado real que puedes dejar a tus hijos.',
    },
  ],
  overviewText:
    'Ibiza Condohotel nace como el primer desarrollo de propiedad fraccionada de lujo en la costa ecuatoriana. Adquieres una fracción de un inmueble valorado en más de $200,000 por una fracción de su costo, con derecho a uso vacacional perpetuo, transferible a tu familia, más ingresos por un programa de renting administrado.',
  overviewStats: [
    { big: '430,000', small: 'visitantes en el último feriado' },
    { big: '93.84%', small: 'ocupación hotelera en Santa Elena' },
    { big: '+12.85%', small: 'crecimiento del turismo' },
  ],
  paymentPlan: [
    { label: 'Pago inicial (separación)', value: 'USD $500' },
    { label: '23 cuotas mensuales', value: 'USD $500 c/u' },
    { label: 'Interés', value: '0% — financiamiento directo' },
    { label: 'Total pagado', value: 'USD $12,000' },
    { label: 'Cuota de mantenimiento', value: 'USD $300 / año (2026)' },
    { label: 'Representación', value: '25 acciones preferentes' },
  ],
  valueProjection: [
    { year: 'Año 0', label: 'Inversión inicial', value: 12000, note: 'Precio de preventa' },
    { year: 'Año 3', label: 'Recompra garantizada', value: 14400, note: '+20% garantizado' },
    { year: 'Año 5', label: 'Estimado conservador', value: 18500, note: '+40% a +65% plusvalía' },
  ],
  chart: [12000, 13200, 13800, 14400, 16000, 18500],
  routeStats: [
    { v: '2h 30m', l: 'desde Guayaquil' },
    { v: '45 min', l: 'desde Salinas' },
    { v: '~80 m', l: 'a la playa' },
    { v: '1h', l: 'a Montañita' },
  ],
  rentingStats: [
    { v: '70% / 30%', l: 'Reparto fraccionario / administración' },
    { v: '$500 – $850', l: 'Renta por semana según temporada' },
    { v: '~$1,960', l: 'Ingreso anual potencial' },
  ],
  amenities: [
    'Piscinas',
    'Gimnasio',
    'Club de Playa',
    'Spa',
    'Lobby VIP',
    'Seguridad 24h',
    'Estacionamiento + cargador EV',
    'Áreas sociales',
  ],
  whyInvest: [
    {
      icon: 'shield',
      title: 'Recompra garantizada 120%',
      body: 'Garantía de capital + ganancia: recompra a $14,400 (meses 36-42). Sin riesgo de pérdida de capital.',
    },
    {
      icon: 'trending',
      title: 'Plusvalía proyectada +65%',
      body: 'Valor estimado a 5 años entre $17K y $20K por fracción. Proyectos frente al mar superan el 3.6% del mercado.',
    },
    {
      icon: 'wallet',
      title: 'Ingresos pasivos administrados',
      body: 'Programa de renting 70/30 con gestión profesional. Ingreso anual potencial ~$1,960 (16.3% bruto).',
    },
    {
      icon: 'landmark',
      title: 'Respaldo patrimonial sólido',
      body: 'DIWILDI S.A., garante solidario, con $17M en activos, 108 terrenos y 16 años de experiencia.',
    },
  ],
  insurances: [
    { label: 'Construcción Todo Riesgo', value: '$8M' },
    { label: 'Garantía de Entrega', value: '$6M' },
    { label: 'Responsabilidad Civil', value: '$5M' },
  ],
  testimonials: [
    {
      name: 'Roberto M.',
      role: 'Inversionista, Guayaquil',
      text: 'Buscaba una inversión segura frente al mar. La garantía de recompra del 120% me dio la confianza para entrar en la preventa.',
    },
    {
      name: 'Carolina V.',
      role: 'Fraccionaria',
      text: 'Tener mi semana de vacaciones cada año y además generar renta es lo mejor de ambos mundos. El proceso fue transparente.',
    },
    {
      name: 'Andrés P.',
      role: 'Inversionista',
      text: 'El financiamiento directo a 0% interés hizo que entrar fuera muy accesible. Un patrimonio para heredar a mis hijos.',
    },
  ],
  bannerEyebrow: 'Más que una inversión',
  bannerTitle: 'Disfruta hoy. Hereda mañana.',
  bannerBody:
    'Tu fracción es un lugar real donde tu familia vive experiencias frente al mar, y un activo real que crece de valor y se transmite de generación en generación.',
  ctaSubtitle: 'Disfruta hoy, hereda mañana, gana siempre.',
  ctaStats: [
    { v: '$12,000', l: 'Inversión inicial' },
    { v: '+65%', l: 'Plusvalía potencial' },
    { v: '120%', l: 'Garantía de recompra' },
  ],
  pdfUrl: '/brochures/ibiza-condohotel.pdf',
  contactLine: 'condohotelibizasa@gmail.com · Gerencia: 0969369398 · www.grupo3i.com',
  layout: {},
};

/** Combina el contenido del proyecto con los valores por defecto, campo a campo. */
export function resolveBrochureContent(
  raw?: Record<string, unknown> | null,
): Required<BrochureContent> {
  const c = (raw ?? {}) as BrochureContent;
  return {
    eyebrow: c.eyebrow ?? DEFAULT_BROCHURE_CONTENT.eyebrow,
    heroTagline: c.heroTagline ?? DEFAULT_BROCHURE_CONTENT.heroTagline,
    heroLocation: c.heroLocation ?? DEFAULT_BROCHURE_CONTENT.heroLocation,
    keyFacts: c.keyFacts?.length ? c.keyFacts : DEFAULT_BROCHURE_CONTENT.keyFacts,
    pillars: c.pillars?.length ? c.pillars : DEFAULT_BROCHURE_CONTENT.pillars,
    overviewText: c.overviewText ?? DEFAULT_BROCHURE_CONTENT.overviewText,
    overviewStats: c.overviewStats?.length ? c.overviewStats : DEFAULT_BROCHURE_CONTENT.overviewStats,
    paymentPlan: c.paymentPlan?.length ? c.paymentPlan : DEFAULT_BROCHURE_CONTENT.paymentPlan,
    valueProjection: c.valueProjection?.length ? c.valueProjection : DEFAULT_BROCHURE_CONTENT.valueProjection,
    chart: c.chart?.length ? c.chart : DEFAULT_BROCHURE_CONTENT.chart,
    routeStats: c.routeStats?.length ? c.routeStats : DEFAULT_BROCHURE_CONTENT.routeStats,
    rentingStats: c.rentingStats?.length ? c.rentingStats : DEFAULT_BROCHURE_CONTENT.rentingStats,
    amenities: c.amenities?.length ? c.amenities : DEFAULT_BROCHURE_CONTENT.amenities,
    whyInvest: c.whyInvest?.length ? c.whyInvest : DEFAULT_BROCHURE_CONTENT.whyInvest,
    insurances: c.insurances?.length ? c.insurances : DEFAULT_BROCHURE_CONTENT.insurances,
    testimonials: c.testimonials?.length ? c.testimonials : DEFAULT_BROCHURE_CONTENT.testimonials,
    bannerEyebrow: c.bannerEyebrow ?? DEFAULT_BROCHURE_CONTENT.bannerEyebrow,
    bannerTitle: c.bannerTitle ?? DEFAULT_BROCHURE_CONTENT.bannerTitle,
    bannerBody: c.bannerBody ?? DEFAULT_BROCHURE_CONTENT.bannerBody,
    ctaSubtitle: c.ctaSubtitle ?? DEFAULT_BROCHURE_CONTENT.ctaSubtitle,
    ctaStats: c.ctaStats?.length ? c.ctaStats : DEFAULT_BROCHURE_CONTENT.ctaStats,
    pdfUrl: c.pdfUrl ?? DEFAULT_BROCHURE_CONTENT.pdfUrl,
    contactLine: c.contactLine ?? DEFAULT_BROCHURE_CONTENT.contactLine,
    layout: c.layout ?? DEFAULT_BROCHURE_CONTENT.layout,
  };
}

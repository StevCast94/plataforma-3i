import { APT_ASSUMPTIONS, DISCOUNT, type AptAssumptions } from './mvStudy';

// ============================================================
// Contenido editable de la propuesta Montañita View (F4).
//
// Se guarda como JSON en SiteContent (section = PROPUESTA_SECTION,
// key = PROPUESTA_KEY) y se edita desde /admin/propuesta. Lo que no esté
// guardado toma el valor por defecto de aquí, campo a campo, así que la
// página nunca queda vacía aunque el admin guarde solo una parte.
// ============================================================

export const PROPUESTA_SECTION = 'propuesta_mv';
export const PROPUESTA_KEY = 'content';

export type Row = [string, string];

export interface RouteText {
  /** Etiqueta dorada de la tarjeta (precio). */
  tag: string;
  /** Texto corto de la tarjeta de "Elige cómo participar". */
  card: string;
  /** Resumen persuasivo al inicio de la ruta. */
  summary: string;
  /** Filas de datos clave de la ruta. */
  rows: Row[];
}

export interface DestinationItem {
  text: string;
  source: string;
  url: string;
}

export interface PropuestaContent {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  solar: RouteText;
  lobby: RouteText;
  total: RouteText & { paymentRows: Row[]; paymentNote: string };
  destination: DestinationItem[];
  disclaimer: string;
  /** WhatsApp propio de la propuesta, solo dígitos. Vacío = el número oficial del sitio (contact.whatsapp). */
  whatsapp: string;
  study: { discount: number; scenarios: AptAssumptions };
}

// Superficies y precios de la compra total: los 89 solares en venta de
// Montañita View Lotes a $55/m² y el predio de Montañita View Lobby a $100/m².
// El equipamiento urbano y las áreas verdes no se valoran: son cargas de la
// lotización, no superficie vendible.
const LOTS_M2 = 122303.98;
const LOBBY_M2 = 36348;
const TOTAL_M2 = LOTS_M2 + LOBBY_M2;
const LOTS_PRICE_M2 = 55;
const LOBBY_PRICE_M2 = 100;
const TOTAL_USD = LOTS_M2 * LOTS_PRICE_M2 + LOBBY_M2 * LOBBY_PRICE_M2;
const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
const m2 = (n: number) => `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })} m²`;

export const DEFAULT_PROPUESTA: PropuestaContent = {
  heroEyebrow: 'Propuesta exclusiva · Documento privado',
  heroTitle: 'Montañita View',
  heroSubtitle:
    'Dos proyectos hermanos en Manglaralto, Santa Elena: una lotización de 25.8 hectáreas con título saneado y un complejo con lobby ya construido y 81 apartamentos proyectados. Tres maneras de ser parte.',
  solar: {
    tag: 'Desde $49,084',
    card: 'Tu terreno propio, con título individual y financiamiento directo: 30% de entrada y 24 cuotas sin intereses.',
    summary:
      'Un solar propio en Manglaralto, a minutos de la playa y de Montañita, con la cadena de dominio completa e inscrita. Eliges el tuyo en el mapa y lo pagas en 24 cuotas sin intereses.',
    rows: [
      ['Solares disponibles', '89 de 111'],
      ['Precio', '$100 / m²'],
      ['Desde', '$49,084 — solar A9, 490.84 m²'],
      ['Plan de pago', '30% de entrada + saldo en hasta 24 cuotas al 0%'],
      ['Título', 'Individual, inscrito en el Registro de la Propiedad de Santa Elena'],
    ],
  },
  lobby: {
    tag: usd(LOBBY_M2 * LOBBY_PRICE_M2),
    card: '36,348 m² con lobby, piscinas y eco-hotel ya operando, y un proyecto listo de 81 apartamentos en tres etapas.',
    summary:
      'Un predio con el área social ya construida y operando — lobby, dos piscinas, jacuzzi, restaurante, bar y eco-hotel — y un proyecto listo de 81 apartamentos de 151 m² en tres etapas, con vista de 270° al océano y al bosque. Buscamos socios o un desarrollador para ejecutarlo; el Lobby existente es la amenidad que diferencia cada apartamento.',
    rows: [
      ['Superficie', `${m2(LOBBY_M2)} (29,090 m² útiles + 7,258 m² de vías y áreas verdes)`],
      ['Valor del predio', `${usd(LOBBY_M2 * LOBBY_PRICE_M2)} ($${LOBBY_PRICE_M2} / m²)`],
      ['Propiedad', 'Didier Triana — proyecto hermano de la Lotización, con convenio entre ambos'],
      ['Modalidad', 'Sociedad para el desarrollo del proyecto o compra del predio'],
    ],
  },
  total: {
    tag: usd(TOTAL_USD),
    card: `Ambos proyectos completos: ${Math.round(TOTAL_M2).toLocaleString('en-US')} m² en una sola operación, con condiciones preferentes de pago.`,
    summary: `La Lotización y el predio del Lobby en una sola operación: ${Math.round(TOTAL_M2).toLocaleString('en-US')} m² en la Ruta del Spondylus, con estudios, linderación y obra civil ya ejecutados.`,
    rows: [
      ['Precio', usd(TOTAL_USD)],
      ['Cómo se calcula', `Montañita View Lotes ${m2(LOTS_M2)} a $${LOTS_PRICE_M2}/m² (${usd(LOTS_M2 * LOTS_PRICE_M2)}) + Montañita View Lobby ${m2(LOBBY_M2)} a $${LOBBY_PRICE_M2}/m² (${usd(LOBBY_M2 * LOBBY_PRICE_M2)})`],
      ['Superficie', m2(TOTAL_M2)],
      ['Qué incluye', `Los 89 solares en venta de Montañita View Lotes (${m2(LOTS_M2)}) y el predio de Montañita View Lobby (${m2(LOBBY_M2)})`],
    ],
    paymentRows: [
      ['Reserva (10%) al firmar la promesa', usd(TOTAL_USD * 0.1)],
      ['Saldo', 'A convenir entre las partes'],
    ],
    paymentNote: 'La forma y los plazos del saldo se acuerdan en la negociación y quedan en la promesa de compraventa.',
  },
  destination: [
    {
      text: '80% de ocupación hotelera en Montañita en el feriado de mayo de 2026, según la Cámara de Turismo de Santa Elena',
      source: 'El Universo',
      url: 'https://www.eluniverso.com/noticias/ecuador/intenso-sol-acompana-a-banistas-en-segundo-dia-de-feriado-en-santa-elena-50-de-ocupacion-en-salinas-y-80-en-montanita-nota/',
    },
    {
      text: '80% de ocupación hotelera provincial en el feriado de octubre de 2025',
      source: 'Primicias',
      url: 'https://www.primicias.ec/sociedad/provincia-santa-elena-feriado-octubre-ocupacion-hotelera-paro-conaie-107098/',
    },
    {
      text: 'Llegadas internacionales a Ecuador +17% en el primer semestre de 2025 frente a 2024, tras una caída de 11.5% en 2024',
      source: 'El Diario',
      url: 'https://www.eldiario.ec/ecuador/por-que-ecuador-no-atrae-mas-turistas-las-cifras-de-2025-que-explican-el-rezago-regional-04112025/',
    },
  ],
  disclaimer:
    'Documento informativo. Los indicadores financieros provienen del estudio de factibilidad 2026, con los supuestos y fuentes indicados, y no constituyen garantía de rentabilidad. Los documentos fuente están disponibles para revisión en la reunión con un asesor.',
  whatsapp: '',
  study: { discount: DISCOUNT, scenarios: APT_ASSUMPTIONS },
};

const isRows = (v: unknown): v is Row[] =>
  Array.isArray(v) && v.every((r) => Array.isArray(r) && r.length === 2 && r.every((x) => typeof x === 'string'));

function mergeRoute<T extends RouteText>(def: T, raw: unknown): T {
  const r = (raw ?? {}) as Partial<T>;
  return {
    ...def,
    ...Object.fromEntries(Object.entries(r).filter(([k, v]) => (k.endsWith('Rows') || k === 'rows' ? isRows(v) : typeof v === 'string'))),
  } as T;
}

/** Combina lo guardado con los valores por defecto, campo a campo. */
export function resolvePropuesta(raw?: unknown): PropuestaContent {
  const c = (raw && typeof raw === 'object' ? raw : {}) as Partial<PropuestaContent>;
  const str = (v: unknown, d: string) => (typeof v === 'string' && v.trim() ? v : d);
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : d);
  const sc = (c.study?.scenarios ?? {}) as Partial<AptAssumptions>;
  const scenarios = Object.fromEntries(
    (Object.keys(APT_ASSUMPTIONS) as (keyof AptAssumptions)[]).map((k) => [
      k,
      {
        price: num(sc[k]?.price, APT_ASSUMPTIONS[k].price),
        cost: num(sc[k]?.cost, APT_ASSUMPTIONS[k].cost),
        unitsPerQuarter: num(sc[k]?.unitsPerQuarter, APT_ASSUMPTIONS[k].unitsPerQuarter),
      },
    ]),
  ) as AptAssumptions;
  return {
    heroEyebrow: str(c.heroEyebrow, DEFAULT_PROPUESTA.heroEyebrow),
    heroTitle: str(c.heroTitle, DEFAULT_PROPUESTA.heroTitle),
    heroSubtitle: str(c.heroSubtitle, DEFAULT_PROPUESTA.heroSubtitle),
    solar: mergeRoute(DEFAULT_PROPUESTA.solar, c.solar),
    lobby: mergeRoute(DEFAULT_PROPUESTA.lobby, c.lobby),
    total: mergeRoute(DEFAULT_PROPUESTA.total, c.total),
    destination: Array.isArray(c.destination)
      ? c.destination.filter((d) => d && typeof d.text === 'string' && d.text.trim())
      : DEFAULT_PROPUESTA.destination,
    disclaimer: str(c.disclaimer, DEFAULT_PROPUESTA.disclaimer),
    whatsapp: str(c.whatsapp, DEFAULT_PROPUESTA.whatsapp).replace(/\D/g, ''),
    study: { discount: num(c.study?.discount, DEFAULT_PROPUESTA.study.discount), scenarios },
  };
}

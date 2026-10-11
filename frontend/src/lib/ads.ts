// Medición para publicidad: Google (GA4 + Ads), Meta y TikTok.
// - Los identificadores se cargan de Admin → Configuración → tracking (sin rebuild).
// - Los píxeles solo se cargan si el visitante acepta las cookies de medición.
// - El origen de campaña (utm_*, gclid, fbclid, ttclid) se guarda 30 días y se
//   adjunta a cada contacto, para ver en el CRM qué anuncio trajo qué cliente.

type W = Window & {
  dataLayer?: unknown[];
  gtag?: (...a: unknown[]) => void;
  fbq?: ((...a: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
  _fbq?: unknown;
  ttq?: Record<string, unknown> & { track?: (...a: unknown[]) => void; page?: () => void; load?: (id: string) => void };
  TiktokAnalyticsObject?: string;
};
const w = window as W;

export interface TrackingIds {
  ga4_id?: string;
  google_ads_id?: string;
  google_ads_lead_label?: string;
  meta_pixel_id?: string;
  tiktok_pixel_id?: string;
}

const CONSENT_KEY = 'g3i_consent';
const ATTR_KEY = 'g3i_attr';
const ATTR_DAYS = 30;

export type Consent = 'all' | 'necessary' | null;
export function getConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'all' || v === 'necessary' ? v : null;
  } catch {
    return null;
  }
}
export function setConsent(v: 'all' | 'necessary') {
  try {
    localStorage.setItem(CONSENT_KEY, v);
  } catch {
    /* sin almacenamiento */
  }
}

// ---------------------------------------------------------------- campañas
export function captureAttribution() {
  try {
    const q = new URLSearchParams(location.search);
    const pick = (k: string) => q.get(k)?.slice(0, 150) || undefined;
    const a = {
      source: pick('utm_source'), medium: pick('utm_medium'), campaign: pick('utm_campaign'),
      term: pick('utm_term'), content: pick('utm_content'),
      gclid: pick('gclid'), fbclid: pick('fbclid'), ttclid: pick('ttclid'),
    };
    if (!Object.values(a).some(Boolean)) return;
    localStorage.setItem(ATTR_KEY, JSON.stringify({ ...a, landing: location.pathname.slice(0, 300), ts: Date.now() }));
  } catch {
    /* sin almacenamiento */
  }
}

/** Origen de campaña vigente (últimos 30 días) para adjuntar a un contacto. */
export function attribution(): Record<string, string> | undefined {
  try {
    const raw = localStorage.getItem(ATTR_KEY);
    if (!raw) return undefined;
    const { ts, ...a } = JSON.parse(raw) as Record<string, string> & { ts: number };
    if (Date.now() - ts > ATTR_DAYS * 86400_000) return undefined;
    return a;
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------- píxeles
let ids: TrackingIds = {};
let loaded = false;

function script(src: string) {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

export function hasAnyId(t: TrackingIds) {
  return Boolean(t.ga4_id || t.google_ads_id || t.meta_pixel_id || t.tiktok_pixel_id);
}

/** Carga los píxeles configurados. Solo con consentimiento «all». */
export function loadPixels(t: TrackingIds) {
  ids = t;
  if (loaded || getConsent() !== 'all' || !hasAnyId(t)) return;
  loaded = true;

  const gtagId = t.ga4_id || t.google_ads_id;
  if (gtagId) {
    w.dataLayer = w.dataLayer || [];
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
    w.gtag('js', new Date());
    // La SPA manda sus propias vistas de página (pageView).
    if (t.ga4_id) w.gtag('config', t.ga4_id, { send_page_view: false });
    if (t.google_ads_id) w.gtag('config', t.google_ads_id);
    script(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gtagId)}`);
  }

  if (t.meta_pixel_id && !w.fbq) {
    const f = function (...a: unknown[]) {
      // Cola estándar del píxel de Meta hasta que carga fbevents.js.
      (f as unknown as { callMethod?: (...x: unknown[]) => void; queue: unknown[] }).callMethod
        ? (f as unknown as { callMethod: (...x: unknown[]) => void }).callMethod(...a)
        : (f as unknown as { queue: unknown[] }).queue.push(a);
    } as W['fbq'] & { queue: unknown[] };
    f!.queue = [];
    f!.loaded = true;
    f!.version = '2.0';
    f!.push = f;
    w.fbq = f;
    w._fbq = f;
    script('https://connect.facebook.net/en_US/fbevents.js');
    w.fbq!('init', t.meta_pixel_id);
  }

  if (t.tiktok_pixel_id && !w.ttq) {
    const q: unknown[] = [];
    const methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
    const ttq: Record<string, unknown> = { _q: q };
    for (const m of methods) ttq[m] = (...a: unknown[]) => q.push([m, ...a]);
    w.TiktokAnalyticsObject = 'ttq';
    w.ttq = ttq as W['ttq'];
    script(`https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${encodeURIComponent(t.tiktok_pixel_id)}&lib=ttq`);
  }
}

/** Vista de página (la SPA cambia de ruta sin recargar). */
export function pageView(path: string) {
  if (!loaded) return;
  if (ids.ga4_id) w.gtag?.('event', 'page_view', { page_path: path, page_location: location.href, page_title: document.title });
  w.fbq?.('track', 'PageView');
  w.ttq?.page?.();
}

export type AdEvent = 'view_project' | 'view_lot' | 'pano_open' | 'wa_click' | 'lead';

/** Eventos de la plataforma traducidos a cada red. `lead` es la conversión principal. */
export function adEvent(ev: AdEvent, p: { project?: string; lot?: string; value?: number } = {}) {
  if (!loaded) return;
  const item = [p.project, p.lot].filter(Boolean).join(' · ');
  switch (ev) {
    case 'view_project':
    case 'view_lot':
      w.gtag?.('event', 'view_item', { items: [{ item_id: item, item_name: item }] });
      w.fbq?.('track', 'ViewContent', { content_name: item, content_type: 'product' });
      w.ttq?.track?.('ViewContent', { content_id: item, content_type: 'product' });
      break;
    case 'pano_open':
      w.gtag?.('event', 'pano_open', { item_name: item });
      w.fbq?.('trackCustom', 'Pano360', { content_name: item });
      break;
    case 'wa_click':
      w.gtag?.('event', 'contact_click', { method: 'whatsapp', item_name: item });
      w.fbq?.('track', 'Contact', { content_name: item });
      w.ttq?.track?.('Contact', { content_id: item });
      break;
    case 'lead':
      w.gtag?.('event', 'generate_lead', { item_name: item, currency: 'USD', value: p.value ?? 0 });
      if (ids.google_ads_id && ids.google_ads_lead_label) {
        w.gtag?.('event', 'conversion', { send_to: `${ids.google_ads_id}/${ids.google_ads_lead_label}` });
      }
      w.fbq?.('track', 'Lead', { content_name: item });
      w.ttq?.track?.('SubmitForm', { content_id: item });
      break;
  }
}

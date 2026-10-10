import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, FileDown, Map as MapIcon, Navigation } from 'lucide-react';
import type { PublicLot } from '@shared/types';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Link, useLang } from '@/hooks/useLang';
import { useProject } from '@/hooks/useProjects';
import { useReferral } from '@/hooks/useReferral';
import { Seo } from '@/components/shared/Seo';
import { WhatsAppCTA } from '@/components/shared/WhatsAppCTA';
import { ShareLot } from '@/components/shared/ShareLot';
import {
  DOWN_PAYMENT,
  INSTALLMENTS,
  LotPhotos,
  LotSheet,
  Row,
  STATUS_STYLE,
  fmtArea,
  monthly,
  CashOnlyNote,
} from '@/components/shared/LotMap';
import { BrandLoader } from '@/components/brand/Isotipo';

/**
 * Ficha completa de un solar, pensada para abrirse desde un enlace compartido
 * en el celular: forma y ubicación en el mapa, precio, medidas y contacto.
 */
export default function LotPage() {
  const { slug = '', code = '' } = useParams();
  const { t } = useLang();
  useReferral(); // guarda el ?ref= del socio que compartió el enlace

  // Al imprimir se abren los desplegables (coordenadas de los vértices) y luego
  // se devuelven a como estaban.
  useEffect(() => {
    let closed: HTMLDetailsElement[] = [];
    const before = () => {
      closed = [...document.querySelectorAll<HTMLDetailsElement>('.lot-print details:not([open])')];
      closed.forEach((d) => (d.open = true));
    };
    const after = () => closed.forEach((d) => (d.open = false));
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, []);
  const { data: project } = useProject(slug);
  const [lots, setLots] = useState<PublicLot[] | null>(null);

  useEffect(() => {
    api.get<PublicLot[]>(`/projects/${slug}/lots`).then(setLots).catch(() => setLots([]));
  }, [slug]);

  const lot = useMemo(() => lots?.find((l) => l.code.toUpperCase() === code.toUpperCase()) ?? null, [lots, code]);

  if (!lots) return <BrandLoader className="min-h-[60vh]" />;
  if (!lot)
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="font-serif text-3xl font-bold text-primary">{t('No encontramos ese solar')}</p>
        <Link to={`/proyectos/${slug}`} className="mt-6 inline-block font-semibold text-accent underline">
          {t('Ver todos los solares')}
        </Link>
      </div>
    );

  const projectName = project?.name ?? 'Montañita View';
  const status = STATUS_STYLE[lot.status];
  const precio = lot.price != null ? `, ${formatCurrency(lot.price)}` : '';
  const waMsg = t('Hola, me interesa el *solar {code}* de {p} ({area}{precio}). Quiero más información.', {
    code: lot.code,
    p: projectName,
    area: fmtArea(lot.areaM2),
    precio,
  });
  const dest = lot.centroidLat != null && lot.centroidLng != null ? `${lot.centroidLat},${lot.centroidLng}` : null;

  return (
    <div className="lot-print bg-light print:bg-white">
      <Seo
        title={`${t('Solar')} ${lot.code} · ${projectName}`}
        description={`${fmtArea(lot.areaM2)}${precio}. ${t('Forma, ubicación, medidas y linderos del solar.')}`}
      />
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6 print:max-w-none print:p-0">
        <Link
          to={`/proyectos/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-gray hover:text-primary print:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          {projectName}
        </Link>

        <p className="hidden border-b border-black/10 pb-2 text-xs font-semibold uppercase tracking-widest text-accent print:block">
          Grupo 3i · grupo3i.com
        </p>
        <header className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-brand-gray">
              {projectName}
              {lot.block ? ` · ${lot.block.replace('MZ-', `${t('Manzana')} `)}` : ''}
            </p>
            <h1 className="font-serif text-4xl font-bold text-primary sm:text-5xl">
              {t('Solar')} {lot.code}
            </h1>
            {lot.name && <p className="mt-1 text-sm text-accent">{t('Uso proyectado')}: {t(lot.name)}</p>}
          </div>
          <span className="rounded-full px-3 py-1 text-sm font-semibold text-white" style={{ background: status.fill }}>
            {t(status.label)}
          </span>
        </header>

        <LotMiniMap lots={lots} lot={lot} />
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm print:hidden">
          <Link to={`/proyectos/${slug}?lote=${encodeURIComponent(lot.code)}`} className="inline-flex items-center gap-1.5 font-medium text-accent underline-offset-4 hover:underline">
            <MapIcon className="h-4 w-4" />
            {t('Ver en el mapa del proyecto')}
          </Link>
          {dest && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${dest}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-accent underline-offset-4 hover:underline"
            >
              <Navigation className="h-4 w-4" />
              {t('Cómo llegar al solar')}
            </a>
          )}
        </div>

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm sm:p-6 print:mt-3 print:rounded-none print:p-0 print:shadow-none">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat label={t('Área')} value={fmtArea(lot.areaM2)} />
            {lot.price != null && <Stat label={lot.cashOnly ? t('Precio de contado') : t('Precio')} value={formatCurrency(lot.price)} strong />}
            {lot.price != null && !lot.cashOnly && (
              <Stat label={t('{n} cuotas sin interés de', { n: INSTALLMENTS })} value={formatCurrency(monthly(lot.price))} />
            )}
          </div>
          {lot.price != null && (
            <dl className="mt-4 space-y-2 border-t border-black/5 pt-4 text-sm">
              {lot.pricePerM2 != null && <Row label={t('Precio por m²')} value={formatCurrency(lot.pricePerM2)} />}
              {lot.cashOnly ? <CashOnlyNote /> : <Row label={t('Entrada (30%)')} value={formatCurrency(lot.price * DOWN_PAYMENT)} />}
            </dl>
          )}

          <div className="mt-5 space-y-2 print:hidden">
            <WhatsAppCTA message={waMsg} className="w-full" />
            <ShareLot lot={lot} projectName={projectName} projectSlug={slug} showFullSheet={false} />
            <button
              type="button"
              onClick={() => window.print()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm font-semibold text-primary hover:bg-light"
            >
              <FileDown className="h-4 w-4" />
              {t('Descargar ficha en PDF')}
            </button>
          </div>
        </section>

        {(lot.images?.length ?? 0) > 0 && (
          <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm sm:p-6 print:hidden">
            <LotPhotos images={lot.images ?? []} code={lot.code} />
          </section>
        )}

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm sm:p-6 print:mt-3 print:rounded-none print:p-0 print:shadow-none">
          <LotSheet lot={lot} />
        </section>

        <p className="mt-8 hidden text-center text-xs text-brand-gray print:block">
          {window.location.origin}
          {`/proyectos/${slug}/solar/${lot.code}`}
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-brand-gray">{label}</p>
      <p className={`mt-0.5 font-serif font-bold tabular-nums ${strong ? 'text-2xl text-accent' : 'text-xl text-primary'}`}>{value}</p>
    </div>
  );
}

/** Mapa de la ficha: el solar resaltado entre sus vecinos. Quieto en pantallas táctiles. */
function LotMiniMap({ lots, lot }: { lots: PublicLot[]; lot: PublicLot }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!el.current) return;
    const touch = window.matchMedia('(pointer: coarse)').matches;
    const map = L.map(el.current, {
      scrollWheelZoom: false,
      dragging: !touch,
      touchZoom: !touch,
      doubleClickZoom: !touch,
      attributionControl: true,
      zoomControl: !touch,
    });
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 21,
      maxNativeZoom: 18,
      attribution: '© Esri',
    }).addTo(map);
    const ring = (l: PublicLot) => l.geometry.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number]);
    for (const n of lots) {
      if (n.id === lot.id || n.approximateGeometry || n.kind !== 'LOT') continue;
      L.polygon(ring(n), { color: '#ffffff', weight: 1, opacity: 0.7, fill: false, interactive: false }).addTo(map);
    }
    const main = L.polygon(ring(lot), { color: '#ffffff', weight: 3, fillColor: '#ffc428', fillOpacity: 0.5 }).addTo(map);
    map.fitBounds(main.getBounds(), { padding: [70, 70], maxZoom: 20 });
    return () => {
      map.remove();
    };
  }, [lots, lot]);

  return <div ref={el} className="isolate mt-5 h-[300px] w-full overflow-hidden rounded-2xl ring-1 ring-black/10 sm:h-[380px] print:mt-3 print:h-[210px]" />;
}

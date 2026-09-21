import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Maximize2, Minimize2, Navigation, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/shared/Toast';
import { WhatsAppCTA } from '@/components/shared/WhatsAppCTA';
import { PhoneField } from '@/components/shared/PhoneField';
import { useLang } from '@/hooks/useLang';
import { useVisualViewport } from '@/hooks/useVisualViewport';
import type { PublicLot, LotStatus } from '@shared/types';
import ZONAS from '@/data/montanita-zonas.json';

// ============================================================
// Mapa interactivo de solares. Geometría real de GEO 3i (reproyectada a
// lat/lng en el import), sobre imagen satelital de Esri (sin API key).
// Al tocar un solar: área, precio, cuota con el plan 30% + 24 cuotas al 0%
// y un formulario "Me interesa" que entra como lead (con la atribución del
// socio que refirió, vía la cookie de referido que ya lee /api/contact).
// ============================================================

const STATUS_STYLE: Record<LotStatus, { fill: string; label: string }> = {
  AVAILABLE: { fill: '#16a34a', label: 'Disponible' },
  RESERVED: { fill: '#f59e0b', label: 'Reservado' },
  SOLD: { fill: '#dc2626', label: 'Vendido' },
  NOT_FOR_SALE: { fill: '#9ca3af', label: 'No disponible' },
};

// Urbanismo aprobado (Resolución 0118052017-GADMSE-A), dibujado en GEO 3i.
const ZONE_STYLE = {
  verde: { color: '#16a34a', label: 'Área verde' },
  equipamiento: { color: '#2563eb', label: 'Equipamiento urbano' },
  via: { color: '#facc15', label: 'Vías' },
};

const DOWN_PAYMENT = 0.3;
const INSTALLMENTS = 24;

type SizeFilter = '' | 'lt800' | '800to1500' | 'gt1500';


/** Desde este zoom cabe el rótulo dentro del solar. */
const LOT_LABEL_ZOOM = 18;

/**
 * Rotula el solar: acercado, solo su código dentro del polígono — el uso y la
 * disponibilidad llenaban el mapa de texto y ya se ven al pasar el cursor.
 */
function labelLot(poly: L.Polygon & { lotData?: PublicLot }, lot: PublicLot, zoomed: boolean) {
  poly.lotData = lot;
  if (!zoomed) {
    poly.unbindTooltip().bindTooltip(`${lot.code} · ${lot.name || STATUS_STYLE[lot.status].label}`, { sticky: true });
    return;
  }
  poly
    .unbindTooltip()
    .bindTooltip(lot.code, { permanent: true, direction: 'center', className: 'lot-label', opacity: 1 })
    .openTooltip();
}

/**
 * Dibuja bajo los solares el urbanismo de Montañita View: áreas verdes,
 * equipamiento y el eje de cada calle, tal como constan en el plano de
 * implantación aprobado y en el levantamiento de GEO 3i.
 */
function drawUrbanism(map: L.Map) {
  const base = L.layerGroup().addTo(map);
  const uid = Math.random().toString(36).slice(2, 8); // ids únicos si hay dos mapas en la página
  const zonas = [
    ...ZONAS.verdes.map((z) => ({ ...z, style: ZONE_STYLE.verde })),
    ...ZONAS.equipamiento.map((z) => ({ ...z, style: ZONE_STYLE.equipamiento })),
  ];
  for (const z of zonas) {
    // Relleno tenue y borde punteado: las zonas se leen sin competir con los
    // solares (el verde "disponible" es el mismo verde del área verde).
    L.polygon(z.path as [number, number][], {
      color: z.style.color,
      weight: 2,
      dashArray: '5 5',
      fillColor: z.style.color,
      fillOpacity: 0.18,
    })
      .bindTooltip(`${z.nombre} · ${fmtArea(z.areaM2)}`, { sticky: true })
      .addTo(base);
  }
  const vias = ZONAS.vias.map((v) => {
    // De oeste a este, para que el rótulo nunca salga cabeza abajo.
    const path = v.path[0][1] > v.path[v.path.length - 1][1] ? [...v.path].reverse() : v.path;
    const line = L.polyline(path as [number, number][], {
      color: ZONE_STYLE.via.color,
      weight: 3,
      opacity: 0.75,
      dashArray: '6 6',
    })
      .bindTooltip(v.nombre, { sticky: true })
      .addTo(base);
    return { nombre: v.nombre, line, label: null as SVGTextElement | null };
  });

  // Rótulo sobre el trazado de la calle, como en Google Maps: un <textPath> que
  // referencia el mismo <path> del eje, así sigue sus curvas y se reacomoda
  // solo en cada zoom. Solo puede crearse cuando Leaflet ya dibujó la vía, que
  // es después de fijar la vista (fitBounds), no al añadir la capa.
  const NS = 'http://www.w3.org/2000/svg';
  const ensureLabels = () => {
    vias.forEach((v, i) => {
      if (v.label) return;
      const el = v.line.getElement() as SVGPathElement | null;
      if (!el?.parentNode) return;
      const id = `via-${uid}-${i}`;
      el.setAttribute('id', id);
      const text = document.createElementNS(NS, 'text');
      text.setAttribute('class', 'via-label');
      text.setAttribute('dy', '-5');
      const tp = document.createElementNS(NS, 'textPath');
      tp.setAttribute('href', `#${id}`);
      tp.setAttribute('startOffset', '50%');
      tp.setAttribute('text-anchor', 'middle');
      tp.textContent = v.nombre;
      text.appendChild(tp);
      el.parentNode.appendChild(text);
      v.label = text;
    });
  };
  // En la vista general los rótulos estorban: aparecen al acercarse.
  const toggleLabels = () => {
    ensureLabels();
    const show = map.getZoom() >= 18;
    vias.forEach((v) => v.label?.setAttribute('visibility', show ? 'visible' : 'hidden'));
  };
  map.on('zoomend moveend', toggleLabels);
  map.whenReady(toggleLabels);
}

export function LotMap({
  projectSlug,
  projectName,
  mapLat,
  mapLng,
}: {
  projectSlug: string;
  projectName: string;
  /** Punto de llegada del proyecto, para el botón "Cómo llegar". */
  mapLat?: number | null;
  mapLng?: number | null;
}) {
  const { t } = useLang();
  const [lots, setLots] = useState<PublicLot[] | null>(null);
  const [selected, setSelected] = useState<PublicLot | null>(null);
  const [block, setBlock] = useState('');
  const [size, setSize] = useState<SizeFilter>('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const mapEl = useRef<HTMLDivElement>(null);
  const wrapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const [full, setFull] = useState(false);
  // En el teléfono el panel de búsqueda tapaba un tercio del mapa: entra plegado
  // y deja solo la leyenda; en pantallas grandes sobra espacio y entra abierto.
  const [panel, setPanel] = useState(true);

  /**
   * Pantalla completa. Se usa la API nativa cuando existe (el mapa ocupa toda la
   * pantalla del equipo, con el gesto de salida del sistema) y, cuando no —Safari
   * de iPhone no la admite en un div—, se recurre a fijar el contenedor sobre la
   * página, que da el mismo resultado visual.
   */
  const toggleFull = () => {
    const el = wrapEl.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => setFull(false));
      return;
    }
    if (full) {
      setFull(false);
      return;
    }
    setPanel(window.innerWidth >= 640);
    if (el.requestFullscreen) {
      el.requestFullscreen()
        .then(() => setFull(true))
        .catch(() => setFull(true)); // bloqueada por el navegador: se usa el modo fijo
    } else {
      setFull(true);
    }
  };

  // El mapa debe recalcular su tamaño al entrar y al salir; Esc cierra el modo fijo.
  useEffect(() => {
    const sync = () => {
      if (!document.fullscreenElement && document.fullscreenEnabled) setFull(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) setFull(false);
    };
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // La rueda del ratón solo hace zoom en pantalla completa: dentro de la página
    // secuestraría el desplazamiento de quien solo pasaba por encima.
    if (full) map.scrollWheelZoom.enable();
    else map.scrollWheelZoom.disable();
    // Al cambiar de tamaño hay un instante en que el contenedor mide 0 y la capa
    // de imagen satelital se queda sin teselas (fondo negro/blanco). Se refresca
    // dos veces: al terminar la transición y una más por si aún no había medida.
    const refresh = () => {
      map.invalidateSize();
      const c = map.getCenter();
      const z = map.getZoom();
      tileRef.current?.redraw();
      map.setView(c, z, { animate: false });
    };
    const t1 = setTimeout(refresh, 150);
    const t2 = setTimeout(refresh, 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [full]);

  useEffect(() => {
    api.get<PublicLot[]>(`/projects/${projectSlug}/lots`).then(setLots).catch(() => setLots([]));
  }, [projectSlug]);

  // ?lote=A9 abre directamente la ficha de ese solar y centra el mapa en él:
  // así el enlace "Ver ficha" del panel de administración lleva a su ficha pública.
  const wanted = new URLSearchParams(window.location.search).get('lote');
  useEffect(() => {
    if (!wanted || !lots?.length) return;
    const lot = lots.find((l) => l.code.toUpperCase() === wanted.toUpperCase());
    if (!lot) return;
    setSelected(lot);
    // Se centra después del encuadre inicial, que se dispara al dibujar los polígonos.
    const t = setTimeout(() => {
      const map = mapRef.current;
      if (map && lot.centroidLat != null && lot.centroidLng != null) {
        map.setView([lot.centroidLat, lot.centroidLng], 19);
        mapEl.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [wanted, lots]);

  const visible = useMemo(() => {
    return [...(lots ?? [])].sort(byCode).filter((l) => {
      if (l.kind !== 'LOT') return false;
      if (block && l.block !== block) return false;
      if (onlyAvailable && l.status !== 'AVAILABLE') return false;
      const a = l.areaM2 ?? 0;
      if (size === 'lt800' && a >= 800) return false;
      if (size === '800to1500' && (a < 800 || a > 1500)) return false;
      if (size === 'gt1500' && a <= 1500) return false;
      return true;
    });
  }, [lots, block, size, onlyAvailable]);

  const blocks = useMemo(
    () => [...new Set((lots ?? []).map((l) => l.block).filter(Boolean))].sort() as string[],
    [lots],
  );
  const available = (lots ?? []).filter((l) => l.status === 'AVAILABLE' && l.kind === 'LOT');

  // Crear el mapa una sola vez.
  useEffect(() => {
    if (!mapEl.current || mapRef.current || !lots?.length) return;
    const map = L.map(mapEl.current, { scrollWheelZoom: false, attributionControl: true });
    tileRef.current = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      // Esri solo tiene imagen hasta z18 en Manglaralto: más allá devuelve el
      // mosaico gris "Map data not yet available". Con maxNativeZoom 18 Leaflet
      // amplía la última imagen real y el mapa sigue acercándose hasta z21.
      { maxZoom: 21, maxNativeZoom: 18, attribution: 'Imágenes © Esri' },
    ).addTo(map);
    if (projectSlug === 'montanita-view') drawUrbanism(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lots, projectSlug]);

  // Redibujar polígonos al cambiar filtros.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    const bounds = L.latLngBounds([]);
    for (const lot of visible) {
      if (lot.approximateGeometry) continue; // placeholder sin levantamiento: solo en la tabla
      const ring = lot.geometry.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number]);
      const style = STATUS_STYLE[lot.status];
      const poly = L.polygon(ring, {
        color: '#ffffff',
        weight: 1,
        fillColor: style.fill,
        fillOpacity: 0.55,
      });
      poly.on('click', () => setSelected(lot));
      poly.addTo(layer);
      labelLot(poly, lot, map.getZoom() >= LOT_LABEL_ZOOM);
      ring.forEach((c) => bounds.extend(c));
    }
    // Acercado, el código y el uso van rotulados dentro de cada solar; en la
    // vista general estorban y basta el globo al pasar el cursor.
    const onZoom = () => {
      const zoomed = map.getZoom() >= LOT_LABEL_ZOOM;
      layer.eachLayer((l) => {
        const poly = l as L.Polygon & { lotData?: PublicLot };
        if (poly.lotData) labelLot(poly, poly.lotData, zoomed);
      });
    };
    map.on('zoomend', onZoom);
    // invalidateSize: si el contenedor aún no tiene tamaño, fitBounds se iría al
    // zoom máximo. maxZoom 18 mantiene la vista general aunque quede un solo solar.
    map.invalidateSize();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20], maxZoom: 18 });
    return () => {
      map.off('zoomend', onZoom);
    };
  }, [visible]);

  if (lots === null) return <p className="py-10 text-center text-brand-gray">{t('Cargando mapa de solares…')}</p>;
  if (lots.length === 0) return null;

  const minPrice = Math.min(...available.map((l) => l.price ?? Infinity));

  // Destino del botón "Cómo llegar": el que fije el proyecto o, si no, el centro
  // de los solares ya dibujados — siempre cae dentro de la lotización.
  const center = lots.filter((l) => l.centroidLat != null && l.centroidLng != null);
  const destination =
    mapLat != null && mapLng != null
      ? `${mapLat},${mapLng}`
      : center.length
        ? `${(center.reduce((s, l) => s + (l.centroidLat ?? 0), 0) / center.length).toFixed(6)},${(
            center.reduce((s, l) => s + (l.centroidLng ?? 0), 0) / center.length
          ).toFixed(6)}`
        : null;

  // Leyenda de colores: se muestra siempre, también con los filtros plegados.
  const legend = (
    <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-brand-gray">
      {(Object.keys(STATUS_STYLE) as LotStatus[]).map((s) => (
        <span key={s} className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: STATUS_STYLE[s].fill }} />
          {t(STATUS_STYLE[s].label)}
        </span>
      ))}
      {projectSlug === 'montanita-view' &&
        Object.values(ZONE_STYLE).map((z) => (
          <span key={z.label} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm opacity-60" style={{ background: z.color }} />
            {t(z.label)}
          </span>
        ))}
    </div>
  );

  const controls = (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={block}
        onChange={(e) => setBlock(e.target.value)}
        className="rounded-lg border border-black/15 px-3 py-2 text-sm"
      >
        <option value="">{t('Todas las manzanas')}</option>
        {blocks.map((b) => (
          <option key={b} value={b}>
            {b.replace('MZ-', `${t('Manzana')} `)}
          </option>
        ))}
      </select>
      <select
        value={size}
        onChange={(e) => setSize(e.target.value as SizeFilter)}
        className="rounded-lg border border-black/15 px-3 py-2 text-sm"
      >
        <option value="">{t('Cualquier tamaño')}</option>
        <option value="lt800">{t('Menos de 800 m²')}</option>
        <option value="800to1500">800 – 1,500 m²</option>
        <option value="gt1500">{t('Más de 1,500 m²')}</option>
      </select>
      <label className="flex items-center gap-2 text-sm text-primary">
        <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
        {t('Solo disponibles')}
      </label>
      <div className="ml-auto">{legend}</div>
    </div>
  );

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8" id="mapa-solares">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-primary sm:text-4xl">{t('Elige tu solar')}</h2>
        <p className="mt-2 text-brand-gray">
          {t('{n} solares disponibles', { n: available.length })}
          {Number.isFinite(minPrice) && <> · {t('desde')} {formatCurrency(minPrice)}</>} ·{' '}
          {t('toca uno para ver su precio y tu cuota')}
        </p>
      </div>

      {!full && <div className="mb-4">{controls}</div>}

      <div
        ref={wrapEl}
        className={
          full
            ? 'fixed inset-0 z-[3000] bg-primary'
            : 'relative h-[480px] overflow-hidden rounded-2xl ring-1 ring-black/10 sm:h-[560px]'
        }
      >
        {/*
          El alto lo manda el contenedor, nunca este div: Leaflet añade sus
          propias clases al montarse y, si React reescribe su className al
          cambiar de modo, se las lleva por delante y el mapa se queda en negro.
        */}
        <div ref={mapEl} className="h-full w-full" />
        {/* En pantalla completa los filtros flotan sobre el mapa, como en un buscador. */}
        {full && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[1001] p-3">
            <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl bg-white/95 p-3 shadow-lg ring-1 ring-black/10 backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                {panel ? (
                  <p className="px-1 text-sm font-medium text-primary">
                    {t('{n} solares en pantalla', { n: visible.length })} ·{' '}
                    {t('{n} disponibles', { n: available.length })}
                    {Number.isFinite(minPrice) && <> · {t('desde')} {formatCurrency(minPrice)}</>}
                  </p>
                ) : (
                  legend
                )}
                <button
                  onClick={() => setPanel((p) => !p)}
                  aria-label={panel ? t('Ocultar los filtros') : t('Mostrar los filtros')}
                  className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-primary hover:bg-light"
                >
                  {panel ? <ChevronUp className="h-5 w-5" /> : <SlidersHorizontal className="h-5 w-5" />}
                </button>
              </div>
              {panel && (
                <>
                  <div className="mt-2">{controls}</div>
                </>
              )}
            </div>
          </div>
        )}
        <button
          onClick={toggleFull}
          title={full ? t('Salir de pantalla completa (Esc)') : t('Ver el mapa en pantalla completa')}
          aria-label={full ? t('Salir de pantalla completa') : t('Ver el mapa en pantalla completa')}
          className={`absolute z-[1002] rounded-lg bg-white/95 p-2 text-primary shadow-md ring-1 ring-black/10 hover:bg-white ${
            full ? 'bottom-4 right-4' : 'right-3 top-3'
          }`}
        >
          {full ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </button>
        {selected && (
          <LotPanel
            lot={selected}
            projectName={projectName}
            modal={full}
            onClose={() => setSelected(null)}
          />
        )}
      </div>

      {/* Acciones del proyecto: debajo del mapa, donde se toman tras mirarlo. */}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {destination && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${destination}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-3 py-2 text-sm font-medium text-primary hover:bg-light"
          >
            <Navigation className="h-4 w-4" strokeWidth={1.8} />
            {t('Cómo llegar')}
          </a>
        )}
        <WhatsAppCTA
          variant="outline"
          message={t('Hola, estoy viendo el mapa de solares de {p} y quiero información.', {
            p: projectName,
          })}
        />
      </div>

      {/* Tabla con la misma información (accesible sin mapa, y para comparar) */}
      <div className="mt-6 overflow-x-auto rounded-2xl bg-white ring-1 ring-black/5">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/5 text-xs uppercase tracking-wider text-brand-gray">
              <th className="px-3 py-3">{t('Solar')}</th>
              <th className="px-3 py-3">{t('Área')}</th>
              <th className="px-3 py-3">{t('Precio')}</th>
              <th className="hidden px-3 py-3 sm:table-cell">{t('Cuota mensual')}</th>
              <th className="px-3 py-3">{t('Estado')}</th>
            </tr>
          </thead>
          <tbody>
            {(showAll ? visible : visible.slice(0, 12)).map((l) => (
              <tr
                key={l.id}
                onClick={() => {
                  setSelected(l);
                  mapEl.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="cursor-pointer border-b border-black/5 hover:bg-light"
              >
                <td className="px-3 py-2 font-medium text-primary">
                  {l.code}
                  {l.name && <span className="block text-xs font-normal text-brand-gray">{t(l.name)}</span>}
                  {l.approximateGeometry && (
                    <span className="block text-xs font-normal text-amber-700">{t('Ubicación en el mapa por confirmar')}</span>
                  )}
                </td>
                <td className="px-3 py-2">{fmtArea(l.areaM2)}</td>
                <td className="px-3 py-2">{l.price != null ? formatCurrency(l.price) : '—'}</td>
                <td className="hidden px-3 py-2 sm:table-cell">
                  {l.price != null ? formatCurrency(monthly(l.price)) : '—'}
                </td>
                <td className="px-3 py-2">
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ background: STATUS_STYLE[l.status].fill }}>
                    {t(STATUS_STYLE[l.status].label)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length > 12 && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="w-full border-t border-black/5 py-3 text-sm font-medium text-accent hover:bg-light"
          >
            {showAll ? t('Ver menos') : t('Ver los {n} solares', { n: visible.length })}
          </button>
        )}
      </div>
      <p className="mt-3 text-xs text-brand-gray">
        {t('Áreas según levantamiento topográfico GEO 3i. Precio de lista $100/m². Plan de pago: 30% de entrada y saldo en hasta 24 cuotas mensuales sin intereses.')}
      </p>
    </section>
  );
}

function byCode(a: PublicLot, b: PublicLot) {
  return a.code.localeCompare(b.code, 'es', { numeric: true });
}

function fmtArea(a?: number | null) {
  return a != null ? `${a.toLocaleString('en-US', { maximumFractionDigits: 0 })} m²` : '—';
}

function monthly(price: number) {
  return (price * (1 - DOWN_PAYMENT)) / INSTALLMENTS;
}

/** Fotos del solar cargadas desde el panel de administración. */
function LotPhotos({ images, code }: { images: string[]; code: string }) {
  const { t } = useLang();
  const [open, setOpen] = useState<number | null>(null);
  if (!images.length) return null;
  return (
    <>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {images.map((src, i) => (
          <button
            key={src}
            onClick={() => setOpen(i)}
            className="shrink-0 overflow-hidden rounded-lg ring-1 ring-black/10"
            aria-label={t('Ver foto {n} del solar {code}', { n: i + 1, code })}
          >
            <img src={src} alt={t('Solar {code}, foto {n}', { code, n: i + 1 })} loading="lazy" className="h-20 w-28 object-cover" />
          </button>
        ))}
      </div>
      {open !== null && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setOpen(null)}
          role="dialog"
        >
          <img src={images[open]} alt={t('Solar {code}', { code })} className="max-h-full max-w-full rounded-lg object-contain" />
          <button onClick={() => setOpen(null)} aria-label={t('Cerrar')} className="absolute right-4 top-4 text-white">
            <X className="h-7 w-7" />
          </button>
        </div>
      )}
    </>
  );
}

function LotPanel({
  lot,
  projectName,
  modal,
  onClose,
}: {
  lot: PublicLot;
  projectName: string;
  /** En pantalla completa la ficha es una ventana emergente sobre el mapa. */
  modal?: boolean;
  onClose: () => void;
}) {
  const { t } = useLang();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const available = lot.status === 'AVAILABLE';
  // El teclado del teléfono no encoge la ventana: sin esto, el campo que se
  // escribe queda debajo del teclado en la ventana emergente.
  const vv = useVisualViewport();

  const precio = lot.price != null ? `, ${formatCurrency(lot.price)}` : '';
  const waMsg = t('Hola, me interesa el *solar {code}* de {p} ({area}{precio}). Quiero más información.', {
    code: lot.code,
    p: projectName,
    area: fmtArea(lot.areaM2),
    precio,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/contact', {
        ...form,
        source: `lote:${projectName}:${lot.code}`,
        message: `Interés en el solar ${lot.code} (${fmtArea(lot.areaM2)}${precio}) de ${projectName}.`,
      });
      setSent(true);
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSending(false);
    }
  }

  // Al enfocar un campo, el navegador móvil abre el teclado y encoge el área
  // visible: subimos el campo al centro de lo que queda a la vista.
  const keepVisible = (e: React.FocusEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250);
  };

  const closeButton = (
    <button onClick={onClose} aria-label={t('Cerrar')} className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1 text-brand-gray hover:text-primary">
      <X className="h-5 w-5" />
    </button>
  );

  const body = (
    <>
      <p className="text-xs uppercase tracking-wider text-brand-gray">{lot.block?.replace('MZ-', `${t('Manzana')} `)}</p>
      <h3 className="font-serif text-2xl font-bold text-primary">{t('Solar')} {lot.code}</h3>
      {lot.name && <p className="text-sm text-accent">{t('Uso proyectado')}: {t(lot.name)}</p>}
      <span className="mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ background: STATUS_STYLE[lot.status].fill }}>
        {t(STATUS_STYLE[lot.status].label)}
      </span>

      <LotPhotos images={lot.images ?? []} code={lot.code} />

      <dl className="mt-4 space-y-2 text-sm">
        {lot.price != null && (
          <>
            <Row label={t('Precio')} value={formatCurrency(lot.price)} strong />
            {lot.pricePerM2 != null && <Row label={t('Precio por m²')} value={formatCurrency(lot.pricePerM2)} />}
            <Row label={t('Entrada (30%)')} value={formatCurrency(lot.price * DOWN_PAYMENT)} />
            <Row label={t('{n} cuotas sin interés de', { n: INSTALLMENTS })} value={formatCurrency(monthly(lot.price))} />
          </>
        )}
      </dl>

      {/* Vía más rápida: abre WhatsApp con el solar ya escrito, sin llenar nada. */}
      <WhatsAppCTA message={waMsg} className="mt-4 w-full" />

      <LotSheet lot={lot} />

      {available && !sent && (
        <form onSubmit={submit} className="mt-4 space-y-2 border-t border-black/5 pt-4">
          <p className="text-sm font-semibold text-primary">{t('O déjanos tus datos y te escribimos')}</p>
          <input required placeholder={t('Nombre')} onFocus={keepVisible} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm" />
          <input required type="email" placeholder={t('Email')} onFocus={keepVisible} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm" />
          <PhoneField required onFocus={keepVisible} onChange={(phone) => setForm({ ...form, phone })} />
          <Button type="submit" className="w-full" disabled={sending}>
            {sending ? t('Enviando…') : t('Quiero que me contacten')}
          </Button>
          <p className="text-xs text-brand-gray">
            {t('El WhatsApp es obligatorio: es por donde te responde el asesor.')}
          </p>
        </form>
      )}
      {sent && (
        <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
          {t('¡Listo! Un asesor te contactará por WhatsApp sobre el solar {code}.', { code: lot.code })}
        </p>
      )}
    </>
  );

  // Pantalla completa: ventana emergente centrada sobre el mapa, dimensionada
  // con el área visible real para que el teclado nunca tape el formulario.
  if (modal) {
    return (
      <div
        className="fixed inset-x-0 z-[3100] flex items-center justify-center p-3"
        style={{ top: vv.offsetTop, height: vv.height }}
      >
        <button className="absolute inset-0 cursor-default bg-black/50" onClick={onClose} aria-label={t('Cerrar la ficha')} />
        <div
          role="dialog"
          aria-label={t('Ficha del solar {code}', { code: lot.code })}
          className="relative w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl bg-white p-5 shadow-2xl"
          style={{ maxHeight: '100%' }}
        >
          {closeButton}
          {body}
        </div>
      </div>
    );
  }

  return (
    // En el teléfono es una hoja que sube desde abajo hasta media pantalla: se
    // sigue viendo el mapa mientras se lee la ficha. En pantallas grandes, panel lateral.
    <div className="absolute inset-x-0 bottom-0 z-[1000] max-h-[62%] overflow-y-auto rounded-t-2xl bg-white p-5 pt-3 shadow-2xl sm:inset-x-auto sm:bottom-3 sm:right-3 sm:top-3 sm:max-h-none sm:w-96 sm:rounded-2xl sm:pt-5">
      <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-black/15 sm:hidden" />
      {closeButton}
      {body}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-brand-gray">{label}</dt>
      <dd className={`text-right ${strong ? 'font-serif text-lg font-bold text-accent' : 'font-medium text-primary'}`}>{value}</dd>
    </div>
  );
}

/**
 * Traduce un colindante conservando el nombre propio: "Solar A11" → "Lot A11".
 * El nombre de la calle no se traduce: es el rótulo que está en el terreno.
 */
function colindante(t: (s: string) => string, texto: string): string {
  const m = /^(Solar|Calle)\s+(.+)$/.exec(texto);
  return m ? `${t(m[1])} ${m[2]}` : t(texto);
}

const CARDINAL_SHORT: Record<string, string> = { NORTE: 'Norte', ESTE: 'Este', SUR: 'Sur', OESTE: 'Oeste' };
const num = (n: number, d = 2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

/** Ficha técnica del solar: identificación, linderos y coordenadas (fuente GEO 3i). */
function LotSheet({ lot }: { lot: PublicLot }) {
  const { t } = useLang();
  const note = lot.details?.cadastralNote;
  // Solo hay geometría cuando el solar está digitalizado en GEO 3i.
  const d = lot.details?.linderos ? lot.details : null;
  return (
    <div className="mt-4 space-y-3 border-t border-black/5 pt-4 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-secondary">{t('Ficha técnica')}</p>
      {lot.details?.notice && <p className="rounded-lg bg-amber-50 p-2 text-xs font-medium text-amber-900">⚠ {lot.details.notice}</p>}
      <dl className="space-y-2">
        <Row label={t('Clave catastral')} value={lot.cadastralCode ?? t('Por asignar')} />
        {note && <p className="-mt-1 text-right text-[11px] text-brand-gray">{note}</p>}
        <Row label={t('Área')} value={fmtArea(lot.areaM2)} />
        {d && <Row label={t('Perímetro')} value={`${num(d.perimeterM)} m`} />}
        {d?.frentes?.length ? <Row label={d.frentes.length > 1 ? t('Frentes') : t('Frente')} value={d.frentes.map((f) => `${num(f.lengthM)} m ${t('a')} ${f.calle}`).join(' · ')} /> : null}
        {d?.fondoM ? <Row label={t('Fondo')} value={`${num(d.fondoM)} m`} /> : null}
        {lot.details?.areaNote && <p className="-mt-1 text-right text-[11px] text-amber-700">{lot.details.areaNote}</p>}
        {d && <Row label={t('Lados')} value={String(d.sides.length)} />}
        <Row label={t('Ubicación')} value="Manglaralto, Santa Elena" />
        {d && <Row label={t('Centro (UTM 17S)')} value={`${num(d.centroidUTM.este, 1)} E · ${num(d.centroidUTM.norte, 1)} N`} />}
      </dl>

      {d ? (
        <>
          <div>
            <p className="mb-1 font-semibold text-primary">{t('Linderos')}</p>
            <ul className="space-y-1">
              {d.linderos.map((l, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="text-brand-gray">
                    <b className="font-medium text-primary">{t(CARDINAL_SHORT[l.cardinal] ?? l.cardinal)}:</b> {colindante(t, l.colindante)}
                  </span>
                  <span className="shrink-0 font-medium text-primary">{num(l.lengthM)} m</span>
                </li>
              ))}
            </ul>
          </div>
          <details className="rounded-lg bg-light p-2">
            <summary className="cursor-pointer text-xs font-medium text-primary">{t('Coordenadas de los vértices (UTM WGS84 zona 17S)')}</summary>
            <table className="mt-2 w-full text-xs">
              <thead className="text-brand-gray">
                <tr><th className="text-left font-medium">{t('Vértice')}</th><th className="text-right font-medium">{t('Este (m)')}</th><th className="text-right font-medium">{t('Norte (m)')}</th><th className="text-right font-medium">{t('Lado (m)')}</th></tr>
              </thead>
              <tbody>
                {d.vertices.map((v, i) => (
                  <tr key={v.name + i} className="border-t border-black/5">
                    <td>{v.name}</td>
                    <td className="text-right tabular-nums">{num(v.este)}</td>
                    <td className="text-right tabular-nums">{num(v.norte)}</td>
                    <td className="text-right tabular-nums">{d.sides[i] ? num(d.sides[i].lengthM) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
          <p className="text-[11px] text-brand-gray">{t('Fuente')}: {d.source}. {t('Datos referenciales; los linderos legales constan en la escritura.')}</p>
        </>
      ) : (
        <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
          {t('Linderos y coordenadas pendientes: este solar aún no está digitalizado en el levantamiento topográfico.')}
        </p>
      )}
    </div>
  );
}

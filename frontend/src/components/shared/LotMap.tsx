import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/shared/Toast';
import type { PublicLot, LotStatus } from '@shared/types';

// ============================================================
// Mapa interactivo de solares. Geometría real de GEO 3i (reproyectada a
// lat/lng en el import), sobre imagen satelital de Esri (sin API key).
// Al tocar un solar: área, precio, cuota con el plan 30% + 36 cuotas al 0%
// y un formulario "Me interesa" que entra como lead (con la atribución del
// socio que refirió, vía la cookie de referido que ya lee /api/contact).
// ============================================================

const STATUS_STYLE: Record<LotStatus, { fill: string; label: string }> = {
  AVAILABLE: { fill: '#16a34a', label: 'Disponible' },
  RESERVED: { fill: '#f59e0b', label: 'Reservado' },
  SOLD: { fill: '#dc2626', label: 'Vendido' },
  NOT_FOR_SALE: { fill: '#9ca3af', label: 'No disponible' },
};

const DOWN_PAYMENT = 0.3;
const INSTALLMENTS = 36;

type SizeFilter = '' | 'lt800' | '800to1500' | 'gt1500';

export function LotMap({ projectSlug, projectName }: { projectSlug: string; projectName: string }) {
  const [lots, setLots] = useState<PublicLot[] | null>(null);
  const [selected, setSelected] = useState<PublicLot | null>(null);
  const [block, setBlock] = useState('');
  const [size, setSize] = useState<SizeFilter>('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    api.get<PublicLot[]>(`/projects/${projectSlug}/lots`).then(setLots).catch(() => setLots([]));
  }, [projectSlug]);

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
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 20, maxNativeZoom: 19, attribution: 'Imágenes © Esri' },
    ).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lots]);

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
      poly.bindTooltip(`${lot.code}${lot.name ? ` · ${lot.name}` : ''}`, { sticky: true });
      poly.on('click', () => setSelected(lot));
      poly.addTo(layer);
      ring.forEach((c) => bounds.extend(c));
    }
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
  }, [visible]);

  if (lots === null) return <p className="py-10 text-center text-brand-gray">Cargando mapa de solares…</p>;
  if (lots.length === 0) return null;

  const minPrice = Math.min(...available.map((l) => l.price ?? Infinity));

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8" id="mapa-solares">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-primary sm:text-4xl">Elige tu solar</h2>
        <p className="mt-2 text-brand-gray">
          {available.length} solares disponibles
          {Number.isFinite(minPrice) && <> · desde {formatCurrency(minPrice)}</>} · toca uno para ver su
          precio y tu cuota
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select value={block} onChange={(e) => setBlock(e.target.value)} className="rounded-lg border border-black/15 px-3 py-2 text-sm">
          <option value="">Todas las manzanas</option>
          {blocks.map((b) => (
            <option key={b} value={b}>{b.replace('MZ-', 'Manzana ')}</option>
          ))}
        </select>
        <select value={size} onChange={(e) => setSize(e.target.value as SizeFilter)} className="rounded-lg border border-black/15 px-3 py-2 text-sm">
          <option value="">Cualquier tamaño</option>
          <option value="lt800">Menos de 800 m²</option>
          <option value="800to1500">800 – 1,500 m²</option>
          <option value="gt1500">Más de 1,500 m²</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-primary">
          <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
          Solo disponibles
        </label>
        <div className="ml-auto flex flex-wrap gap-3 text-xs text-brand-gray">
          {(Object.keys(STATUS_STYLE) as LotStatus[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm" style={{ background: STATUS_STYLE[s].fill }} />
              {STATUS_STYLE[s].label}
            </span>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl ring-1 ring-black/10">
        <div ref={mapEl} className="h-[480px] w-full sm:h-[560px]" />
        {selected && (
          <LotPanel lot={selected} projectName={projectName} onClose={() => setSelected(null)} />
        )}
      </div>

      {/* Tabla con la misma información (accesible sin mapa, y para comparar) */}
      <div className="mt-6 overflow-x-auto rounded-2xl bg-white ring-1 ring-black/5">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/5 text-xs uppercase tracking-wider text-brand-gray">
              <th className="px-3 py-3">Solar</th>
              <th className="px-3 py-3">Área</th>
              <th className="px-3 py-3">Precio</th>
              <th className="hidden px-3 py-3 sm:table-cell">Cuota mensual</th>
              <th className="px-3 py-3">Estado</th>
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
                  {l.name && <span className="block text-xs font-normal text-brand-gray">{l.name}</span>}
                  {l.approximateGeometry && (
                    <span className="block text-xs font-normal text-amber-700">Ubicación en el mapa por confirmar</span>
                  )}
                </td>
                <td className="px-3 py-2">{fmtArea(l.areaM2)}</td>
                <td className="px-3 py-2">{l.price != null ? formatCurrency(l.price) : '—'}</td>
                <td className="hidden px-3 py-2 sm:table-cell">
                  {l.price != null ? formatCurrency(monthly(l.price)) : '—'}
                </td>
                <td className="px-3 py-2">
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ background: STATUS_STYLE[l.status].fill }}>
                    {STATUS_STYLE[l.status].label}
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
            {showAll ? 'Ver menos' : `Ver los ${visible.length} solares`}
          </button>
        )}
      </div>
      <p className="mt-3 text-xs text-brand-gray">
        Áreas según levantamiento topográfico GEO 3i. Precio de lista $100/m². Plan de pago: 30% de
        entrada y saldo en hasta 36 cuotas mensuales sin intereses.
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

function LotPanel({ lot, projectName, onClose }: { lot: PublicLot; projectName: string; onClose: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const available = lot.status === 'AVAILABLE';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/contact', {
        ...form,
        source: `lote:${projectName}:${lot.code}`,
        message: `Interés en el solar ${lot.code} (${fmtArea(lot.areaM2)}${
          lot.price != null ? `, ${formatCurrency(lot.price)}` : ''
        }) de ${projectName}.`,
      });
      setSent(true);
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="absolute inset-x-2 bottom-2 z-[1000] max-h-[90%] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:inset-x-auto sm:right-3 sm:top-3 sm:bottom-3 sm:w-96">
      <button onClick={onClose} aria-label="Cerrar" className="absolute right-3 top-3 text-brand-gray hover:text-primary">
        <X className="h-5 w-5" />
      </button>
      <p className="text-xs uppercase tracking-wider text-brand-gray">{lot.block?.replace('MZ-', 'Manzana ')}</p>
      <h3 className="font-serif text-2xl font-bold text-primary">Solar {lot.code}</h3>
      {lot.name && <p className="text-sm text-accent">Uso proyectado: {lot.name}</p>}
      <span className="mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ background: STATUS_STYLE[lot.status].fill }}>
        {STATUS_STYLE[lot.status].label}
      </span>

      <dl className="mt-4 space-y-2 text-sm">
        {lot.price != null && (
          <>
            <Row label="Precio" value={formatCurrency(lot.price)} strong />
            {lot.pricePerM2 != null && <Row label="Precio por m²" value={formatCurrency(lot.pricePerM2)} />}
            <Row label="Entrada (30%)" value={formatCurrency(lot.price * DOWN_PAYMENT)} />
            <Row label={`${INSTALLMENTS} cuotas sin interés de`} value={formatCurrency(monthly(lot.price))} />
          </>
        )}
      </dl>

      <LotSheet lot={lot} />

      {available && !sent && (
        <form onSubmit={submit} className="mt-4 space-y-2 border-t border-black/5 pt-4">
          <p className="text-sm font-semibold text-primary">Me interesa este solar</p>
          <input required placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm" />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm" />
          <input placeholder="WhatsApp" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm" />
          <Button type="submit" className="w-full" disabled={sending}>
            {sending ? 'Enviando…' : 'Quiero que me contacten'}
          </Button>
        </form>
      )}
      {sent && (
        <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
          ¡Listo! Un asesor te contactará sobre el solar {lot.code}.
        </p>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-brand-gray">{label}</dt>
      <dd className={strong ? 'font-serif text-lg font-bold text-accent' : 'font-medium text-primary'}>{value}</dd>
    </div>
  );
}

const CARDINAL_SHORT: Record<string, string> = { NORTE: 'Norte', ESTE: 'Este', SUR: 'Sur', OESTE: 'Oeste' };
const num = (n: number, d = 2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

/** Ficha técnica del solar: identificación, linderos y coordenadas (fuente GEO 3i). */
function LotSheet({ lot }: { lot: PublicLot }) {
  const d = lot.details;
  return (
    <div className="mt-4 space-y-3 border-t border-black/5 pt-4 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Ficha técnica</p>
      <dl className="space-y-2">
        <Row label="Clave catastral" value={lot.cadastralCode ?? 'Por asignar'} />
        {d?.cadastralNote && <p className="-mt-1 text-right text-[11px] text-brand-gray">{d.cadastralNote}</p>}
        <Row label="Área" value={fmtArea(lot.areaM2)} />
        {d && <Row label="Perímetro" value={`${num(d.perimeterM)} m`} />}
        {d && <Row label="Lados" value={String(d.sides.length)} />}
        <Row label="Ubicación" value="Manglaralto, Santa Elena" />
        {d && <Row label="Centro (UTM 17S)" value={`${num(d.centroidUTM.este, 1)} E · ${num(d.centroidUTM.norte, 1)} N`} />}
      </dl>

      {d ? (
        <>
          <div>
            <p className="mb-1 font-semibold text-primary">Linderos</p>
            <ul className="space-y-1">
              {d.linderos.map((l, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="text-brand-gray">
                    <b className="font-medium text-primary">{CARDINAL_SHORT[l.cardinal] ?? l.cardinal}:</b> {l.colindante}
                  </span>
                  <span className="shrink-0 font-medium text-primary">{num(l.lengthM)} m</span>
                </li>
              ))}
            </ul>
          </div>
          <details className="rounded-lg bg-light p-2">
            <summary className="cursor-pointer text-xs font-medium text-primary">Coordenadas de los vértices (UTM WGS84 zona 17S)</summary>
            <table className="mt-2 w-full text-xs">
              <thead className="text-brand-gray">
                <tr><th className="text-left font-medium">Vértice</th><th className="text-right font-medium">Este (m)</th><th className="text-right font-medium">Norte (m)</th><th className="text-right font-medium">Lado (m)</th></tr>
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
          <p className="text-[11px] text-brand-gray">Fuente: {d.source}. Datos referenciales; los linderos legales constan en la escritura.</p>
        </>
      ) : (
        <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
          Linderos y coordenadas pendientes: este solar aún no está digitalizado en el levantamiento topográfico.
        </p>
      )}
    </div>
  );
}

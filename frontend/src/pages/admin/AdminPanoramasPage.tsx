import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, Eye, EyeOff, MapPin, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useAdminGet } from '@/hooks/useAdminAPI';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/components/shared/Toast';
import { buildPanoramaTiles, inspectEquirect, type EquirectInfo } from '@/lib/panoTiles';
import type { AdminLot, Panorama } from '@shared/types';

const PanoViewer = lazy(() => import('@/components/shared/PanoViewer'));

const PIN = (active: boolean, selected: boolean) =>
  L.divIcon({
    className: 'pano-pin',
    html: `<span style="${selected ? 'background:#ffc428;color:#1f2937' : ''}${active ? '' : ';opacity:.5'}">360°</span>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

/**
 * Vistas 360° de un proyecto: subir la imagen equirectangular (se corta en
 * mosaicos aquí mismo), ubicarla en el mapa arrastrando el punto y fijar el
 * norte mirando la vista.
 */
export default function AdminPanoramasPage() {
  const { projectId = '' } = useParams();
  const { toast } = useToast();
  const { data, reload } = useAdminGet<Panorama[]>(`/admin/panoramas?projectId=${projectId}`);
  const { data: lots } = useAdminGet<AdminLot[]>(`/admin/lots?projectId=${projectId}`);
  const { data: projects } = useAdminGet<{ id: string; name: string; slug: string }[]>('/admin/projects');
  const project = projects?.find((p) => p.id === projectId);
  const panos = data ?? [];

  const [selected, setSelected] = useState<string | null>(null);
  const [placing, setPlacing] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pinsRef = useRef<L.LayerGroup | null>(null);
  const placingRef = useRef<string | null>(null);
  placingRef.current = placing;

  async function patch(id: string, body: Partial<Panorama>, msg?: string) {
    try {
      await adminApi.patch(`/admin/panoramas/${id}`, body);
      if (msg) toast(msg, 'success');
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  // Mapa satelital con los solares
  useEffect(() => {
    if (!mapEl.current || mapRef.current || !lots) return;
    const map = L.map(mapEl.current, { scrollWheelZoom: true });
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 21,
      maxNativeZoom: 18,
      attribution: '© Esri',
    }).addTo(map);
    const bounds = L.latLngBounds([]);
    for (const l of lots) {
      if (!l.geometry) continue;
      const ring = l.geometry.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number]);
      L.polygon(ring, { color: '#fff', weight: 1, fill: false, interactive: false }).addTo(map);
      if (l.code !== 'LOBBY') ring.forEach((c) => bounds.extend(c));
    }
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
    else map.setView([-1.8512, -80.735], 16);
    map.on('click', (e: L.LeafletMouseEvent) => {
      const id = placingRef.current;
      if (!id) return;
      setPlacing(null);
      patch(id, { lat: e.latlng.lat, lng: e.latlng.lng }, 'Vista ubicada ✅');
    });
    pinsRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lots]);

  // Puntos 360° (arrastrables)
  useEffect(() => {
    const g = pinsRef.current;
    if (!g) return;
    g.clearLayers();
    for (const p of panos) {
      if (p.lat == null || p.lng == null) continue;
      L.marker([p.lat, p.lng], { icon: PIN(p.active !== false, p.id === selected), draggable: true, title: p.title })
        .bindTooltip(p.title, { direction: 'top', offset: [0, -18] })
        .on('click', () => setSelected(p.id))
        .on('dragend', (e) => {
          const ll = (e.target as L.Marker).getLatLng();
          patch(p.id, { lat: ll.lat, lng: ll.lng }, 'Ubicación actualizada');
        })
        .addTo(g);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panos, selected, lots]);

  async function remove(p: Panorama) {
    if (!window.confirm(`¿Eliminar la vista "${p.title}"?`)) return;
    await adminApi.del(`/admin/panoramas/${p.id}`);
    toast('Vista eliminada', 'success');
    reload();
  }

  async function rename(p: Panorama) {
    const title = window.prompt('Nombre de la vista', p.title)?.trim();
    if (title && title !== p.title) patch(p.id, { title }, 'Nombre actualizado');
  }

  const placed = panos.filter((p) => p.lat != null);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to="/admin/proyectos" className="text-sm text-accent hover:underline">
            ← Proyectos
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-primary">Vistas 360° {project ? `· ${project.name}` : ''}</h1>
          <p className="text-sm text-brand-gray">
            Sube una imagen equirectangular (2:1), ubícala en el mapa y fija el norte. Aparecen como puntos «360°» en el
            mapa interactivo del proyecto.
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4" /> Nueva vista 360°
        </Button>
      </div>

      {placing && (
        <div className="rounded-xl bg-secondary/20 p-3 text-sm font-medium text-primary ring-1 ring-secondary">
          Haz clic en el mapa donde se tomó la foto de «{panos.find((p) => p.id === placing)?.title}».{' '}
          <button className="underline" onClick={() => setPlacing(null)}>
            Cancelar
          </button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div ref={mapEl} className={`isolate h-[520px] overflow-hidden rounded-2xl ring-1 ring-black/10 ${placing ? 'cursor-crosshair' : ''}`} />

        <ul className="space-y-3">
          {panos.length === 0 && <li className="rounded-xl bg-white p-4 text-sm text-brand-gray">Aún no hay vistas 360°.</li>}
          {panos.map((p) => (
            <li
              key={p.id}
              onClick={() => {
                setSelected(p.id);
                if (p.lat != null && p.lng != null) mapRef.current?.panTo([p.lat, p.lng]);
              }}
              className={`cursor-pointer rounded-xl bg-white p-3 shadow-sm ring-1 ${p.id === selected ? 'ring-secondary' : 'ring-black/5'}`}
            >
              <div className="flex gap-3">
                <img src={p.tiles.baseUrl} alt="" className="h-16 w-28 flex-none rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <button onClick={() => rename(p)} className="truncate text-left font-semibold text-primary hover:underline" title="Cambiar nombre">
                    {p.title}
                  </button>
                  <p className="text-xs text-brand-gray">
                    {p.lat != null ? 'Ubicada' : '⚠️ Sin ubicar'} · Norte {p.northYaw.toFixed(0)}° ·{' '}
                    {p.tiles.levels[p.tiles.levels.length - 1].width} px
                  </p>
                  {p.active === false && <p className="text-xs font-semibold text-red-600">Oculta en la web</p>}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="outline" onClick={() => setViewing(p.id)}>
                  <Compass className="h-3.5 w-3.5" /> Ver / norte
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPlacing(p.id)}>
                  <MapPin className="h-3.5 w-3.5" /> Ubicar
                </Button>
                <Button size="sm" variant="outline" onClick={() => patch(p.id, { active: p.active === false }, p.active === false ? 'Visible en la web' : 'Oculta')}>
                  {p.active === false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => remove(p)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-brand-gray">
        Para ubicar un punto: «Ubicar» y clic en el mapa, o arrástralo. Para el norte: «Ver / norte», gira la vista hasta
        tener el norte al centro de la pantalla y pulsa el botón amarillo.
      </p>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        projectId={projectId}
        onDone={(id) => {
          setUploadOpen(false);
          reload();
          setPlacing(id || null);
        }}
      />

      {viewing && (
        <Suspense fallback={<div className="fixed inset-0 z-[4000] bg-black" />}>
          <PanoViewer
            panoramas={placed.some((p) => p.id === viewing) ? placed : panos.filter((p) => p.id === viewing)}
            startId={viewing}
            lots={lots ?? []}
            onClose={() => setViewing(null)}
            onSetNorth={(p, northYaw) => {
              patch(p.id, { northYaw }, `Norte fijado en ${northYaw}° ✅`);
              setViewing(null);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}

function UploadModal({
  open,
  onClose,
  projectId,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onDone: (id: string) => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState('');
  const [warning, setWarning] = useState('');
  const [progress, setProgress] = useState<[number, number] | null>(null);
  const [meta, setMeta] = useState<EquirectInfo | null>(null);
  const [hfov, setHfov] = useState('');

  useEffect(() => {
    if (!open) {
      setMeta(null);
      setHfov('');
      setTitle('');
      setFile(null);
      setInfo('');
      setWarning('');
      setProgress(null);
    }
  }, [open]);

  async function pick(f: File | null) {
    setFile(f);
    setInfo('');
    setWarning('');
    if (!f) return;
    try {
      const r = await inspectEquirect(f);
      setMeta(r);
      setHfov(String(r.hfov));
      setInfo(
        `${r.width}×${r.height} px · ${(f.size / 1048576).toFixed(1)} MB · ${r.partial ? 'panorámica parcial' : '360° completa'}` +
          (r.lat != null ? ' · con ubicación GPS' : '') +
          (r.heading != null ? ` · rumbo ${Math.round(r.heading)}°` : ''),
      );
      setWarning(r.warning ?? '');
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '));
    } catch {
      setWarning('No se pudo leer la imagen. Usa JPG o PNG (las fotos HEIC del iPhone hay que convertirlas antes).');
    }
  }

  async function save() {
    if (!file || !title.trim()) return;
    try {
      const h = meta?.partial ? Math.min(360, Math.max(30, Number(hfov) || meta.hfov)) : 360;
      const tiles = await buildPanoramaTiles(file, (d, t) => setProgress([d, t]), h);
      const located = meta?.lat != null && meta?.lng != null;
      const p = await adminApi.post<Panorama>('/admin/panoramas', {
        projectId,
        title: title.trim(),
        tiles,
        // Con los datos de la cámara queda ubicada y orientada sola (se puede ajustar después).
        lat: meta?.lat,
        lng: meta?.lng,
        altitude: meta?.altitude,
        northYaw: meta?.heading != null ? (360 - meta.heading) % 360 : 0,
      });
      toast(located ? 'Vista creada y ubicada con el GPS de la foto ✅ Revisa el norte con «Ver / norte».' : 'Vista 360° creada ✅ Ahora ubícala en el mapa.', 'success');
      if (located) {
        onDone('');
        return;
      }
      onDone(p.id);
    } catch (err) {
      toast((err as Error).message || 'Error al subir', 'error');
      setProgress(null);
    }
  }

  const busy = progress !== null;
  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title="Nueva vista 360°">
      <div className="space-y-4">
        <Input label="Nombre (se ve en el mapa)" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mirador manzana A" />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-primary">Imagen 360° (equirectangular 2:1) o panorámica (JPG)</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => pick(e.target.files?.[0] ?? null)} />
        </label>
        {info && <p className="text-sm text-brand-gray">{info}</p>}
        {warning && <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-800">{warning}</p>}
        {meta?.partial && (
          <div>
            <Input
              label="Ángulo que cubre de lado a lado (grados)"
              type="number"
              min={30}
              max={360}
              value={hfov}
              onChange={(e) => setHfov(e.target.value)}
            />
            <p className="mt-1 text-xs text-brand-gray">
              Estimado por la proporción de la imagen. Si al verla se ve estirada, súbelo; si se ve aplastada, bájalo. Una
              panorámica del iPhone de vuelta completa suele estar entre 180° y 240°.
            </p>
          </div>
        )}
        {busy && (
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-black/10">
              <div className="h-full bg-secondary transition-all" style={{ width: `${(progress[0] / progress[1]) * 100}%` }} />
            </div>
            <p className="mt-1 text-xs text-brand-gray">
              Cortando y subiendo mosaicos: {progress[0]} de {progress[1]}. No cierres esta ventana.
            </p>
          </div>
        )}
        <Button onClick={save} disabled={!file || !title.trim() || busy} className="w-full">
          {busy ? 'Procesando…' : 'Crear vista'}
        </Button>
      </div>
    </Modal>
  );
}

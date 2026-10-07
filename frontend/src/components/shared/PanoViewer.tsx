import { useEffect, useRef, useState } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import { EquirectangularTilesAdapter } from '@photo-sphere-viewer/equirectangular-tiles-adapter';
import { GyroscopePlugin } from '@photo-sphere-viewer/gyroscope-plugin';
import { CompassPlugin } from '@photo-sphere-viewer/compass-plugin';
import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/compass-plugin/index.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X } from 'lucide-react';
import type { Panorama, PublicLot } from '@shared/types';
import { useLang } from '@/hooks/useLang';

// ============================================================
// Visor 360° a pantalla completa. Carga primero la versión liviana y luego
// solo los mosaicos visibles; en el celular se puede mover con el giroscopio.
// Un mapa pequeño muestra dónde estás y hacia dónde miras (cono), y abajo
// están las demás vistas del proyecto para saltar entre ellas.
// ============================================================

const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** Datos del panorama para el visor. sphereCorrection gira la imagen para que el ángulo 0 sea el norte. */
function panoConfig(p: Panorama) {
  return {
    panorama: {
      baseUrl: p.tiles.baseUrl,
      levels: p.tiles.levels.map(({ width, cols, rows }) => ({ width, cols, rows })),
      tileUrl: (col: number, row: number, level: number) => p.tiles.levels[level]?.tiles[row * p.tiles.levels[level].cols + col] ?? null,
    },
    sphereCorrection: { pan: toRad(p.northYaw) },
  };
}

/** Punto a `dist` metros con rumbo `bearing` (grados desde el norte). */
function offset(lat: number, lng: number, dist: number, bearing: number): [number, number] {
  const dLat = (dist * Math.cos(toRad(bearing))) / 111320;
  const dLng = (dist * Math.sin(toRad(bearing))) / (111320 * Math.cos(toRad(lat)));
  return [lat + dLat, lng + dLng];
}

function conePoints(lat: number, lng: number, heading: number, fov: number, dist = 110): [number, number][] {
  const pts: [number, number][] = [[lat, lng]];
  for (let i = 0; i <= 12; i++) pts.push(offset(lat, lng, dist, heading - fov / 2 + (fov * i) / 12));
  return pts;
}

export interface PanoViewerProps {
  panoramas: Panorama[];
  startId: string;
  lots?: PublicLot[];
  onClose: () => void;
  /** Modo admin: botón para fijar el norte con la vista actual. */
  onSetNorth?: (pano: Panorama, northYaw: number) => void;
}

export default function PanoViewer({ panoramas, startId, lots, onClose, onSetNorth }: PanoViewerProps) {
  const { t } = useLang();
  const el = useRef<HTMLDivElement>(null);
  const mapEl = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const coneRef = useRef<L.Polygon | null>(null);
  const dotRef = useRef<L.CircleMarker | null>(null);
  const [currentId, setCurrentId] = useState(startId);
  const current = panoramas.find((p) => p.id === currentId) ?? panoramas[0];
  const currentRef = useRef(current);
  currentRef.current = current;
  const updateRef = useRef<() => void>(() => {});

  // Visor
  useEffect(() => {
    if (!el.current) return;
    const first = panoramas.find((p) => p.id === startId) ?? panoramas[0];
    const viewer = new Viewer({
      container: el.current,
      adapter: EquirectangularTilesAdapter.withConfig({ baseBlur: true }),
      ...panoConfig(first),
      defaultZoomLvl: 20,
      minFov: 25,
      maxFov: 100,
      mousewheelCtrlKey: false,
      touchmoveTwoFingers: false,
      navbar: ['zoom', 'move', 'gyroscope', 'caption', 'fullscreen'],
      caption: first.title,
      lang: { zoom: t('Acercar'), moveUp: '', moveDown: '', moveLeft: '', moveRight: '', fullscreen: t('Pantalla completa') },
      plugins: [
        [GyroscopePlugin, { touchmove: true }],
        [CompassPlugin, { size: '90px', position: 'top right', coneColor: 'rgba(255, 196, 40, 0.5)', navigation: true }],
      ],
    });
    viewerRef.current = viewer;

    const update = () => {
      const p = currentRef.current;
      if (!mapRef.current || p.lat == null || p.lng == null) return;
      const heading = (toDeg(viewer.getPosition().yaw) + 360) % 360;
      const fov = viewer.state.hFov;
      const pts = conePoints(p.lat, p.lng, heading, fov);
      if (coneRef.current) coneRef.current.setLatLngs(pts);
      else
        coneRef.current = L.polygon(pts, { color: '#ffc428', weight: 1, fillColor: '#ffc428', fillOpacity: 0.35, interactive: false }).addTo(mapRef.current);
    };
    updateRef.current = update;
    viewer.addEventListener('position-updated', update);
    viewer.addEventListener('zoom-updated', update);
    viewer.addEventListener('ready', update, { once: true });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      viewer.destroy();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mapa pequeño con la ubicación y el cono de visión
  useEffect(() => {
    if (!mapEl.current) return;
    const map = L.map(mapEl.current, { zoomControl: false, attributionControl: false, dragging: true, scrollWheelZoom: false });
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 21,
      maxNativeZoom: 18,
    }).addTo(map);
    for (const l of lots ?? []) {
      if (l.kind !== 'LOT' || l.approximateGeometry) continue;
      L.polygon(
        l.geometry.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number]),
        { color: '#ffffff', weight: 1, opacity: 0.8, fill: false, interactive: false },
      ).addTo(map);
    }
    for (const p of panoramas) {
      if (p.lat == null || p.lng == null) continue;
      L.circleMarker([p.lat, p.lng], { radius: 5, color: '#fff', weight: 2, fillColor: '#1f2937', fillOpacity: 1 })
        .on('click', () => go(p.id))
        .addTo(map);
    }
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      coneRef.current = null;
      dotRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al cambiar de vista: centrar el mapa y marcar el punto actual
  useEffect(() => {
    const map = mapRef.current;
    if (!map || current.lat == null || current.lng == null) return;
    map.setView([current.lat, current.lng], 18, { animate: false });
    if (dotRef.current) dotRef.current.setLatLng([current.lat, current.lng]);
    else
      dotRef.current = L.circleMarker([current.lat, current.lng], {
        radius: 7,
        color: '#fff',
        weight: 3,
        fillColor: '#ffc428',
        fillOpacity: 1,
        interactive: false,
      }).addTo(map);
    coneRef.current?.remove();
    coneRef.current = null;
    updateRef.current();
  }, [current]);

  function go(id: string) {
    const p = panoramas.find((x) => x.id === id);
    const v = viewerRef.current;
    if (!p || !v || id === currentRef.current.id) return;
    setCurrentId(id);
    const cfg = panoConfig(p);
    v.setPanorama(cfg.panorama, { sphereCorrection: cfg.sphereCorrection, caption: p.title, transition: { speed: 800 } }).then(() => updateRef.current());
  }

  function setNorth() {
    const v = viewerRef.current;
    if (!v || !onSetNorth) return;
    // Ángulo de la imagen original que se está mirando = rumbo actual + corrección vigente.
    const raw = (toDeg(v.getPosition().yaw) + current.northYaw + 360) % 360;
    onSetNorth(current, Math.round(raw * 10) / 10);
  }

  return (
    <div className="fixed inset-0 z-[4000] bg-black" role="dialog" aria-label={current.title}>
      <div ref={el} className="h-full w-full" />

      <button
        onClick={onClose}
        aria-label={t('Cerrar')}
        className="absolute left-3 top-3 z-[10] flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-2 text-sm font-semibold text-white backdrop-blur"
      >
        <X className="h-4 w-4" /> {t('Cerrar')}
      </button>

      {onSetNorth && (
        <button
          onClick={setNorth}
          className="absolute left-1/2 top-3 z-[10] -translate-x-1/2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-primary shadow-lg"
        >
          Lo que veo al centro es el NORTE
        </button>
      )}

      {/* Mapa con el cono de visión */}
      {current.lat != null && (
        <div
          ref={mapEl}
          className="absolute left-3 top-16 z-[10] h-32 w-32 overflow-hidden rounded-xl ring-2 ring-white/70 sm:h-44 sm:w-44"
        />
      )}

      {/* Otras vistas del proyecto */}
      {panoramas.length > 1 && (
        <div className="absolute inset-x-0 bottom-14 z-[9] flex justify-end gap-2 overflow-x-auto px-3 pb-1 sm:justify-center">
          {panoramas.map((p) => (
            <button
              key={p.id}
              onClick={() => go(p.id)}
              className={`relative h-14 w-24 flex-none overflow-hidden rounded-lg ring-2 ${
                p.id === current.id ? 'ring-secondary' : 'ring-white/40'
              }`}
              title={p.title}
            >
              <img src={p.tiles.baseUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
              <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 text-[10px] font-medium text-white">{p.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


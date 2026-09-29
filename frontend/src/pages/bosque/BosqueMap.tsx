import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapTree } from '@/lib/bosque';
import { bosquePath } from '@/lib/bosque';

const COLOR = {
  ADOPTED: '#e3a81b', // guayacán: ya tiene padrino
  AVAILABLE: '#7fc28f', // disponible para adoptar
};

interface Props {
  trees: MapTree[];
  /** Resalta un árbol (página del árbol). */
  focus?: string;
  className?: string;
}

/** Mapa satelital del bosque con un punto por árbol. */
export function BosqueMap({ trees, focus, className = 'h-[420px]' }: Props) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!el.current || trees.length === 0) return;
    const map = L.map(el.current, { scrollWheelZoom: false, attributionControl: true });
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxNativeZoom: 18,
      maxZoom: 20,
      attribution: '© Esri',
    }).addTo(map);

    const bounds = L.latLngBounds([]);
    for (const t of trees) {
      const isFocus = t.code === focus;
      const m = L.circleMarker([t.lat, t.lng], {
        radius: isFocus ? 9 : 5,
        color: isFocus ? '#ffffff' : '#12301f',
        weight: isFocus ? 3 : 1,
        fillColor: COLOR[t.status],
        fillOpacity: 0.95,
      }).addTo(map);
      const who = t.padrino ? `Padrino: ${t.padrino}` : t.status === 'ADOPTED' ? 'Adoptado' : 'Disponible';
      m.bindPopup(
        `<strong>${t.code}</strong> · ${t.species}<br>${who}<br><a href="${bosquePath(`/arbol/${t.code}`)}">Ver árbol →</a>`,
      );
      bounds.extend([t.lat, t.lng]);
    }
    const f = trees.find((t) => t.code === focus);
    if (f) map.setView([f.lat, f.lng], 18);
    else map.fitBounds(bounds, { padding: [30, 30], maxZoom: 18 });
    return () => {
      map.remove();
    };
  }, [trees, focus]);

  if (trees.length === 0) return null;
  return <div ref={el} className={`w-full overflow-hidden rounded-2xl ${className}`} />;
}

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapTree } from '@/lib/bosque';
import { bosquePath } from '@/lib/bosque';
import { FOREST_POLYGON, PILOT_POLYGON } from '@/lib/bosqueGeo';

export const TREE_COLOR = {
  AVAILABLE: '#7fc28f', // espera padrino: se puede elegir
  RESERVED: '#b8bdb5', // elegido, pago en curso
  ADOPTED: '#e3a81b', // guayacán: ya tiene padrino
};

interface Props {
  trees: MapTree[];
  /** Resalta un árbol (página del árbol). */
  focus?: string;
  /** Solo muestra disponibles de esta especie (filtro de la portada). */
  speciesFilter?: string | null;
  /** Clic en un árbol disponible: elegirlo para adoptar. */
  onPick?: (t: MapTree) => void;
  className?: string;
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

/** Mapa satelital del bosque: contorno del terreno, zona piloto y un punto por árbol. */
export function BosqueMap({ trees, focus, speciesFilter, onPick, className = 'h-[420px]' }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  useEffect(() => {
    if (!el.current) return;
    const map = L.map(el.current, { scrollWheelZoom: false, attributionControl: true });
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxNativeZoom: 18,
      maxZoom: 20,
      attribution: '© Esri',
    }).addTo(map);

    L.polygon(FOREST_POLYGON, { color: '#ffffff', weight: 2, dashArray: '6 6', fill: false, interactive: false }).addTo(map);
    L.polygon(PILOT_POLYGON, { color: '#e3a81b', weight: 2, fillColor: '#e3a81b', fillOpacity: 0.08, interactive: false })
      .bindTooltip('Primera etapa · 2 ha', { permanent: false, direction: 'center' })
      .addTo(map);

    const shown = speciesFilter ? trees.filter((t) => t.speciesId === speciesFilter) : trees;
    for (const t of shown) {
      const isFocus = t.code === focus;
      const pickable = !!onPick && t.status === 'AVAILABLE';
      // Radio en metros (copa joven ~2.5 m): escala con el zoom y no se amontonan.
      const m = L.circle([t.lat, t.lng], {
        radius: isFocus ? 4 : 2.6,
        color: isFocus ? '#ffffff' : '#12301f',
        weight: isFocus ? 3 : 1,
        fillColor: TREE_COLOR[t.status],
        fillOpacity: 0.95,
      }).addTo(map);
      m.bindTooltip(`${t.code} · ${esc(t.species)}${t.padrino ? ` · ${esc(t.padrino)}` : ''}`, { direction: 'top' });
      if (pickable) {
        m.on('click', () => pickRef.current?.(t));
      } else if (t.status !== 'AVAILABLE') {
        const who = t.padrino ? `Padrino: ${esc(t.padrino)}` : t.status === 'RESERVED' ? 'Reservado' : 'Adoptado';
        m.bindPopup(
          `<strong>${t.code}</strong> · ${esc(t.species)}<br>${who}<br><a href="${bosquePath(`/arbol/${t.code}`)}">Ver árbol →</a>`,
        );
      }
    }

    const f = trees.find((t) => t.code === focus);
    if (f) map.setView([f.lat, f.lng], 19);
    else if (onPick) map.fitBounds(L.latLngBounds(PILOT_POLYGON), { padding: [20, 20] });
    else map.fitBounds(L.latLngBounds(FOREST_POLYGON), { padding: [20, 20] });
    return () => {
      map.remove();
    };
    // onPick se lee por ref para no reconstruir el mapa en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trees, focus, speciesFilter, !!onPick]);

  // isolate: las capas de Leaflet (z-index 400+) no tapan modales ni el encabezado.
  return <div ref={el} className={`isolate w-full overflow-hidden rounded-2xl ${className}`} />;
}

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Seo } from '@/components/shared/Seo';
import { LotMap } from '@/components/shared/LotMap';
import { ProjectLeadContext, useTrackView } from '@/lib/projectTracking';

// Mapa de lotes con la marca del desarrollador (Fase 3), para insertarlo en su web
// (iframe) o servirlo en su dominio propio. Los contactos entran a su CRM como propios.
// Avisa su altura a la página contenedora para que el iframe crezca sin barras.

interface EmbedInfo {
  slug: string;
  name: string;
  projectName: string;
  mapLat: number | null;
  mapLng: number | null;
  logo: string | null;
  color: string | null;
}

export default function EmbedMapPage({ slug: forcedSlug }: { slug?: string }) {
  const params = useParams();
  const slug = forcedSlug ?? params.slug ?? '';
  const [info, setInfo] = useState<EmbedInfo | null>(null);
  const [error, setError] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useTrackView(info ? slug : undefined, 'view');

  useEffect(() => {
    api.get<EmbedInfo>(`/projects/${slug}/embed`).then(setInfo).catch(() => setError(true));
  }, [slug]);

  // Altura para el iframe contenedor (el código de inserción la escucha).
  useEffect(() => {
    if (!root.current || window.parent === window) return;
    const send = () => window.parent.postMessage({ type: 'g3i-embed-height', slug, height: root.current?.scrollHeight ?? 0 }, '*');
    const ro = new ResizeObserver(send);
    ro.observe(root.current);
    send();
    return () => ro.disconnect();
  }, [slug, info]);

  if (error) return <p className="p-8 text-center text-sm text-brand-gray">Este mapa no está disponible.</p>;
  if (!info) return <p className="p-8 text-center text-sm text-brand-gray">Cargando mapa…</p>;

  // El color de la marca reemplaza el dorado de Grupo 3i en botones y acentos.
  const style = (info.color ? { '--color-secondary': info.color, '--color-accent': info.color } : {}) as CSSProperties;

  return (
    <div ref={root} style={style} className="bg-white">
      <Seo title={`${info.name} — Mapa de lotes`} noindex />
      <header className="flex items-center justify-between gap-3 border-b border-black/5 px-4 py-3">
        {info.logo ? (
          <img src={info.logo} alt={info.name} className="h-9 w-auto max-w-[60%] object-contain" />
        ) : (
          <p className="font-serif text-lg font-bold text-primary">{info.name}</p>
        )}
        <p className="text-right text-xs text-brand-gray">{info.projectName}</p>
      </header>
      <ProjectLeadContext.Provider value={{ slug: info.slug, gated: true, embed: true }}>
        <LotMap projectSlug={info.slug} projectName={info.projectName} mapLat={info.mapLat} mapLng={info.mapLng} />
      </ProjectLeadContext.Provider>
      <footer className="px-4 pb-4 text-center text-[11px] text-brand-gray">
        Mapa interactivo por{' '}
        <a href="https://grupo3i.com/publica-tu-proyecto" target="_blank" rel="noreferrer" className="hover:underline">
          Grupo 3i
        </a>
      </footer>
    </div>
  );
}

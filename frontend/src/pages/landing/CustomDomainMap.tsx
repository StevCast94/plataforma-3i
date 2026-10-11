import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import EmbedMapPage from './EmbedMapPage';

// Dominio propio de un cliente (mapa.sulotizadora.com): busca qué proyecto le
// corresponde y muestra su mapa con marca propia a pantalla completa.
export default function CustomDomainMap() {
  const [slug, setSlug] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    api
      .get<{ slug: string }>(`/projects/by-domain?host=${encodeURIComponent(window.location.hostname)}`)
      .then((r) => setSlug(r.slug))
      .catch(() => setMissing(true));
  }, []);
  if (missing) return <p className="p-8 text-center text-sm text-brand-gray">Este mapa no está disponible.</p>;
  if (!slug) return <p className="p-8 text-center text-sm text-brand-gray">Cargando mapa…</p>;
  return <EmbedMapPage slug={slug} />;
}

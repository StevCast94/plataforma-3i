import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';
import { useSectionContent } from '@/hooks/useSiteContent';
import { isCustomMapHost } from '@/lib/mapHost';
import { captureAttribution, getConsent, hasAnyId, loadPixels, pageView, setConsent, type TrackingIds } from '@/lib/ads';

// Medición de campañas + aviso de cookies. Fuera del panel, del portal de
// desarrolladoras y del mapa insertado en webs de terceros.
const PRIVATE = /^\/(en\/)?(admin|desarrollador|embed)(\/|$)/;

export function Tracking() {
  const { pathname } = useLocation();
  const { t } = useLang();
  const { data } = useSectionContent('tracking');
  const [consent, setC] = useState(getConsent);
  const off = PRIVATE.test(pathname) || isCustomMapHost();
  const ids = (data ?? {}) as TrackingIds;

  useEffect(captureAttribution, []);

  useEffect(() => {
    if (!off && data) loadPixels(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, consent, off]);

  useEffect(() => {
    if (!off) pageView(pathname);
  }, [pathname, off, consent, data]);

  if (off || !data || !hasAnyId(ids) || consent) return null;

  const choose = (v: 'all' | 'necessary') => {
    setConsent(v);
    setC(v);
  };

  return (
    <div role="dialog" aria-label={t('Cookies')} className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-2xl rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/10 print:hidden sm:flex sm:items-center sm:gap-4">
      <p className="text-sm text-primary/80">
        {t('Usamos cookies para medir qué anuncios funcionan y mostrarte proyectos relevantes. Puedes aceptarlas o usar solo las necesarias.')}
      </p>
      <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
        <button onClick={() => choose('necessary')} className="rounded-lg border border-black/15 px-3 py-2 text-sm text-primary hover:bg-light">
          {t('Solo necesarias')}
        </button>
        <button onClick={() => choose('all')} className="rounded-lg bg-secondary px-3 py-2 text-sm font-semibold text-primary">
          {t('Aceptar')}
        </button>
      </div>
    </div>
  );
}

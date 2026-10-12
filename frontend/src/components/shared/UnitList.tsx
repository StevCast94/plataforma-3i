import { useEffect, useMemo, useState } from 'react';
import { BedDouble, Bath, Car, Ruler } from 'lucide-react';
import { api } from '@/lib/api';
import { Link, useLang } from '@/hooks/useLang';
import { formatCurrency } from '@/lib/utils';
import { PROPERTY_TYPES, unitWord } from '@/lib/propertyTypes';
import { STATUS_STYLE, fmtArea } from '@/components/shared/LotMap';
import type { PublicLot } from '@shared/types';

/**
 * Inventario sin plano (casas, departamentos, locales, oficinas…). Las unidades con
 * geometría ya salen en el mapa; aquí van las demás, con filtro por tipo y estado.
 * No pinta nada si el proyecto no tiene unidades de este tipo.
 */
export function UnitList({ projectSlug }: { projectSlug: string }) {
  const { t } = useLang();
  const [units, setUnits] = useState<PublicLot[] | null>(null);
  const [type, setType] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  useEffect(() => {
    api
      .get<PublicLot[]>(`/projects/${projectSlug}/lots`)
      .then((r) => setUnits(r.filter((l) => !l.geometry && l.kind === 'LOT')))
      .catch(() => setUnits([]));
  }, [projectSlug]);

  const types = useMemo(() => PROPERTY_TYPES.filter((p) => units?.some((u) => u.unitType === p.id)), [units]);
  const shown = (units ?? []).filter((u) => (!type || u.unitType === type) && (!onlyAvailable || u.status === 'AVAILABLE'));

  if (!units?.length) return null;
  const available = units.filter((u) => u.status === 'AVAILABLE').length;

  return (
    <section id="inventario" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{t('Inventario')}</p>
          <h2 className="mt-1 font-serif text-3xl font-bold text-primary">{t('Unidades disponibles')}</h2>
          <p className="mt-1 text-sm text-brand-gray">{t('{n} de {total} unidades disponibles', { n: available, total: units.length })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {types.length > 1 && (
            <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm">
              <option value="">{t('Todos los tipos')}</option>
              {types.map((p) => <option key={p.id} value={p.id}>{t(p.label)}</option>)}
            </select>
          )}
          <label className="flex items-center gap-2 text-sm text-primary">
            <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
            {t('Solo disponibles')}
          </label>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((u) => {
          const st = STATUS_STYLE[u.status];
          return (
            <Link
              key={u.id}
              to={`/proyectos/${projectSlug}/lote/${encodeURIComponent(u.code)}`}
              className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:shadow-md"
            >
              {u.images?.[0] && <img src={u.images[0]} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover" />}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-serif text-xl font-bold text-primary">{t(unitWord(u.unitType))} {u.code}</p>
                    {(u.block || u.floor) && (
                      <p className="text-xs text-brand-gray">{[u.block, u.floor ? `${t('Piso')} ${u.floor}` : ''].filter(Boolean).join(' · ')}</p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ background: st.fill }}>{t(st.label)}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-brand-gray">
                  {(u.builtM2 ?? u.areaM2) != null && <span className="inline-flex items-center gap-1"><Ruler className="h-4 w-4" />{fmtArea(u.builtM2 ?? u.areaM2)}</span>}
                  {u.bedrooms != null && <span className="inline-flex items-center gap-1"><BedDouble className="h-4 w-4" />{u.bedrooms}</span>}
                  {u.bathrooms != null && <span className="inline-flex items-center gap-1"><Bath className="h-4 w-4" />{u.bathrooms}</span>}
                  {u.parking != null && <span className="inline-flex items-center gap-1"><Car className="h-4 w-4" />{u.parking}</span>}
                </div>
                {u.price != null && u.status !== 'SOLD' && <p className="mt-3 font-serif text-2xl font-bold text-accent">{formatCurrency(u.price)}</p>}
              </div>
            </Link>
          );
        })}
      </div>
      {shown.length === 0 && <p className="mt-6 text-sm text-brand-gray">{t('No hay unidades con ese filtro.')}</p>}
    </section>
  );
}

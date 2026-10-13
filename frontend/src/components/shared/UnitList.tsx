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
 * geometría ya salen en el mapa; aquí van las demás, agrupadas por torre o etapa y
 * ordenadas por piso, con resumen por tipología y filtros. No pinta nada si no hay.
 */
const floorNum = (f?: string | null) => (f == null || /^pb$/i.test(f) ? 0 : Number.parseFloat(f) || 0);

interface TypologyGroup {
  name: string;
  from: number | null;
  available: number;
  area: number[];
  beds: number | null;
}

export function UnitList({ projectSlug }: { projectSlug: string }) {
  const { t } = useLang();
  const [units, setUnits] = useState<PublicLot[] | null>(null);
  const [type, setType] = useState('');
  const [typology, setTypology] = useState('');
  const [tower, setTower] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  useEffect(() => {
    api
      .get<PublicLot[]>(`/projects/${projectSlug}/lots`)
      .then((r) => setUnits(r.filter((l) => !l.geometry && l.kind === 'LOT')))
      .catch(() => setUnits([]));
  }, [projectSlug]);

  const all = useMemo(() => units ?? [], [units]);
  const types = useMemo(() => PROPERTY_TYPES.filter((p) => all.some((u) => u.unitType === p.id)), [all]);
  const towers = useMemo(() => [...new Set(all.map((u) => u.block).filter(Boolean))] as string[], [all]);
  const typologies = useMemo(() => {
    const m = new Map<string, TypologyGroup>();
    for (const u of all) {
      if (!u.typology) continue;
      const g = m.get(u.typology) ?? { name: u.typology, from: null, available: 0, area: [], beds: u.bedrooms ?? null };
      if (u.status === 'AVAILABLE') {
        g.available++;
        if (u.price != null) g.from = g.from == null ? u.price : Math.min(g.from, u.price);
      }
      const a = u.builtM2 ?? u.areaM2;
      if (a != null) g.area.push(a);
      m.set(u.typology, g);
    }
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [all]);

  if (!all.length) return null;

  const shown = all
    .filter((u) => (!type || u.unitType === type) && (!typology || u.typology === typology) && (!tower || u.block === tower) && (!onlyAvailable || u.status === 'AVAILABLE'))
    .sort(
      (a, b) =>
        (a.block ?? '').localeCompare(b.block ?? '') || floorNum(b.floor) - floorNum(a.floor) || a.code.localeCompare(b.code, undefined, { numeric: true }),
    );
  // Por torre o etapa cuando el proyecto las usa; si no, una sola grilla.
  const byTower = towers.length > 1 || (towers.length === 1 && all.some((u) => u.floor));
  const groups = byTower
    ? [...new Set(shown.map((u) => u.block ?? ''))].map((b) => ({ name: b, items: shown.filter((u) => (u.block ?? '') === b) }))
    : [{ name: '', items: shown }];
  const available = all.filter((u) => u.status === 'AVAILABLE').length;
  const select = 'rounded-lg border border-black/15 bg-white px-3 py-2 text-sm';

  return (
    <section id="inventario" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{t('Inventario')}</p>
          <h2 className="mt-1 font-serif text-3xl font-bold text-primary">{t('Unidades disponibles')}</h2>
          <p className="mt-1 text-sm text-brand-gray">{t('{n} de {total} unidades disponibles', { n: available, total: all.length })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {types.length > 1 && (
            <select value={type} onChange={(e) => setType(e.target.value)} className={select} aria-label={t('Tipo de proyecto')}>
              <option value="">{t('Todos los tipos')}</option>
              {types.map((p) => <option key={p.id} value={p.id}>{t(p.label)}</option>)}
            </select>
          )}
          {towers.length > 1 && (
            <select value={tower} onChange={(e) => setTower(e.target.value)} className={select} aria-label={t('Torre o etapa')}>
              <option value="">{t('Todas las torres y etapas')}</option>
              {towers.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          )}
          <label className="flex items-center gap-2 text-sm text-primary">
            <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
            {t('Solo disponibles')}
          </label>
        </div>
      </div>

      {typologies.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-primary">{t('Tipologías')}</p>
          <div className="mt-2 flex gap-3 overflow-x-auto pb-1">
            {typologies.map((g) => {
              const on = typology === g.name;
              const min = g.area.length ? Math.min(...g.area) : null;
              const max = g.area.length ? Math.max(...g.area) : null;
              const size = min == null ? '' : min === max ? fmtArea(min) : `${Math.round(min)}–${fmtArea(max)}`;
              return (
                <button
                  key={g.name}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setTypology(on ? '' : g.name)}
                  className={`min-w-[11rem] shrink-0 rounded-2xl border p-3 text-left transition ${on ? 'border-primary bg-primary text-white' : 'border-black/10 bg-white hover:shadow-md'}`}
                >
                  <p className="font-serif text-lg font-bold">{g.name}</p>
                  <p className={`text-xs ${on ? 'text-white/80' : 'text-brand-gray'}`}>
                    {[g.beds != null ? t('{n} dorm.', { n: g.beds }) : '', size].filter(Boolean).join(' · ')}
                  </p>
                  <p className={`mt-1 text-sm font-semibold ${on ? 'text-secondary' : 'text-accent'}`}>
                    {g.from != null ? t('Desde {p}', { p: formatCurrency(g.from) }) : t('Sin unidades disponibles')}
                  </p>
                  <p className={`text-xs ${on ? 'text-white/80' : 'text-brand-gray'}`}>{t('{n} disponibles', { n: g.available })}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {groups.map((g) => (
        <div key={g.name || 'all'} className="mt-6">
          {g.name && <h3 className="mb-3 font-serif text-xl font-bold text-primary">{g.name}</h3>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((u) => {
              const st = STATUS_STYLE[u.status];
              const sub = [!g.name ? u.block : '', u.floor ? `${t('Piso')} ${u.floor}` : '', u.typology].filter(Boolean).join(' · ');
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
                        {sub && <p className="text-xs text-brand-gray">{sub}</p>}
                      </div>
                      <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ background: st.fill }}>{t(st.label)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-brand-gray">
                      {(u.builtM2 ?? u.areaM2) != null && <span className="inline-flex items-center gap-1"><Ruler className="h-4 w-4" aria-hidden />{fmtArea(u.builtM2 ?? u.areaM2)}</span>}
                      {u.bedrooms != null && <span className="inline-flex items-center gap-1" title={t('Dormitorios')}><BedDouble className="h-4 w-4" aria-hidden />{u.bedrooms}</span>}
                      {u.bathrooms != null && <span className="inline-flex items-center gap-1" title={t('Baños')}><Bath className="h-4 w-4" aria-hidden />{u.bathrooms}</span>}
                      {u.parking != null && <span className="inline-flex items-center gap-1" title={t('Parqueaderos')}><Car className="h-4 w-4" aria-hidden />{u.parking}</span>}
                    </div>
                    {u.price != null && u.status !== 'SOLD' && <p className="mt-3 font-serif text-2xl font-bold text-accent">{formatCurrency(u.price)}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      {shown.length === 0 && <p className="mt-6 text-sm text-brand-gray">{t('No hay unidades con ese filtro.')}</p>}
    </section>
  );
}

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePanelClient } from '@/lib/panelClient';
import { formatCurrency } from '@/lib/utils';

// Métricas de un proyecto. Se usa en el admin (/admin/proyectos/:id/metricas) y en
// el portal del desarrollador con su propio cliente (mismas rutas sin /admin).
// Cada gráfico es una sola serie: un color (dorado de marca), etiquetas en tinta de texto.

interface Metrics {
  project: { id: string; name: string };
  days: number;
  visitors: number;
  funnel: { step: string; events: number; visitors: number }[];
  leads: { total: number; bySource: { source: string; n: number }[] };
  sales: { total: number; amount: number };
  weekly: { week: string; views: number; leads: number; sales: number }[];
  topLots: { code: string; views: number; whatsapp: number }[];
  devices: { key: string; n: number }[];
  langs: { key: string; n: number }[];
}

const STEP: Record<string, string> = {
  view: 'Vieron el proyecto',
  lot_view: 'Vieron un solar',
  pano_open: 'Abrieron un 360°',
  wa_click: 'Tocaron WhatsApp',
};
const SOURCE: Record<string, string> = { REFERRAL: 'Por referidos', PLATFORM: 'Por la plataforma', DEVELOPER: 'Propios' };
const DEVICE: Record<string, string> = { mobile: 'Celular', desktop: 'Computador' };
const LANG: Record<string, string> = { es: 'Español', en: 'Inglés' };
const RANGES = [7, 30, 90, 365];

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs text-brand-gray">{label}</p>
      <p className="mt-1 font-serif text-2xl font-bold text-primary">{value}</p>
      {hint && <p className="text-xs text-brand-gray">{hint}</p>}
    </div>
  );
}

/** Barras horizontales de una sola serie con el valor a la derecha. */
function HBars({ rows }: { rows: { label: string; value: number; title?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} title={r.title ?? `${r.label}: ${r.value}`} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-brand-gray">{r.label}</span>
          <span className="h-3 rounded-r bg-light">
            <span className="block h-3 rounded-r-[4px] bg-secondary" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="w-12 text-right font-medium tabular-nums text-primary">{r.value.toLocaleString('es-EC')}</span>
        </li>
      ))}
    </ul>
  );
}

/** Columnas semanales de una sola serie, con tooltip por columna. */
function Weekly({ data, field, label }: { data: Metrics['weekly']; field: 'views' | 'leads'; label: string }) {
  const max = Math.max(1, ...data.map((d) => d[field]));
  return (
    <div>
      <div className="flex h-32 items-end gap-[2px] border-b border-black/10">
        {data.map((d) => (
          <div key={d.week} className="group relative flex h-full flex-1 items-end" title={`Semana del ${d.week}: ${d[field]} ${label}`}>
            <div className="w-full rounded-t-[4px] bg-secondary group-hover:bg-accent" style={{ height: `${(d[field] / max) * 100}%`, minHeight: d[field] ? 2 : 0 }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-brand-gray">
        <span>{data[0]?.week}</span>
        <span>máx. {max.toLocaleString('es-EC')} {label}</span>
        <span>{data[data.length - 1]?.week}</span>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">{title}</h2>
      {children}
    </section>
  );
}

export default function ProjectMetricsPage() {
  const { projectId = '' } = useParams();
  const client = usePanelClient();
  const [days, setDays] = useState(30);
  const [m, setM] = useState<Metrics | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    client.get<Metrics>(`/admin/projects/${projectId}/metrics?days=${days}`).then(setM).catch((e) => setError(e.message));
  }, [client, projectId, days]);

  const views = m?.funnel.find((f) => f.step === 'view')?.visitors ?? 0;
  const conv = m && views ? `${((m.leads.total / views) * 100).toFixed(1)} % de los visitantes` : undefined;

  return (
    <div>
      <Link to={client.backTo} className="text-sm text-accent hover:underline">← Proyectos</Link>
      <div className="mb-5 mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-bold text-primary">Métricas · {m?.project.name ?? '…'}</h1>
        <div className="flex gap-1 rounded-xl bg-white p-1 shadow-sm">
          {RANGES.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-lg px-3 py-1.5 text-sm ${days === d ? 'bg-primary text-white' : 'text-brand-gray hover:text-primary'}`}
            >
              {d === 365 ? '1 año' : `${d} días`}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!m ? (
        !error && <p className="text-sm text-brand-gray">Cargando…</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile label="Visitantes únicos" value={m.visitors.toLocaleString('es-EC')} />
            <Tile label="Contactos" value={m.leads.total.toLocaleString('es-EC')} hint={conv} />
            <Tile label="Ventas declaradas" value={String(m.sales.total)} />
            <Tile label="Monto vendido" value={formatCurrency(m.sales.amount)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Embudo (visitantes únicos)">
              <HBars
                rows={[
                  ...m.funnel.map((f) => ({ label: STEP[f.step] ?? f.step, value: f.visitors, title: `${f.visitors} visitantes · ${f.events} veces` })),
                  { label: 'Dejaron sus datos', value: m.leads.total },
                  { label: 'Compraron', value: m.sales.total },
                ]}
              />
            </Card>
            <Card title="Origen de los contactos">
              <HBars rows={m.leads.bySource.map((s) => ({ label: SOURCE[s.source] ?? s.source, value: s.n }))} />
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Visitas por semana">
              <Weekly data={m.weekly} field="views" label="visitas" />
            </Card>
            <Card title="Contactos por semana">
              <Weekly data={m.weekly} field="leads" label="contactos" />
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="Solares con más interés">
              {m.topLots.length === 0 ? (
                <p className="text-sm text-brand-gray">Aún sin datos.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-xs text-brand-gray">
                    <tr>
                      <th className="pb-2 text-left font-normal">Solar</th>
                      <th className="pb-2 text-right font-normal">Vistas</th>
                      <th className="pb-2 text-right font-normal">WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.topLots.map((l) => (
                      <tr key={l.code} className="border-t border-black/5">
                        <td className="py-1.5 font-medium text-primary">{l.code}</td>
                        <td className="py-1.5 text-right tabular-nums">{l.views}</td>
                        <td className="py-1.5 text-right tabular-nums">{l.whatsapp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
            <Card title="Dispositivo">
              <HBars rows={m.devices.map((d) => ({ label: DEVICE[d.key] ?? d.key, value: d.n }))} />
            </Card>
            <Card title="Idioma">
              <HBars rows={m.langs.map((d) => ({ label: LANG[d.key.slice(0, 2)] ?? d.key, value: d.n }))} />
            </Card>
          </div>
          <p className="text-xs text-brand-gray">Las métricas se registran desde el 10 de octubre de 2026. No incluyen robots ni vistas previas de enlaces.</p>
        </div>
      )}
    </div>
  );
}

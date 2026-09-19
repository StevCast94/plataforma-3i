import { useMemo, useState } from 'react';
import {
  APT_ASSUMPTIONS,
  APT_M2,
  DISCOUNT,
  MV_SOURCES,
  SCENARIOS,
  STAGE_BASE,
  npvProfile,
  stageModel,
  type Scenario,
} from '@/lib/mvStudy';
import { formatCurrency } from '@/lib/utils';

// Estudio de factibilidad 2026 de las etapas de apartamentos del Lobby.
// Todas las cifras y gráficas se calculan en vivo desde lib/mvStudy.ts.

const COLORS = ['#c9a96e', '#1f3a5f', '#6b8f71'];
const pct = (n: number | null) => (n == null ? '—' : `${(n * 100).toFixed(1)}%`);
const money = (n: number) => formatCurrency(Math.round(n));
const short = (n: number) => `${n < 0 ? '−' : ''}$${(Math.abs(n) / 1e6).toFixed(1)}M`;

export function MvStudy() {
  const [sc, setSc] = useState<Scenario>('base');
  const all = useMemo(
    () => Object.fromEntries(SCENARIOS.map((s) => [s, STAGE_BASE.map((st) => stageModel(st, s))])) as Record<Scenario, ReturnType<typeof stageModel>[]>,
    [],
  );
  const stages = all[sc];
  const a = APT_ASSUMPTIONS[sc];
  const tot = stages.reduce(
    (acc, s) => ({ revenue: acc.revenue + s.revenue, cost: acc.cost + s.cost, npv: acc.npv + s.npv }),
    { revenue: 0, cost: 0, npv: 0 },
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-brand-gray">Escenario</p>
        <div className="inline-flex rounded-full bg-light p-1 ring-1 ring-black/10">
          {SCENARIOS.map((s) => (
            <button
              key={s}
              onClick={() => setSc(s)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${sc === s ? 'bg-primary text-white' : 'text-primary/70 hover:text-primary'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Kpi l="Ventas totales" v={short(tot.revenue)} />
        <Kpi l="Costo total" v={short(tot.cost)} />
        <Kpi l="Margen" v={pct((tot.revenue - tot.cost) / tot.revenue)} />
        <Kpi l={`VAN al ${Math.round(DISCOUNT * 100)}%`} v={short(tot.npv)} />
      </div>

      <div className="overflow-x-auto rounded-xl ring-1 ring-black/5">
        <table className="w-full text-left text-sm">
          <thead className="bg-primary/5 text-primary">
            <tr>
              {['Etapa', 'Aptos', 'Precio por apto', 'Ventas', 'Costo', 'Margen', 'VAN', 'TIR', 'Capital máximo'].map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-2 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stages.map((s) => (
              <tr key={s.name} className="border-t border-black/5">
                <td className="px-3 py-2 font-semibold">{s.name}</td>
                <td className="px-3 py-2">{s.units}</td>
                <td className="px-3 py-2">{money(s.unitPrice)}</td>
                <td className="px-3 py-2">{money(s.revenue)}</td>
                <td className="px-3 py-2">{money(s.cost)}</td>
                <td className="px-3 py-2">{pct(s.margin)}</td>
                <td className="px-3 py-2">{money(s.npv)}</td>
                <td className="px-3 py-2">{pct(s.irr)}</td>
                <td className="px-3 py-2">{money(s.peakEquity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-brand-gray">
        La TIR es alta porque la entrada del 30% de las ventas en planos financia parte de la obra; los
        indicadores principales son el margen y el VAN. Capital máximo: aporte acumulado más alto que
        requiere cada etapa antes de recuperarse.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Flujo de caja acumulado por etapa (trimestres)">
          <LineChart
            series={stages.map((s, i) => ({ name: s.name, color: COLORS[i], points: cumulative(s.flows) }))}
            xLabel={(x) => `T${x}`}
          />
        </ChartCard>
        <ChartCard title="Perfil del VAN según tasa de descuento">
          <LineChart
            series={stages.map((s, i) => ({
              name: s.name,
              color: COLORS[i],
              points: npvProfile(s.flows, 4).map((p) => p.npv),
            }))}
            xLabel={(x) => `${[0, 5, 10, 14, 20, 25, 30][x]}%`}
          />
        </ChartCard>
      </div>

      <ChartCard title="Sensibilidad: VAN total de las tres etapas">
        <SensitivityTable />
      </ChartCard>

      <div>
        <h4 className="font-semibold text-primary">Supuestos del escenario {sc}</h4>
        <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <Assumption l="Precio de venta" v={`$${a.price.toLocaleString('en-US')} / m² (${money(a.price * APT_M2)} por apto de ${APT_M2} m²)`} src={[MV_SOURCES.plusvalia, MV_SOURCES.mls]} />
          <Assumption l="Costo de construcción" v={`$${a.cost} / m²`} src={[MV_SOURCES.costo]} />
          <Assumption l="Ritmo de ventas" v={`${a.unitsPerQuarter} apartamentos por trimestre`} src={[MV_SOURCES.plusvalia]} />
          <Assumption l="Tasa de descuento" v={`${Math.round(DISCOUNT * 100)}% anual (bono EE.UU. + riesgo país + prima del proyecto)`} src={[MV_SOURCES.riesgo]} />
          <Assumption l="Estudios, diseño, permisos y complementarios" v="Montos del informe original actualizados +20% por inflación de construcción 2020–2026" src={[MV_SOURCES.costo]} />
          <Assumption l="Forma de pago del comprador" v="30% de entrada al reservar y 70% a la entrega; obra de 6 trimestres" src={[]} />
        </div>
      </div>
    </div>
  );
}

function cumulative(flows: number[]) {
  let acc = 0;
  return flows.map((f) => (acc += f));
}

function SensitivityTable() {
  const prices = [1_300, 1_450, 1_650];
  const costs = [950, 850, 760];
  const npvAt = (price: number, cost: number) => {
    const saved = { ...APT_ASSUMPTIONS.base };
    APT_ASSUMPTIONS.base = { ...saved, price, cost };
    const v = STAGE_BASE.reduce((acc, st) => acc + stageModel(st, 'base').npv, 0);
    APT_ASSUMPTIONS.base = saved;
    return v;
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-center text-sm">
        <thead>
          <tr>
            <th className="px-2 py-2 text-left text-xs font-medium text-brand-gray">Costo ↓ / Precio de venta →</th>
            {prices.map((p) => <th key={p} className="px-2 py-2 font-semibold text-primary">${p.toLocaleString('en-US')}/m²</th>)}
          </tr>
        </thead>
        <tbody>
          {costs.map((c) => (
            <tr key={c} className="border-t border-black/5">
              <td className="px-2 py-2 text-left font-semibold text-primary">${c}/m²</td>
              {prices.map((p) => {
                const v = npvAt(p, c);
                return (
                  <td key={p} className={`px-2 py-2 font-medium ${v >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {short(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-brand-gray">Ritmo de ventas del escenario base (3 aptos por trimestre).</p>
    </div>
  );
}

function LineChart({ series, xLabel }: { series: { name: string; color: string; points: number[] }[]; xLabel: (i: number) => string }) {
  const W = 520, H = 240, P = { l: 56, r: 10, t: 10, b: 28 };
  const n = Math.max(...series.map((s) => s.points.length));
  const vals = series.flatMap((s) => s.points).concat(0);
  const min = Math.min(...vals), max = Math.max(...vals);
  const x = (i: number) => P.l + (i / Math.max(1, n - 1)) * (W - P.l - P.r);
  const y = (v: number) => P.t + ((max - v) / (max - min || 1)) * (H - P.t - P.b);
  const ticks = [min, (min + max) / 2, max];
  const step = Math.ceil(n / 8);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="currentColor" className="text-black/10" />
            <text x={P.l - 6} y={y(t) + 4} textAnchor="end" className="fill-current text-[10px] text-brand-gray">{short(t)}</text>
          </g>
        ))}
        <line x1={P.l} x2={W - P.r} y1={y(0)} y2={y(0)} stroke="currentColor" className="text-black/40" />
        {Array.from({ length: n }, (_, i) => i).filter((i) => i % step === 0).map((i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="fill-current text-[10px] text-brand-gray">{xLabel(i)}</text>
        ))}
        {series.map((s) => (
          <g key={s.name}>
            <polyline fill="none" stroke={s.color} strokeWidth={2.5} points={s.points.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
            {s.points.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={2.5} fill={s.color} />)}
          </g>
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap gap-4 text-xs">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-1.5"><span className="h-2 w-4 rounded" style={{ background: s.color }} />{s.name}</span>
        ))}
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-black/5">
      <p className="mb-2 text-sm font-semibold text-primary">{title}</p>
      {children}
    </div>
  );
}

function Kpi({ l, v }: { l: string; v: string }) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-black/5">
      <p className="text-xs text-brand-gray">{l}</p>
      <p className="mt-1 font-serif text-2xl font-bold text-primary">{v}</p>
    </div>
  );
}

function Assumption({ l, v, src }: { l: string; v: string; src: { label: string; url: string }[] }) {
  return (
    <div className="rounded-lg bg-white p-3 ring-1 ring-black/5">
      <p className="text-xs text-brand-gray">{l}</p>
      <p className="font-medium text-primary">{v}</p>
      {src.length > 0 && (
        <p className="mt-1 text-[11px] text-brand-gray">
          Fuente:{' '}
          {src.map((s, i) => (
            <span key={s.url}>{i > 0 && ' · '}<a className="underline" href={s.url} target="_blank" rel="noreferrer">{s.label}</a></span>
          ))}
        </p>
      )}
    </div>
  );
}

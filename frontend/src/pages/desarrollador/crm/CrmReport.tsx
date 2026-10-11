import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { useCrmClient } from '@/lib/crmClient';
import { LEAD_STATUS_LABEL, type LeadStatus } from '@/lib/developerApi';

// Reportes del CRM: primera respuesta, conversión por etapa, motivos de pérdida y
// desempeño por vendedor. Cada gráfico es una sola serie (dorado de marca).

interface Report {
  days: number;
  total: number;
  firstResponseMedianHours: number | null;
  contactedWithin24h: number;
  neverContacted: number;
  funnel: { stage: LeadStatus; n: number }[];
  lostReasons: { reason: string; n: number }[];
  sellers: { name: string; leads: number; contacted24: number; won: number; amount: number; medianHours: number | null }[];
}

const RANGES = [7, 30, 90, 365];
const hours = (h: number | null) => (h == null ? '—' : h < 1 ? `${Math.round(h * 60)} min` : `${h} h`);
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : '—');

function Bars({ rows }: { rows: { label: string; value: number; note?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} title={`${r.label}: ${r.value}`} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-brand-gray">{r.label}</span>
          <span className="h-3 rounded-r bg-light">
            <span className="block h-3 rounded-r-[4px] bg-secondary" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="w-20 text-right tabular-nums text-primary">
            {r.value}
            {r.note && <span className="ml-1 text-xs text-brand-gray">{r.note}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function CrmReport({ projectId }: { projectId: string }) {
  const crm = useCrmClient();
  const [days, setDays] = useState(30);
  const [r, setR] = useState<Report | null>(null);

  useEffect(() => {
    setR(null);
    crm.get<Report>(`/crm/report?days=${days}${projectId ? `&projectId=${projectId}` : ''}`).then(setR).catch(() => {});
  }, [crm, days, projectId]);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 self-start rounded-xl bg-white p-1 shadow-sm">
        {RANGES.map((d) => (
          <button key={d} onClick={() => setDays(d)} className={`rounded-lg px-3 py-1.5 text-sm ${days === d ? 'bg-primary text-white' : 'text-brand-gray hover:text-primary'}`}>
            {d === 365 ? '1 año' : `${d} días`}
          </button>
        ))}
      </div>
      {!r ? (
        <p className="text-sm text-brand-gray">Cargando…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ['Contactos nuevos', String(r.total)],
              ['Primera respuesta (mediana)', hours(r.firstResponseMedianHours)],
              ['Atendidos en 24 h', pct(r.contactedWithin24h, r.total)],
              ['Sin atender en 24 h', String(r.neverContacted)],
            ].map(([l, v]) => (
              <div key={l} className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs text-brand-gray">{l}</p>
                <p className="mt-1 font-serif text-2xl font-bold text-primary">{v}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">Conversión por etapa</h3>
              <Bars
                rows={r.funnel.map((f) => ({ label: LEAD_STATUS_LABEL[f.stage], value: f.n, note: f.stage === 'NEW' ? undefined : pct(f.n, r.total) }))}
              />
            </section>
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">Motivos de pérdida</h3>
              {r.lostReasons.length ? (
                <Bars rows={r.lostReasons.map((l) => ({ label: l.reason, value: l.n }))} />
              ) : (
                <p className="text-sm text-brand-gray">Sin contactos perdidos en el período.</p>
              )}
            </section>
          </div>
          <section className="overflow-x-auto rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">Desempeño por vendedor</h3>
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-brand-gray">
                <tr>
                  <th className="pb-2 font-normal">Vendedor</th>
                  <th className="pb-2 text-right font-normal">Contactos</th>
                  <th className="pb-2 text-right font-normal">Atendidos en 24 h</th>
                  <th className="pb-2 text-right font-normal">Primera respuesta</th>
                  <th className="pb-2 text-right font-normal">Ventas</th>
                  <th className="pb-2 text-right font-normal">Monto</th>
                </tr>
              </thead>
              <tbody>
                {r.sellers.map((s) => (
                  <tr key={s.name} className="border-t border-black/5">
                    <td className="py-2 font-medium text-primary">{s.name}</td>
                    <td className="py-2 text-right tabular-nums">{s.leads}</td>
                    <td className="py-2 text-right tabular-nums">{pct(s.contacted24, s.leads)}</td>
                    <td className="py-2 text-right tabular-nums">{hours(s.medianHours)}</td>
                    <td className="py-2 text-right tabular-nums">{s.won}</td>
                    <td className="py-2 text-right tabular-nums">{formatCurrency(s.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}

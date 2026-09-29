import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { BOSQUE_NAME, bosqueGet, fechaLarga, money } from '@/lib/bosque';

interface Transparency {
  income: number;
  treesCommitted: number;
  spent: number;
  balance: number;
  byCategory: { category: string; label: string; amount: number }[];
  expenses: { id: string; date: string; label: string; description: string; amount: number; receiptUrl: string | null }[];
  trees: { total: number; planted: number; lost: number; adopted: number; survival: number | null };
}

/** Cuentas claras: cuánto entra, en qué se gasta y cómo van los árboles. Se actualiza sola. */
export default function BosqueTransparencyPage() {
  const [d, setD] = useState<Transparency | null>(null);

  useEffect(() => {
    bosqueGet<Transparency>('/transparency').then(setD).catch(() => {});
  }, []);

  const maxCat = Math.max(1, ...(d?.byCategory.map((c) => c.amount) ?? [1]));

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <Helmet>
        <title>{`Cuentas claras · ${BOSQUE_NAME}`}</title>
      </Helmet>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-bosque/70">Transparencia</p>
      <h1 className="mt-2 font-bosque text-5xl font-semibold text-bosque">Cuentas claras</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-bosque-dark/80">
        Cada dólar de las adopciones se destina al bosque. Aquí ves lo recaudado, en qué se gasta y cómo van los árboles.
        Esta página se actualiza sola con cada registro de la gestora.
      </p>

      {d && (
        <>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              ['Recaudado por adopciones', money(d.income), `${d.treesCommitted} árboles adoptados`],
              ['Invertido en el bosque', money(d.spent), `${d.expenses.length} gastos registrados`],
              ['Saldo para cuidado futuro', money(d.balance), 'Reservado para los 3 años de cuidado'],
            ].map(([label, value, note]) => (
              <div key={label} className="rounded-2xl bg-white p-6">
                <p className="text-sm text-bosque-dark/70">{label}</p>
                <p className="mt-2 font-bosque text-4xl font-semibold tabular-nums text-bosque">{value}</p>
                <p className="mt-1 text-xs text-bosque-dark/60">{note}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-14 font-bosque text-3xl font-semibold text-bosque">Los árboles</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ['En el plano de siembra', d.trees.total],
              ['Con padrino', d.trees.adopted],
              ['Sembrados', d.trees.planted],
              ['Supervivencia', d.trees.survival == null ? '—' : `${d.trees.survival}%`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-bosque/10 p-5">
                <p className="text-xs text-bosque-dark/60">{label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
              </div>
            ))}
          </div>
          {d.trees.lost > 0 && (
            <p className="mt-3 text-sm text-bosque-dark/70">
              {d.trees.lost} árboles no prosperaron y se reponen sin costo para sus padrinos.
            </p>
          )}

          <h2 className="mt-14 font-bosque text-3xl font-semibold text-bosque">En qué se invierte</h2>
          {d.byCategory.length === 0 ? (
            <p className="mt-4 text-bosque-dark/70">Todavía no hay gastos registrados. El primero será el montaje del vivero.</p>
          ) : (
            <div className="mt-6 space-y-3">
              {d.byCategory.map((c) => (
                <div key={c.category} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm">
                  <span>{c.label}</span>
                  <div className="h-3 overflow-hidden rounded-full bg-bosque/10">
                    <div className="h-full rounded-full bg-bosque" style={{ width: `${(c.amount / maxCat) * 100}%` }} />
                  </div>
                  <span className="tabular-nums">{money(c.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {d.expenses.length > 0 && (
            <div className="mt-10 overflow-x-auto rounded-2xl bg-white">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-bosque-dark/60">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Rubro</th>
                    <th className="px-4 py-3">Detalle</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {d.expenses.map((e) => (
                    <tr key={e.id} className="border-t border-bosque/10">
                      <td className="whitespace-nowrap px-4 py-3">{fechaLarga(e.date)}</td>
                      <td className="px-4 py-3">{e.label}</td>
                      <td className="px-4 py-3">
                        {e.description}
                        {e.receiptUrl && (
                          <a href={e.receiptUrl} target="_blank" rel="noreferrer" className="ml-2 text-bosque underline">
                            comprobante
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{money(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

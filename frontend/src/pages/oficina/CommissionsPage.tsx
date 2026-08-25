import { useState } from 'react';
import { Seo } from '@/components/shared/Seo';
import { Modal } from '@/components/ui/Modal';
import { CommissionRow } from '@/components/oficina/CommissionRow';
import { useCommissions, useCommissionSummary } from '@/hooks/useCommissions';
import { formatCurrency } from '@/lib/utils';
import { COMMISSION_BADGE } from '@/lib/referral';
import type { Commission, CommissionStatus } from '@shared/types';

const TIMELINE: CommissionStatus[] = ['PENDING', 'CONFIRMED', 'LIQUIDATED', 'PAID'];

export default function CommissionsPage() {
  const { data: commissions, loading } = useCommissions();
  const { data: summary } = useCommissionSummary();
  const [selected, setSelected] = useState<Commission | null>(null);
  const [filter, setFilter] = useState<string>('ALL');

  const rows = (commissions ?? []).filter((c) =>
    filter === 'ALL' ? true : c.status === filter,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Seo title="Comisiones — Oficina Virtual" />
      <h1 className="text-3xl font-bold text-primary">Comisiones</h1>

      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Box label="Total ganado" value={formatCurrency(summary?.totalEarned ?? 0)} />
        <Box label="Pendiente" value={formatCurrency(summary?.pending ?? 0)} />
        <Box label="Disponible" value={formatCurrency(summary?.available ?? 0)} />
        <Box label="Este mes" value={formatCurrency(summary?.thisMonth ?? 0)} />
      </div>

      {/* Tope mensual (solo Premiere; Elite es ilimitado) */}
      {summary?.monthlyLimit != null && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-brand-gray">Tope mensual de comisiones</span>
            <span className="font-medium text-primary">
              {formatCurrency(summary.thisMonth)} / {formatCurrency(summary.monthlyLimit)}
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-light">
            <div
              className="h-full rounded-full bg-secondary transition-all"
              style={{ width: `${Math.min((summary.thisMonth / summary.monthlyLimit) * 100, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-brand-gray">
            Te quedan <strong className="text-primary">{formatCurrency(summary.monthlyRemaining ?? 0)}</strong> este mes.
            Asciende a Elite para comisiones ilimitadas.
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {['ALL', ...TIMELINE, 'REVERSED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filter === f ? 'bg-primary text-white' : 'bg-light text-brand-gray hover:text-primary'
            }`}
          >
            {f === 'ALL' ? 'Todas' : COMMISSION_BADGE[f as CommissionStatus].label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-black/5 text-xs uppercase tracking-wider text-brand-gray">
              {/* En móvil solo caben 4 columnas (7 medían 580px en una pantalla
                  de 343px y las últimas quedaban fuera de vista). Producto,
                  Nivel y Tasa se ocultan ahí: la fila abre el modal de detalle,
                  que las muestra todas. */}
              <th className="px-2 py-3 sm:px-4">Fecha</th>
              <th className="px-2 py-3 sm:px-4">Referido</th>
              <th className="hidden px-2 py-3 sm:table-cell sm:px-4">Producto</th>
              <th className="hidden px-2 py-3 sm:table-cell sm:px-4">Nivel</th>
              <th className="px-2 py-3 sm:px-4">Monto</th>
              <th className="hidden px-2 py-3 sm:table-cell sm:px-4">Tasa</th>
              <th className="px-2 py-3 sm:px-4">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-brand-gray">Cargando…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-brand-gray">Sin comisiones.</td></tr>
            )}
            {rows.map((c) => (
              <CommissionRow key={c.id} commission={c} onClick={() => setSelected(c)} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Detalle */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalle de comisión">
        {selected && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Monto" value={formatCurrency(selected.amount)} />
              <Detail
                label="Tipo / Tasa"
                value={selected.type === 'fixed' ? 'Fijo' : `${(selected.rate * 100).toFixed(0)}%`}
              />
              <Detail
                label="Referido"
                value={selected.referral?.referred.fullName ?? selected.purchase?.customerName ?? '—'}
              />
              <Detail label="Producto" value={selected.product?.name ?? '—'} />
              <Detail label="Nivel" value={`Nivel ${selected.level}`} />
              <Detail
                label="Disponible"
                value={selected.holdUntil ? new Date(selected.holdUntil).toLocaleDateString('es-EC') : '—'}
              />
            </dl>

            {/* Timeline */}
            <div className="rounded-xl bg-light p-4">
              <p className="mb-3 text-xs uppercase tracking-wider text-brand-gray">Estado</p>
              <ol className="flex items-center justify-between">
                {TIMELINE.map((s, i) => {
                  const reached =
                    selected.status === 'REVERSED'
                      ? false
                      : TIMELINE.indexOf(selected.status as CommissionStatus) >= i;
                  return (
                    <li key={s} className="flex flex-1 flex-col items-center">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          reached ? 'bg-secondary text-primary' : 'bg-white text-brand-gray ring-1 ring-black/10'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="mt-1 text-[10px] text-brand-gray">
                        {COMMISSION_BADGE[s].label}
                      </span>
                    </li>
                  );
                })}
              </ol>
              {selected.status === 'REVERSED' && (
                <p className="mt-3 text-center text-sm text-red-600">
                  Esta comisión fue reversada por una devolución.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-xs uppercase tracking-wider text-brand-gray">{label}</p>
      <p className="mt-1.5 font-serif text-xl font-bold text-primary">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-brand-gray">{label}</dt>
      <dd className="mt-0.5 font-medium text-primary">{value}</dd>
    </div>
  );
}

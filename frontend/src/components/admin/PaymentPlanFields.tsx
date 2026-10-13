import type { PaymentPlan } from '@/lib/lotFinance';

/** Plan de pagos del proyecto. `null` = sin financiamiento publicado (solo se muestra el precio). */
export function PaymentPlanFields({ value, onChange }: { value: PaymentPlan | null; onChange: (v: PaymentPlan | null) => void }) {
  const p = value ?? { downPct: 30, installments: 24, interestFree: true };
  const input = 'w-full rounded-lg border border-black/15 px-3 py-2 text-sm';
  return (
    <fieldset className="rounded-lg bg-light p-3">
      <legend className="sr-only">Plan de pagos</legend>
      <label className="flex items-center gap-2 text-sm font-medium text-primary">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked ? p : null)} />
        Mostrar financiamiento directo en las fichas
      </label>
      {value && (
        <div className="mt-3 grid grid-cols-3 gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-brand-gray">Entrada %</span>
            <input type="number" min={0} max={100} className={input} value={value.downPct} onChange={(e) => onChange({ ...value, downPct: Number(e.target.value) })} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-brand-gray">N.º de cuotas</span>
            <input type="number" min={1} max={240} className={input} value={value.installments} onChange={(e) => onChange({ ...value, installments: Number(e.target.value) })} />
          </label>
          <label className="mt-6 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={value.interestFree} onChange={(e) => onChange({ ...value, interestFree: e.target.checked })} />
            Sin intereses
          </label>
        </div>
      )}
      <p className="mt-2 text-xs text-brand-gray">Sin marcar, las fichas muestran solo el precio.</p>
    </fieldset>
  );
}

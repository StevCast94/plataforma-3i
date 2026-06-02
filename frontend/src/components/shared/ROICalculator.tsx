import { useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/utils';

interface ROICalculatorProps {
  /** Precio mínimo de entrada / por fracción. */
  fractionPrice: number;
  /** Retorno anual estimado (porcentaje). Placeholder por defecto. */
  annualReturnPct?: number;
  /** Tope del slider. */
  max?: number;
}

export function ROICalculator({
  fractionPrice,
  annualReturnPct = 9,
  max,
}: ROICalculatorProps) {
  const minAmount = Math.max(fractionPrice, 1000);
  const maxAmount = max ?? Math.max(minAmount * 10, 50000);
  const [amount, setAmount] = useState(minAmount);

  const { fractions, annualGain, fiveYearGain } = useMemo(() => {
    const fr = fractionPrice > 0 ? amount / fractionPrice : 0;
    const annual = amount * (annualReturnPct / 100);
    return {
      fractions: fr,
      annualGain: annual,
      fiveYearGain: annual * 5,
    };
  }, [amount, fractionPrice, annualReturnPct]);

  return (
    <section className="bg-primary text-white">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">
          Calculadora de inversión
        </h2>
        <p className="mt-2 text-center text-white/70">
          Estima tu retorno. Cifras referenciales, no constituyen garantía.
        </p>

        <div className="mt-10 rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 sm:p-10">
          <label className="block">
            <div className="flex items-baseline justify-between">
              <span className="text-sm uppercase tracking-wider text-white/60">
                Monto a invertir
              </span>
              <span className="font-serif text-3xl font-bold text-secondary">
                {formatCurrency(amount)}
              </span>
            </div>
            <input
              type="range"
              min={minAmount}
              max={maxAmount}
              step={Math.max(Math.round(fractionPrice / 2), 500)}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-4 w-full cursor-pointer accent-[var(--color-secondary)]"
            />
            <div className="mt-1 flex justify-between text-xs text-white/40">
              <span>{formatCurrency(minAmount)}</span>
              <span>{formatCurrency(maxAmount)}</span>
            </div>
          </label>

          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            <Stat
              label="Fracciones"
              value={fractions.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            />
            <Stat
              label={`Retorno anual (${annualReturnPct}%)`}
              value={formatCurrency(annualGain)}
            />
            <Stat label="Proyección 5 años" value={formatCurrency(fiveYearGain)} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-5 text-center">
      <p className="font-serif text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-white/60">{label}</p>
    </div>
  );
}

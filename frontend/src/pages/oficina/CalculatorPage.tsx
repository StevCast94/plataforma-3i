import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Seo } from '@/components/shared/Seo';
import { Button } from '@/components/ui/Button';
import { estimateMonthly } from '@/lib/referral';
import { formatCurrency } from '@/lib/utils';

export default function CalculatorPage() {
  const [memberships, setMemberships] = useState(3);
  const [properties, setProperties] = useState(1);
  const [avgPrice, setAvgPrice] = useState(15000);

  const premiere = estimateMonthly('PREMIERE', memberships, properties, avgPrice);
  const elite = estimateMonthly('ELITE', memberships, properties, avgPrice);
  const diff = elite - premiere;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Seo title="Calculadora — Oficina Virtual" />
      <h1 className="text-3xl font-bold text-primary">Simulador de ganancias</h1>
      <p className="text-brand-gray">
        Estima cuánto puedes ganar como Premiere vs. Elite. Cifras referenciales.
      </p>

      <div className="space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <Slider
          label="Membresías de viajes que vendes al mes"
          value={memberships}
          min={0}
          max={20}
          step={1}
          onChange={setMemberships}
          display={`${memberships}`}
        />
        <Slider
          label="Propiedades fraccionadas al mes"
          value={properties}
          min={0}
          max={10}
          step={1}
          onChange={setProperties}
          display={`${properties}`}
        />
        <Slider
          label="Precio promedio por propiedad"
          value={avgPrice}
          min={5000}
          max={50000}
          step={1000}
          onChange={setAvgPrice}
          display={formatCurrency(avgPrice)}
        />
      </div>

      {/* Resultados */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl bg-blue-50 p-6 text-center ring-1 ring-blue-100">
          <p className="text-sm uppercase tracking-wider text-blue-700">Como Premiere</p>
          <p className="mt-2 font-serif text-3xl font-bold text-blue-700">
            {formatCurrency(premiere)}<span className="text-base">/mes</span>
          </p>
        </div>
        <motion.div
          key={elite}
          initial={{ scale: 0.97 }}
          animate={{ scale: 1 }}
          className="rounded-2xl bg-primary p-6 text-center text-white ring-2 ring-secondary"
        >
          <p className="text-sm uppercase tracking-wider text-secondary">Como Elite</p>
          <p className="mt-2 font-serif text-4xl font-bold text-secondary">
            {formatCurrency(elite)}<span className="text-base">/mes</span>
          </p>
        </motion.div>
      </div>

      <div className="rounded-2xl bg-secondary/15 p-6 text-center">
        <p className="text-primary">
          Ganarías <strong className="text-accent">{formatCurrency(diff)} más al mes</strong> como Elite.
        </p>
        <Link to="/oficina/herramientas" className="mt-4 inline-block">
          <Button>Conviértete en Elite</Button>
        </Link>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-primary">{label}</span>
        <span className="font-serif text-xl font-bold text-accent">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full cursor-pointer accent-[var(--color-secondary)]"
      />
    </label>
  );
}

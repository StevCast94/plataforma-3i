interface StatsCardProps {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}

export function StatsCard({ label, value, hint, accent }: StatsCardProps) {
  return (
    <div
      className={`rounded-xl p-5 shadow-sm ring-1 ring-black/5 ${
        accent ? 'bg-primary text-white' : 'bg-white'
      }`}
    >
      <p className={`text-xs uppercase tracking-wider ${accent ? 'text-white/60' : 'text-brand-gray'}`}>
        {label}
      </p>
      <p className={`mt-2 font-serif text-2xl font-bold ${accent ? 'text-secondary' : 'text-primary'}`}>
        {value}
      </p>
      {hint && <p className={`mt-1 text-xs ${accent ? 'text-white/50' : 'text-brand-gray'}`}>{hint}</p>}
    </div>
  );
}

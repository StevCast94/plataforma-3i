import { Badge } from '@/components/ui/Badge';
import { AmenityIcon } from '@/lib/amenityIcons';
import type { ProjectFeatures } from '@shared/types';

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
      <p className="font-serif text-3xl font-bold text-accent">{value}</p>
      <p className="mt-1 text-sm uppercase tracking-wider text-brand-gray">{label}</p>
    </div>
  );
}

export function FeatureGrid({ features }: { features?: ProjectFeatures | null }) {
  if (!features) return null;
  const { tipo, unidades, bedrooms, bathrooms, m2, amenities } = features;

  const stats: { value: string; label: string }[] = [];
  if (unidades != null) stats.push({ value: String(unidades), label: 'Unidades' });
  if (bedrooms != null) stats.push({ value: String(bedrooms), label: 'Dormitorios' });
  if (bathrooms != null) stats.push({ value: String(bathrooms), label: 'Baños' });
  if (m2 != null) stats.push({ value: `${m2} m²`, label: 'Área' });

  const hasContent = tipo || stats.length > 0 || (amenities && amenities.length > 0);
  if (!hasContent) return null;

  return (
    <section className="bg-light">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {tipo && (
          <div className="mb-8 text-center">
            <Badge variant="dark">{tipo}</Badge>
          </div>
        )}

        {stats.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <StatCard key={s.label} value={s.value} label={s.label} />
            ))}
          </div>
        )}

        {amenities && amenities.length > 0 && (
          <div className="mt-12">
            <h3 className="mb-6 text-center text-2xl text-primary">Amenidades</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {amenities.map((a) => (
                <div
                  key={a}
                  className="flex items-center gap-2.5 rounded-full bg-white px-4 py-2.5 shadow-sm ring-1 ring-black/5"
                >
                  <AmenityIcon name={a} className="h-4 w-4 flex-none text-accent" />
                  <span className="text-sm font-medium text-primary">{a}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

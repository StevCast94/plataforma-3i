import { Badge } from '@/components/ui/Badge';
import { AmenityIcon } from '@/lib/amenityIcons';
import type { ProjectFeatures } from '@shared/types';

export function FeatureGrid({ features }: { features?: ProjectFeatures | null }) {
  if (!features) return null;
  const { tipo, amenities } = features;

  const hasContent = tipo || (amenities && amenities.length > 0);
  if (!hasContent) return null;

  return (
    <section className="bg-light">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {tipo && (
          <div className="mb-8 text-center">
            <Badge variant="dark">{tipo}</Badge>
          </div>
        )}

        {amenities && amenities.length > 0 && (
          <div className={tipo ? 'mt-12' : ''}>
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

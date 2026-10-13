import { Map, Stamp, Store, Megaphone, Sprout } from 'lucide-react';
import { SERVICE_AREAS, type ServiceArea } from '@/lib/services';

const ICONS: Record<ServiceArea['icon'], typeof Map> = { map: Map, stamp: Stamp, store: Store, megaphone: Megaphone, sprout: Sprout };

/** Las cinco áreas de servicios integrales. `dark` para láminas oscuras de la propuesta. */
export function ServicesGrid({ lang, dark = false, compact = false }: { lang: 'es' | 'en'; dark?: boolean; compact?: boolean }) {
  return (
    <div className={`grid gap-4 ${compact ? 'sm:grid-cols-2 lg:grid-cols-5' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
      {SERVICE_AREAS.map((a) => {
        const Icon = ICONS[a.icon];
        return (
          <div key={a.id} className={`rounded-2xl p-5 ${dark ? 'bg-white/10 ring-1 ring-white/15' : 'bg-white shadow-sm ring-1 ring-black/5'}`}>
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${dark ? 'bg-secondary/20 text-secondary' : 'bg-secondary/15 text-primary'}`}>
              <Icon className="h-5 w-5" />
            </span>
            <p className={`mt-3 font-serif text-xl font-bold ${dark ? 'text-white' : 'text-primary'}`}>{a.title[lang]}</p>
            {!compact && <p className={`mt-1 text-sm ${dark ? 'text-white/70' : 'text-brand-gray'}`}>{a.body[lang]}</p>}
            <ul className={`mt-3 space-y-1 text-sm ${dark ? 'text-white/85' : 'text-primary'}`}>
              {a.items.map((i) => (
                <li key={i.id} className="flex gap-2">
                  <span className="text-secondary">•</span>
                  {i.name[lang]}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

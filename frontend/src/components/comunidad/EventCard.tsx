import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { cld } from '@/lib/cloudinary';
import type { CommunityEvent } from '@shared/types';

const PHASE: Record<string, { label: string; variant: 'gold' | 'light' | 'dark' }> = {
  upcoming: { label: 'Próximo', variant: 'gold' },
  ongoing: { label: 'En curso', variant: 'dark' },
  past: { label: 'Pasado', variant: 'light' },
};

export function EventCard({ event }: { event: CommunityEvent }) {
  const date = new Date(event.startDate);
  const phase = PHASE[event.phase];

  return (
    <Link to={`/comunidad/eventos/${event.id}`} className="block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
      <div className="relative h-36 bg-gradient-to-br from-accent to-primary">
        {event.coverImage && <img src={cld(event.coverImage, { width: 800 })} alt="" className="h-full w-full object-cover" />}
        <Badge variant={phase.variant} className="absolute left-3 top-3">{phase.label}</Badge>
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          {date.toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'long' })} ·{' '}
          {date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <h3 className="mt-1 font-semibold text-primary">{event.title}</h3>
        {event.location && <p className="mt-1 flex items-center gap-1 text-sm text-brand-gray"><MapPin className="h-3.5 w-3.5" strokeWidth={1.8} /> {event.location}</p>}
        <p className="mt-2 text-xs text-brand-gray">
          {event.attendeeCount ?? 0} asistentes{event.group ? ` · ${event.group.name}` : ''}
        </p>
      </div>
    </Link>
  );
}

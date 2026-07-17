import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarX, Check, HelpCircle, X, MapPin } from 'lucide-react';
import { Seo } from '@/components/shared/Seo';
import { Avatar } from '@/components/comunidad/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/shared/Toast';
import { cld } from '@/lib/cloudinary';
import type { CommunityEvent } from '@shared/types';

type Rsvp = 'going' | 'maybe' | 'not_going';

export default function EventDetailPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { data, loading, reload } = useEventDetail(id);
  const [myStatus, setMyStatus] = useState<Rsvp | null>(null);

  if (loading) return <p className="py-16 text-center text-brand-gray">Cargando…</p>;
  if (!data) return <EmptyState title="Evento no encontrado" ctaText="Ver eventos" ctaTo="/comunidad/eventos" icon={<CalendarX className="h-10 w-10" strokeWidth={1.4} />} />;

  const status = myStatus ?? data.myStatus ?? null;

  async function rsvp(s: Rsvp) {
    if (!isAuthenticated) {
      toast('Inicia sesión como miembro para confirmar', 'info');
      return;
    }
    try {
      await api.post(`/community/events/${id}/rsvp`, { status: s });
      setMyStatus(s);
      reload();
      toast('Respuesta registrada', 'success');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  const date = new Date(data.startDate);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Seo title={`${data.title} — Eventos`} description={data.description.slice(0, 150)} />

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="h-52 bg-gradient-to-br from-accent to-primary">
          {data.coverImage && <img src={cld(data.coverImage, { width: 1200 })} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="p-6">
          <Badge variant="gold">{data.phase === 'upcoming' ? 'Próximo' : data.phase === 'ongoing' ? 'En curso' : 'Pasado'}</Badge>
          <h1 className="mt-3 text-2xl font-bold text-primary">{data.title}</h1>
          <p className="mt-2 text-sm font-medium text-accent">
            {date.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} ·{' '}
            {date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
          </p>
          {data.location && (
            <p className="mt-1 flex items-center gap-1 text-sm text-brand-gray">
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.8} /> {data.location}
            </p>
          )}
          {data.group && <p className="mt-1 text-sm text-brand-gray">Organizado por {data.group.name}</p>}

          <p className="mt-4 whitespace-pre-wrap text-primary/80">{data.description}</p>

          {/* RSVP */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant={status === 'going' ? 'primary' : 'outline'} onClick={() => rsvp('going')}>
              <Check className="h-4 w-4" strokeWidth={2.2} /> Voy ({data.counts?.going ?? 0})
            </Button>
            <Button variant={status === 'maybe' ? 'primary' : 'outline'} onClick={() => rsvp('maybe')}>
              <HelpCircle className="h-4 w-4" strokeWidth={1.8} /> Quizás ({data.counts?.maybe ?? 0})
            </Button>
            <Button variant={status === 'not_going' ? 'primary' : 'outline'} onClick={() => rsvp('not_going')}>
              <X className="h-4 w-4" strokeWidth={2} /> No voy
            </Button>
          </div>

          {/* Asistentes */}
          {(data.attendees?.length ?? 0) > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-primary">Asistentes</h3>
              <div className="flex flex-wrap gap-2">
                {data.attendees!.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 rounded-full bg-light px-3 py-1">
                    <Avatar name={a.fullName} avatarUrl={a.avatarUrl} size="sm" />
                    <span className="text-xs text-primary">{a.fullName.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function useEventDetail(id: string | undefined) {
  const [tick, setTick] = useState(0);
  const state = useFetch<CommunityEvent>(
    () => api.get<CommunityEvent>(`/community/events/${id}`),
    [id, tick],
  );
  return { ...state, reload: () => setTick((t) => t + 1) };
}

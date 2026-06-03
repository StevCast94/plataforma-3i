import { Seo } from '@/components/shared/Seo';
import { EventCard } from '@/components/comunidad/EventCard';
import { useEvents } from '@/hooks/useGroups';

export default function EventsPage() {
  const { data, loading } = useEvents();
  const upcoming = (data ?? []).filter((e) => e.phase !== 'past');
  const past = (data ?? []).filter((e) => e.phase === 'past');

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <Seo title="Eventos — Comunidad" />
      <h1 className="mb-5 text-2xl font-bold text-primary">Eventos</h1>
      {loading && <p className="text-brand-gray">Cargando…</p>}

      {upcoming.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-lg font-semibold text-brand-gray">Eventos pasados</h2>
          <div className="grid gap-5 opacity-70 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </>
      )}

      {!loading && (data ?? []).length === 0 && (
        <p className="rounded-2xl bg-white p-8 text-center text-brand-gray ring-1 ring-black/5">No hay eventos programados.</p>
      )}
    </div>
  );
}

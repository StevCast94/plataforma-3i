import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '@/components/shared/Seo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { BookingModal } from './BookingModal';
import type {
  TravelHotelOffer,
  TravelHotelSearchResponse,
  TravelFlightOffer,
  TravelFlightSearchResponse,
} from '@shared/types';

// ============================================================
// FASE 5 — Buscador del Club de Viajes 3i (hoteles V0-V2 + vuelos V5).
// Gating del backend: con membresía activa → isMember=true y priceCents = socio.
// La reserva de hoteles es end-to-end; vuelos es búsqueda (booking con Duffel).
// ============================================================

const money = (cents: number) => formatCurrency(cents / 100, { withCents: true });

function plusDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function durationLabel(min: number): string {
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function MembershipBanner({ isMember }: { isMember: boolean }) {
  if (isMember) {
    return (
      <div className="mb-6 rounded-xl bg-secondary/15 px-5 py-3 text-center text-sm font-medium text-accent">
        🎉 Estás viendo precios de socio del Club 3i.
      </div>
    );
  }
  return (
    <div className="mb-6 flex flex-col items-center justify-between gap-3 rounded-xl bg-light px-5 py-4 text-center sm:flex-row sm:text-left">
      <p className="text-sm text-primary">
        Estás viendo precios públicos. <strong>Hazte socio del Club 3i</strong> y paga la tarifa de socio.
      </p>
      <Link to="/club">
        <Button size="sm">Quiero ser socio</Button>
      </Link>
    </div>
  );
}

function OfferCard({ offer, onReserve }: { offer: TravelHotelOffer; onReserve: (o: TravelHotelOffer) => void }) {
  const perNight = Math.round(offer.priceCents / Math.max(1, offer.nights));
  return (
    <Card className="flex flex-col">
      <div className="relative h-44 w-full overflow-hidden bg-light">
        <img src={offer.image} alt={offer.name} loading="lazy" className="h-full w-full object-cover" />
        {offer.savingsCents > 0 && (
          <span className="absolute left-3 top-3">
            <Badge variant="gold">Ahorra {money(offer.savingsCents)}</Badge>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="text-secondary text-sm">{'★'.repeat(offer.stars)}</div>
        <h3 className="mt-1 text-lg font-semibold text-primary">{offer.name}</h3>
        <p className="text-sm text-brand-gray">{offer.city}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {offer.amenities.slice(0, 3).map((a) => (
            <span key={a} className="rounded-full bg-light px-2.5 py-1 text-xs text-primary/80">{a}</span>
          ))}
          <span className={`rounded-full px-2.5 py-1 text-xs ${offer.refundable ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
            {offer.refundable ? 'Cancelación gratis' : 'No reembolsable'}
          </span>
        </div>
        <div className="mt-auto pt-5">
          {offer.isMemberPrice ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">{money(offer.priceCents)}</span>
                <span className="text-sm text-brand-gray line-through">{money(offer.publicCents)}</span>
                <Badge variant="gold">Socio</Badge>
              </div>
              <p className="text-xs text-brand-gray">
                {money(perNight)} / noche · {offer.nights} {offer.nights === 1 ? 'noche' : 'noches'}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">{money(offer.publicCents)}</span>
                <span className="text-xs text-brand-gray">· {offer.nights} {offer.nights === 1 ? 'noche' : 'noches'}</span>
              </div>
              <p className="mt-1 text-sm font-medium text-accent">
                Precio socio: {money(offer.memberCents)} · ahorras {money(offer.savingsCents)}
              </p>
            </>
          )}
          <Button size="sm" className="mt-3 w-full" onClick={() => onReserve(offer)}>Reservar</Button>
        </div>
      </div>
    </Card>
  );
}

function FlightCard({ offer }: { offer: TravelFlightOffer }) {
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-primary">{offer.airline}</p>
          <p className="text-xs text-brand-gray">{offer.flightNumber} · {offer.cabin}</p>
        </div>
        {offer.savingsCents > 0 && <Badge variant="gold">Ahorra {money(offer.savingsCents)}</Badge>}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="text-center">
          <p className="font-bold text-primary">{offer.origin}</p>
          <p className="text-xs text-brand-gray">{offer.departTime.split(' ')[1]}</p>
        </div>
        <div className="flex-1 px-3 text-center text-xs text-brand-gray">
          <p>{durationLabel(offer.durationMin)}</p>
          <div className="my-1 border-t border-dashed border-black/20" />
          <p>{offer.stops === 0 ? 'Directo' : `${offer.stops} escala${offer.stops > 1 ? 's' : ''}`}{offer.roundTrip ? ' · ida y vuelta' : ''}</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-primary">{offer.destination}</p>
          <p className="text-xs text-brand-gray">{offer.arriveTime.split(' ')[1]}</p>
        </div>
      </div>

      <div className="mt-4 border-t border-black/5 pt-3">
        {offer.isMemberPrice ? (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">{money(offer.priceCents)}</span>
            <span className="text-sm text-brand-gray line-through">{money(offer.publicCents)}</span>
            <Badge variant="gold">Socio</Badge>
          </div>
        ) : (
          <>
            <span className="text-2xl font-bold text-primary">{money(offer.publicCents)}</span>
            <p className="mt-1 text-sm font-medium text-accent">
              Precio socio: {money(offer.memberCents)} · ahorras {money(offer.savingsCents)}
            </p>
          </>
        )}
        <Button size="sm" variant="outline" className="mt-3 w-full" disabled title="Reserva de vuelos disponible con la integración de Duffel">
          Reservar (próximamente)
        </Button>
      </div>
    </Card>
  );
}

type Tab = 'hoteles' | 'vuelos';

export default function ViajesPage() {
  const [tab, setTab] = useState<Tab>('hoteles');

  // Hoteles
  const [hForm, setHForm] = useState({ destination: '', checkIn: plusDays(14), checkOut: plusDays(17), guests: 2 });
  const [hResult, setHResult] = useState<TravelHotelSearchResponse | null>(null);
  const [bookingOffer, setBookingOffer] = useState<TravelHotelOffer | null>(null);

  // Vuelos
  const [fForm, setFForm] = useState({ origin: '', destination: '', departDate: plusDays(21), returnDate: '', passengers: 1 });
  const [fResult, setFResult] = useState<TravelFlightSearchResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function searchHotels(e: FormEvent) {
    e.preventDefault();
    if (!hForm.destination.trim()) return setError('Escribe un destino');
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams({ destination: hForm.destination.trim(), checkIn: hForm.checkIn, checkOut: hForm.checkOut, guests: String(hForm.guests) });
      setHResult(await api.get<TravelHotelSearchResponse>(`/travel/hotels?${qs}`));
    } catch (err) { setError((err as Error).message); setHResult(null); }
    finally { setLoading(false); }
  }

  async function searchFlights(e: FormEvent) {
    e.preventDefault();
    if (!fForm.origin.trim() || !fForm.destination.trim()) return setError('Escribe origen y destino');
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams({ origin: fForm.origin.trim(), destination: fForm.destination.trim(), departDate: fForm.departDate, passengers: String(fForm.passengers) });
      if (fForm.returnDate) qs.set('returnDate', fForm.returnDate);
      setFResult(await api.get<TravelFlightSearchResponse>(`/travel/flights?${qs}`));
    } catch (err) { setError((err as Error).message); setFResult(null); }
    finally { setLoading(false); }
  }

  function switchTab(t: Tab) {
    setTab(t);
    setError(null);
  }

  const result = tab === 'hoteles' ? hResult : fResult;

  return (
    <>
      <Seo title="Club de Viajes 3i" description="Busca hoteles y vuelos con precios de socio. Beneficio exclusivo de la comunidad Grupo 3i." />

      <section className="bg-primary text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6">
          <Badge variant="gold" className="mb-4">Club de Viajes 3i</Badge>
          <h1 className="text-3xl font-bold sm:text-5xl">Viaja como socio, paga como socio</h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/80">
            Los socios acceden a tarifas con costo casi al neto. El precio de socio aparece en cada resultado.
          </p>
        </div>
      </section>

      {/* BUSCADOR */}
      <section className="mx-auto -mt-8 max-w-5xl px-4 sm:px-6">
        <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/5">
          {/* Tabs */}
          <div className="mb-4 flex gap-2">
            {(['hoteles', 'vuelos'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  tab === t ? 'bg-primary text-white' : 'bg-light text-primary hover:bg-secondary/20',
                )}
              >
                {t === 'hoteles' ? '🏨 Hoteles' : '✈️ Vuelos'}
              </button>
            ))}
          </div>

          {tab === 'hoteles' ? (
            <form onSubmit={searchHotels} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <Input label="Destino" placeholder="Ej. Montañita, Cuenca…" value={hForm.destination} onChange={(e) => setHForm({ ...hForm, destination: e.target.value })} />
              </div>
              <Input label="Entrada" type="date" value={hForm.checkIn} onChange={(e) => setHForm({ ...hForm, checkIn: e.target.value })} />
              <Input label="Salida" type="date" value={hForm.checkOut} onChange={(e) => setHForm({ ...hForm, checkOut: e.target.value })} />
              <Input label="Huéspedes" type="number" min={1} max={12} value={hForm.guests} onChange={(e) => setHForm({ ...hForm, guests: Number(e.target.value) })} />
              <div className="lg:col-span-5">
                <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? 'Buscando…' : 'Buscar hoteles'}</Button>
              </div>
            </form>
          ) : (
            <form onSubmit={searchFlights} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Input label="Origen" placeholder="UIO" value={fForm.origin} onChange={(e) => setFForm({ ...fForm, origin: e.target.value })} />
              <Input label="Destino" placeholder="GYE" value={fForm.destination} onChange={(e) => setFForm({ ...fForm, destination: e.target.value })} />
              <Input label="Salida" type="date" value={fForm.departDate} onChange={(e) => setFForm({ ...fForm, departDate: e.target.value })} />
              <Input label="Regreso (opcional)" type="date" value={fForm.returnDate} onChange={(e) => setFForm({ ...fForm, returnDate: e.target.value })} />
              <Input label="Pasajeros" type="number" min={1} max={9} value={fForm.passengers} onChange={(e) => setFForm({ ...fForm, passengers: Number(e.target.value) })} />
              <div className="lg:col-span-5">
                <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? 'Buscando…' : 'Buscar vuelos'}</Button>
              </div>
            </form>
          )}
        </div>
        {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
      </section>

      {/* RESULTADOS */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
          </div>
        )}

        {!loading && result && (
          <>
            <MembershipBanner isMember={result.isMember} />
            {result.offers.length === 0 ? (
              <p className="py-10 text-center text-brand-gray">No encontramos resultados. Prueba otras fechas o destino.</p>
            ) : tab === 'hoteles' ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {hResult!.offers.map((o) => <OfferCard key={o.rateKey} offer={o} onReserve={setBookingOffer} />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {fResult!.offers.map((o) => <FlightCard key={o.rateKey} offer={o} />)}
              </div>
            )}
          </>
        )}

        {!loading && !result && (
          <div className="py-10 text-center text-brand-gray">
            <span className="text-5xl">{tab === 'hoteles' ? '🏝️' : '🛫'}</span>
            <p className="mt-4">
              {tab === 'hoteles' ? 'Escribe un destino y fechas para ver las tarifas del club.' : 'Escribe origen, destino y fecha para ver vuelos.'}
            </p>
          </div>
        )}
      </section>

      <BookingModal offer={bookingOffer} query={hResult?.query ?? null} onClose={() => setBookingOffer(null)} />
    </>
  );
}

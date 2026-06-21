import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/shared/Toast';
import { IconSuitcase, IconShield, IconMedallion } from '@/components/icons/TravelIcons';
import type { TravelBooking, TravelGuaranteeClaim } from '@shared/types';

// ============================================================
// FASE 5 V4 — "Mis Viajes": reservas del socio + voucher + garantía de precio.
// ============================================================

const money = (cents: number) => formatCurrency(cents / 100, { withCents: true });

const STATUS_BADGE: Record<string, { label: string; variant: 'gold' | 'light' | 'dark' }> = {
  CONFIRMED: { label: 'Confirmada', variant: 'gold' },
  PENDING_PAYMENT: { label: 'Pago pendiente', variant: 'light' },
  CANCELLED: { label: 'Cancelada', variant: 'light' },
  REFUNDED: { label: 'Reembolsada', variant: 'light' },
  FAILED: { label: 'Fallida', variant: 'light' },
};

const CLAIM_BADGE: Record<string, string> = {
  open: 'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  paid: 'bg-blue-50 text-blue-700',
};

export default function TravelBookingsPage() {
  const { toast } = useToast();
  const [reloadKey, setReloadKey] = useState(0);
  const { data: bookings, loading } = useFetch<TravelBooking[]>(
    () => api.get('/travel/bookings/mine'),
    [reloadKey],
  );
  const { data: claims } = useFetch<TravelGuaranteeClaim[]>(
    () => api.get('/travel/guarantee/mine'),
    [reloadKey],
  );
  const [claimFor, setClaimFor] = useState<TravelBooking | null>(null);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-3">
        <IconMedallion className="h-11 w-11">
          <IconSuitcase className="h-6 w-6" />
        </IconMedallion>
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Mis Viajes</h1>
          <p className="text-sm text-brand-gray">Tus reservas del Club de Viajes 3i.</p>
        </div>
      </div>

      {loading && <p className="mt-8 text-brand-gray">Cargando…</p>}

      {!loading && bookings && bookings.length === 0 && (
        <div className="mt-10 flex flex-col items-center rounded-2xl bg-white p-10 text-center ring-1 ring-black/5">
          <IconMedallion className="h-20 w-20">
            <IconSuitcase className="h-9 w-9" />
          </IconMedallion>
          <p className="mt-5 text-brand-gray">Aún no tienes reservas.</p>
          <Link to="/club/viajes" className="mt-5 inline-block">
            <Button>Buscar hoteles</Button>
          </Link>
          <img src="/images/isotipo.svg" alt="" aria-hidden="true" className="mt-6 h-5 w-auto opacity-40" />
        </div>
      )}

      <div className="mt-6 space-y-4">
        {(bookings ?? []).map((b) => {
          const badge = STATUS_BADGE[b.status] ?? { label: b.status, variant: 'light' as const };
          return (
            <div key={b.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-primary">{b.details.name}</h3>
                  <p className="text-sm text-brand-gray">
                    {b.details.city} · {b.details.checkIn} → {b.details.checkOut} ·{' '}
                    {b.details.guests} huésped(es)
                  </p>
                </div>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm">
                  {b.supplierRef && (
                    <span className="mr-3">
                      Voucher: <strong className="tracking-widest text-accent">{b.supplierRef}</strong>
                    </span>
                  )}
                  <span className="font-bold text-primary">{money(b.totalCents)}</span>
                  {b.details.isMemberPrice && <Badge variant="gold" className="ml-2">Precio socio</Badge>}
                </div>
                {b.status === 'CONFIRMED' && (
                  <Button size="sm" variant="outline" onClick={() => setClaimFor(b)}>
                    Reclamar mejor precio
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reclamos de garantía */}
      {claims && claims.length > 0 && (
        <div className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-primary">
            <IconShield className="h-5 w-5 text-accent" />
            Mis reclamos de garantía
          </h2>
          <div className="mt-3 space-y-2">
            {claims.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl bg-white p-4 text-sm ring-1 ring-black/5">
                <div className="min-w-0">
                  <a href={c.competitorUrl} target="_blank" rel="noreferrer" className="truncate text-accent underline">
                    Precio rival: {money(c.claimedCents)}
                  </a>
                  <p className="text-xs text-brand-gray">Nuestro precio: {money(c.ourCents)}</p>
                  {c.resolution && <p className="mt-1 text-xs text-brand-gray">“{c.resolution}”</p>}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs ${CLAIM_BADGE[c.status] ?? 'bg-light'}`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ClaimModal
        booking={claimFor}
        onClose={() => setClaimFor(null)}
        onSubmitted={() => {
          setClaimFor(null);
          setReloadKey((k) => k + 1);
          toast('Reclamo enviado. Lo revisaremos pronto.', 'success');
        }}
      />
    </div>
  );
}

function ClaimModal({
  booking,
  onClose,
  onSubmitted,
}: {
  booking: TravelBooking | null;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [competitorUrl, setUrl] = useState('');
  const [claimed, setClaimed] = useState('');
  const [evidenceUrl, setEvidence] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!booking) return;
    const claimedCents = Math.round(parseFloat(claimed) * 100);
    if (!competitorUrl.trim()) return setError('Ingresa la URL del precio rival');
    if (!Number.isFinite(claimedCents) || claimedCents <= 0) return setError('Ingresa un precio válido');
    setBusy(true);
    setError(null);
    try {
      await api.post('/travel/guarantee', {
        bookingId: booking.id,
        competitorUrl: competitorUrl.trim(),
        claimedCents,
        evidenceUrl: evidenceUrl.trim() || undefined,
      });
      setUrl(''); setClaimed(''); setEvidence('');
      onSubmitted();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={!!booking} onClose={onClose} title="Garantía de mejor precio">
      {booking && (
        <form onSubmit={onSubmit} className="space-y-4">
          <p className="text-sm text-brand-gray">
            Reserva: <strong className="text-primary">{booking.details.name}</strong> ·{' '}
            pagaste <strong className="text-primary">{money(booking.totalCents)}</strong>.
            Si encontraste el mismo hotel, fechas y condiciones más barato, repórtalo.
          </p>
          <Input label="URL del precio de la competencia" value={competitorUrl} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          <Input label="Precio encontrado (USD)" type="number" step="0.01" min="0" value={claimed} onChange={(e) => setClaimed(e.target.value)} />
          <Input label="Captura/evidencia (URL, opcional)" value={evidenceUrl} onChange={(e) => setEvidence(e.target.value)} placeholder="https://…" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Enviando…' : 'Enviar reclamo'}
          </Button>
        </form>
      )}
    </Modal>
  );
}

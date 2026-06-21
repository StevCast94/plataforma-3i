import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { getReferralCode } from '@/hooks/useReferral';
import type {
  TravelHotelOffer,
  TravelHotelSearch,
  TravelBooking,
  CreateBookingResponse,
} from '@shared/types';

// ============================================================
// FASE 5 V2 — Flujo de reserva: form de huésped → pago → voucher.
// El precio lo recalcula el backend desde el rateKey; aquí solo mostramos.
// ============================================================

const money = (cents: number) => formatCurrency(cents / 100, { withCents: true });

type Step = 'form' | 'processing' | 'done' | 'error';

export function BookingModal({
  offer,
  query,
  onClose,
}: {
  offer: TravelHotelOffer | null;
  query: TravelHotelSearch | null;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>('form');
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' });
  const [booking, setBooking] = useState<TravelBooking | null>(null);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setStep('form');
    setCustomer({ name: '', email: '', phone: '' });
    setBooking(null);
    setError(null);
    onClose();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!offer || !query) return;
    if (!customer.name.trim() || !customer.email.trim()) {
      setError('Nombre y email son requeridos');
      return;
    }
    setStep('processing');
    setError(null);
    try {
      // 1) Crear reserva (PENDING_PAYMENT) + iniciar cobro.
      const created = await api.post<CreateBookingResponse>('/travel/bookings', {
        ...query,
        rateKey: offer.rateKey,
        customer,
        referralCode: getReferralCode() ?? undefined,
      });
      // 2) Confirmar el pago y emitir voucher.
      const confirmed = await api.post<TravelBooking>(
        `/travel/bookings/${created.booking.id}/confirm`,
        { transactionId: created.payment.paymentRef },
      );
      setBooking(confirmed);
      setStep('done');
    } catch (err) {
      setError((err as Error).message);
      setStep('error');
    }
  }

  const open = !!offer;
  const priceCents = offer?.priceCents ?? 0;

  return (
    <Modal open={open} onClose={close} title={step === 'done' ? '¡Reserva confirmada!' : 'Reservar'}>
      {!offer ? null : step === 'done' && booking ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-secondary/15 p-4 text-center">
            <p className="text-sm text-brand-gray">Voucher</p>
            <p className="text-2xl font-bold tracking-widest text-accent">{booking.supplierRef}</p>
            <Badge variant="gold" className="mt-2">{booking.status}</Badge>
          </div>
          <dl className="space-y-1.5 text-sm">
            <Row label="Hotel" value={booking.details.name} />
            <Row label="Destino" value={booking.details.city} />
            <Row label="Fechas" value={`${booking.details.checkIn} → ${booking.details.checkOut}`} />
            <Row label="Huéspedes" value={String(booking.details.guests)} />
            <Row label="Huésped" value={booking.customerName} />
            <Row label="Total pagado" value={money(booking.totalCents)} bold />
          </dl>
          <p className="text-xs text-brand-gray">
            Enviamos la confirmación a {booking.customerEmail}. Guarda tu voucher.
          </p>
          <Button className="w-full" onClick={close}>Listo</Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Resumen oferta */}
          <div className="flex gap-3 rounded-xl bg-light p-3">
            <img src={offer.image} alt={offer.name} className="h-16 w-16 rounded-lg object-cover" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-primary">{offer.name}</p>
              <p className="text-xs text-brand-gray">
                {query?.checkIn} → {query?.checkOut} · {offer.nights}{' '}
                {offer.nights === 1 ? 'noche' : 'noches'}
              </p>
              <p className="mt-1 text-sm">
                <span className="font-bold text-primary">{money(priceCents)}</span>{' '}
                {offer.isMemberPrice && <Badge variant="gold">Precio socio</Badge>}
              </p>
            </div>
          </div>

          <Input
            label="Nombre del huésped"
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={customer.email}
            onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
          />
          <Input
            label="Teléfono (opcional)"
            value={customer.phone}
            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={step === 'processing'}>
            {step === 'processing' ? 'Procesando pago…' : `Pagar ${money(priceCents)}`}
          </Button>
          <p className="text-center text-xs text-brand-gray">
            Pago seguro. {offer.isMemberPrice ? 'Estás pagando tarifa de socio.' : ''}
          </p>
        </form>
      )}
    </Modal>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-brand-gray">{label}</dt>
      <dd className={bold ? 'font-bold text-primary' : 'text-primary'}>{value}</dd>
    </div>
  );
}

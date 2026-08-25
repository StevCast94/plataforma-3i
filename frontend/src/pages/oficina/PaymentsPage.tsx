import { useState } from 'react';
import { Seo } from '@/components/shared/Seo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PayoutMethodForm } from '@/components/oficina/PayoutMethodForm';
import { api } from '@/lib/api';
import { useToast } from '@/components/shared/Toast';
import { useAuth } from '@/hooks/useAuth';
import { usePayouts } from '@/hooks/usePayouts';
import { formatCurrency } from '@/lib/utils';

const PAYOUT_STATUS: Record<string, string> = {
  pending: 'bg-gray-200 text-gray-700',
  processing: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

export default function PaymentsPage() {
  const { member, refresh } = useAuth();
  const { data: payouts } = usePayouts();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [history, setHistory] = useState(payouts ?? []);

  if (!member) return null;

  const balance = member.walletBalance;
  const rows = payouts ?? history;

  async function requestPayout() {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast('Ingresa un monto válido', 'error');
      return;
    }
    setRequesting(true);
    try {
      const payout = await api.post('/payouts/request', { amount: value });
      toast('Retiro solicitado ✅', 'success');
      setAmount('');
      setHistory((h) => [payout as never, ...h]);
      await refresh();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Seo title="Pagos — Oficina Virtual" />
      <h1 className="text-3xl font-bold text-primary">Pagos</h1>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-xl text-primary">Método de pago</h2>
        <p className="mt-1 text-sm text-brand-gray">
          Configura dónde quieres recibir tus comisiones.
        </p>
        <div className="mt-5">
          <PayoutMethodForm member={member} />
        </div>
      </section>

      <section className="rounded-2xl bg-primary p-6 text-white shadow-sm">
        <h2 className="text-xl">Solicitar retiro</h2>
        <p className="mt-1 text-sm text-white/70">
          Saldo disponible:{' '}
          <strong className="text-secondary">{formatCurrency(balance)}</strong>
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              type="number"
              label="Monto a retirar"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="text-primary"
            />
          </div>
          <Button onClick={requestPayout} disabled={requesting || balance <= 0}>
            {requesting ? 'Solicitando…' : 'Solicitar retiro'}
          </Button>
        </div>
        <p className="mt-2 text-xs text-white/50">
          El mínimo depende de tu estatus y método de pago.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl text-primary">Historial de retiros</h2>
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase tracking-wider text-brand-gray">
                {/* Las 5 columnas medían 444px en una pantalla de 343px, así que
                    las dos últimas quedaban fuera de vista. En móvil se ocultan
                    Método y Referencia como columnas y se muestran debajo de la
                    fecha: no se pierde ningún dato. */}
                <th className="px-2 py-3 sm:px-4">Fecha</th>
                <th className="px-2 py-3 sm:px-4">Monto</th>
                <th className="hidden px-2 py-3 sm:table-cell sm:px-4">Método</th>
                <th className="px-2 py-3 sm:px-4">Estado</th>
                <th className="hidden px-2 py-3 sm:table-cell sm:px-4">Referencia</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-brand-gray">Sin retiros aún.</td></tr>
              )}
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-black/5">
                  <td className="px-2 py-3 sm:px-4 text-sm text-brand-gray">
                    {new Date(p.createdAt).toLocaleDateString('es-EC')}
                    <span className="block capitalize sm:hidden">{p.method}</span>
                    {p.reference && (
                      <span className="block break-all text-xs sm:hidden">{p.reference}</span>
                    )}
                  </td>
                  <td className="px-2 py-3 sm:px-4 text-sm font-semibold text-primary">
                    {formatCurrency(p.amount)}
                  </td>
                  <td className="hidden px-2 py-3 sm:px-4 text-sm capitalize sm:table-cell">{p.method}</td>
                  <td className="px-2 py-3 sm:px-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PAYOUT_STATUS[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="hidden px-2 py-3 sm:px-4 text-sm text-brand-gray sm:table-cell">{p.reference ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency } from '@/lib/utils';
import { devApi, LEAD_SOURCE_LABEL, SALE_STATUS_LABEL, type DevLead, type DevSale } from '@/lib/developerApi';

// Ventas del desarrollador: declarar una venta desde un contacto y registrar cada
// pago del comprador. La comisión de Grupo 3i se calcula por pago (8 % / 2 %).

const uploadImage = (dataUri: string) => devApi.post<{ url: string }>('/upload-image', { dataUri });
const pct = (n: number) => `${Math.round(n * 1000) / 10} %`;
const today = () => new Date().toISOString().slice(0, 10);

/** Modal para declarar la venta de un contacto. */
export function DeclareSaleModal({ lead, onClose, onDone }: { lead: DevLead | null; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [type, setType] = useState<'CASH' | 'FINANCED'>('CASH');
  const [receipt, setReceipt] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!lead) return;
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await devApi.post('/sales', {
        leadId: lead.id,
        lotCode: fd.get('lotCode') || undefined,
        price: Number(fd.get('price')),
        paymentType: type,
        firstPayment: type === 'FINANCED' ? Number(fd.get('firstPayment') || 0) : undefined,
        paidAt: fd.get('paidAt') || undefined,
        receiptUrl: receipt[0],
        notes: fd.get('notes') || undefined,
      });
      toast('Venta declarada. Grupo 3i la confirmará.', 'success');
      onDone();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={!!lead} onClose={onClose} title={`Declarar venta — ${lead?.name ?? ''}`}>
      {lead && (
        <form onSubmit={submit} className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          <p className="text-sm text-brand-gray">
            {lead.project.name} · contacto{' '}
            <span className={`rounded-full px-2 py-0.5 text-xs ${LEAD_SOURCE_LABEL[lead.source].cls}`}>{LEAD_SOURCE_LABEL[lead.source].text}</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Input name="lotCode" label="Solar" defaultValue={lead.lotCode ?? ''} placeholder="A12" />
            <Input name="price" type="number" step="0.01" label="Precio de venta (USD) *" required />
          </div>
          <div className="flex gap-2">
            {(['CASH', 'FINANCED'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm ${type === t ? 'border-secondary bg-secondary/10 font-semibold text-primary' : 'border-black/15 text-brand-gray'}`}
              >
                {t === 'CASH' ? 'Contado' : 'Financiado'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {type === 'FINANCED' && <Input name="firstPayment" type="number" step="0.01" label="Entrada recibida" />}
            <Input name="paidAt" type="date" label="Fecha del pago" defaultValue={today()} />
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-medium text-primary">Comprobante</span>
            <ImageUpload single value={receipt} onChange={setReceipt} upload={uploadImage} />
          </div>
          <Input name="notes" label="Nota (opcional)" />
          <p className="text-xs text-brand-gray">
            {type === 'CASH'
              ? 'La comisión se calcula sobre el precio total.'
              : 'La comisión se calcula sobre cada pago que registres (entrada y cuotas).'}
          </p>
          <Button type="submit" disabled={busy} className="w-full">{busy ? 'Enviando…' : 'Declarar venta'}</Button>
        </form>
      )}
    </Modal>
  );
}

export function DeveloperSales() {
  const { toast } = useToast();
  const [sales, setSales] = useState<DevSale[] | null>(null);
  const [paying, setPaying] = useState<DevSale | null>(null);
  const [receipt, setReceipt] = useState<string[]>([]);

  const load = useCallback(() => {
    devApi.get<DevSale[]>('/sales').then(setSales).catch((e) => toast(e.message, 'error'));
  }, [toast]);
  useEffect(load, [load]);

  async function addPayment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!paying) return;
    const fd = new FormData(e.currentTarget);
    try {
      await devApi.post(`/sales/${paying.id}/installments`, {
        amount: Number(fd.get('amount')),
        paidAt: fd.get('paidAt') || undefined,
        receiptUrl: receipt[0],
      });
      toast('Pago registrado', 'success');
      setPaying(null);
      setReceipt([]);
      load();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  const owed = (sales ?? []).filter((s) => s.status !== 'REJECTED').reduce((a, s) => a + s.totals.feeTotal - s.totals.feeCollected, 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-serif text-xl font-bold text-primary">Ventas</h2>
          <p className="text-xs text-brand-gray">Para declarar una venta, ve a Contactos y usa «Venta» en el cliente.</p>
        </div>
        <div className="rounded-xl bg-white px-4 py-2 text-right shadow-sm">
          <p className="text-xs text-brand-gray">Comisión pendiente de pago a Grupo 3i</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(owed)}</p>
        </div>
      </div>

      {sales === null ? (
        <p className="text-sm text-brand-gray">Cargando…</p>
      ) : sales.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-black/10 p-8 text-center text-sm text-brand-gray">Aún no hay ventas declaradas.</div>
      ) : (
        <div className="space-y-3">
          {sales.map((s) => {
            const st = SALE_STATUS_LABEL[s.status];
            const pending = s.price - s.totals.paid;
            return (
              <div key={s.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-primary">
                      {s.lead.name} · {s.project.name}
                      {s.lotCode && ` · Solar ${s.lotCode}`}
                    </p>
                    <p className="text-xs text-brand-gray">
                      {formatCurrency(s.price)} · {s.paymentType === 'CASH' ? 'Contado' : 'Financiado'} · comisión {pct(s.feeRate)} (
                      {LEAD_SOURCE_LABEL[s.lead.source].text.toLowerCase()})
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.text}</span>
                </div>
                {s.reviewNote && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">Grupo 3i: {s.reviewNote}</p>}
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-light p-2">
                    <p className="text-brand-gray">Cobrado al cliente</p>
                    <p className="font-semibold text-primary">{formatCurrency(s.totals.paid)}</p>
                  </div>
                  <div className="rounded-lg bg-light p-2">
                    <p className="text-brand-gray">Comisión generada</p>
                    <p className="font-semibold text-primary">{formatCurrency(s.totals.feeTotal)}</p>
                  </div>
                  <div className="rounded-lg bg-light p-2">
                    <p className="text-brand-gray">Ya pagada</p>
                    <p className="font-semibold text-primary">{formatCurrency(s.totals.feeCollected)}</p>
                  </div>
                </div>
                {s.installments.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs">
                    {s.installments.map((i) => (
                      <li key={i.id} className={`flex justify-between ${i.voided ? 'text-brand-gray line-through' : ''}`}>
                        <span>
                          {new Date(i.paidAt).toLocaleDateString('es-EC')} · {formatCurrency(i.amount)}
                          {i.receiptUrl && (
                            <a href={i.receiptUrl} target="_blank" rel="noreferrer" className="ml-2 text-secondary hover:underline">comprobante</a>
                          )}
                        </span>
                        <span>
                          comisión {formatCurrency(i.feeAmount)} {i.collectedAt ? '✓ pagada' : '· pendiente'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {s.paymentType === 'FINANCED' && ['DECLARED', 'CONFIRMED'].includes(s.status) && pending > 0.01 && (
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-brand-gray">Saldo por cobrar al cliente: {formatCurrency(pending)}</span>
                    <Button size="sm" variant="outline" onClick={() => setPaying(s)}>+ Registrar pago</Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!paying} onClose={() => setPaying(null)} title="Registrar pago del cliente">
        {paying && (
          <form onSubmit={addPayment} className="space-y-3">
            <p className="text-sm text-brand-gray">
              {paying.lead.name} · saldo {formatCurrency(paying.price - paying.totals.paid)}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Input name="amount" type="number" step="0.01" label="Monto *" required />
              <Input name="paidAt" type="date" label="Fecha" defaultValue={today()} />
            </div>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-primary">Comprobante</span>
              <ImageUpload single value={receipt} onChange={setReceipt} upload={uploadImage} />
            </div>
            <Button type="submit" className="w-full">Registrar</Button>
          </form>
        )}
      </Modal>
    </div>
  );
}

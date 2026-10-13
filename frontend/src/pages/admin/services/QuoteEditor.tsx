import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/shared/Toast';
import { adminApi } from '@/lib/adminApi';
import { formatCurrency } from '@/lib/utils';
import type { Catalog, Quote, QuoteItem, ServiceRequest } from './types';

const DEFAULT_MILESTONES = [
  { label: 'Anticipo al aceptar', pct: 50 },
  { label: 'Contra entrega', pct: 50 },
];
const DEFAULT_TERMS =
  'Los plazos de instituciones públicas (municipio, notaría, registro) dependen de cada entidad; te mantenemos al tanto en el enlace de seguimiento.\nNo incluye tasas, impuestos ni aranceles de terceros, salvo que se indique.';

/** Crear o editar una propuesta privada. `from` precarga los datos de una solicitud. */
export function QuoteEditor({
  open,
  quote,
  from,
  catalog,
  onClose,
  onSaved,
}: {
  open: boolean;
  quote: Quote | null;
  from: ServiceRequest | null;
  catalog: Catalog | null;
  onClose: () => void;
  onSaved: (q: Quote) => void;
}) {
  const { toast } = useToast();
  const [f, setF] = useState({ clientName: '', clientPhone: '', clientEmail: '', lang: 'es', title: '', templateId: 'generico', taxRate: 15, validUntil: '', terms: DEFAULT_TERMS });
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [milestones, setMilestones] = useState(DEFAULT_MILESTONES);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const svc = (id: string) => catalog?.services.find((s) => s.id === id);
    if (quote) {
      setF({
        clientName: quote.clientName, clientPhone: quote.clientPhone ?? '', clientEmail: quote.clientEmail ?? '', lang: quote.lang, title: quote.title,
        templateId: quote.templateId ?? 'generico', taxRate: Math.round(quote.taxRate * 100), validUntil: quote.validUntil?.slice(0, 10) ?? '', terms: quote.terms ?? '',
      });
      setItems(quote.items);
      setMilestones(quote.milestones ?? []);
    } else {
      const services = from?.services ?? [];
      setF({
        clientName: from?.name ?? '', clientPhone: from?.phone ?? '', clientEmail: from?.email ?? '', lang: from?.lang ?? 'es',
        title: services.length ? services.map((s) => svc(s)?.name ?? s).join(' + ') : '',
        templateId: services[0] ? svc(services[0])?.template ?? 'generico' : 'generico',
        taxRate: 15, validUntil: new Date(Date.now() + 15 * 86_400_000).toISOString().slice(0, 10), terms: DEFAULT_TERMS,
      });
      setItems(services.length ? services.map((s) => ({ serviceId: s, description: svc(s)?.name ?? s, qty: 1, unitPrice: 0 })) : [{ description: '', qty: 1, unitPrice: 0 }]);
      setMilestones(DEFAULT_MILESTONES);
    }
  }, [open, quote, from, catalog]);

  const subtotal = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0);
  const total = subtotal * (1 + (Number(f.taxRate) || 0) / 100);
  const pctSum = milestones.reduce((s, m) => s + (Number(m.pct) || 0), 0);
  const setItem = (k: number, patch: Partial<QuoteItem>) => setItems((a) => a.map((x, j) => (j === k ? { ...x, ...patch } : x)));

  async function save() {
    setBusy(true);
    try {
      const body = { ...f, taxRate: (Number(f.taxRate) || 0) / 100, items, milestones, requestId: quote?.requestId ?? from?.id ?? null };
      const q = quote ? await adminApi.put<Quote>(`/admin/services/quotes/${quote.id}`, body) : await adminApi.post<Quote>('/admin/services/quotes', body);
      toast('Propuesta guardada', 'success');
      onSaved(q);
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={quote ? `Propuesta N.º ${quote.number}` : 'Nueva propuesta'}>
      <div className="max-h-[72vh] space-y-4 overflow-y-auto pr-1">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Cliente *" value={f.clientName} onChange={(e) => setF({ ...f, clientName: e.target.value })} />
          <Input label="WhatsApp" value={f.clientPhone} onChange={(e) => setF({ ...f, clientPhone: e.target.value })} />
          <Input label="Correo" value={f.clientEmail} onChange={(e) => setF({ ...f, clientEmail: e.target.value })} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-primary">Idioma del cliente</span>
            <select value={f.lang} onChange={(e) => setF({ ...f, lang: e.target.value })} className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm">
              <option value="es">Español</option>
              <option value="en">Inglés</option>
            </select>
          </label>
        </div>
        <Input label="Título *" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Levantamiento topográfico de 5 ha en Olón" />

        <div>
          <p className="mb-1.5 text-sm font-medium text-primary">Detalle</p>
          <div className="space-y-2">
            {items.map((i, k) => (
              <div key={k} className="grid grid-cols-12 gap-2">
                <input className="col-span-12 rounded-lg border border-black/15 px-3 py-2 text-sm sm:col-span-6" placeholder="Descripción" value={i.description} onChange={(e) => setItem(k, { description: e.target.value })} />
                <input className="col-span-3 rounded-lg border border-black/15 px-2 py-2 text-sm sm:col-span-1" type="number" min={0} step="any" value={i.qty} onChange={(e) => setItem(k, { qty: Number(e.target.value) })} aria-label="Cantidad" />
                <input className="col-span-3 rounded-lg border border-black/15 px-2 py-2 text-sm sm:col-span-2" placeholder="unidad (ha, u.)" value={i.unit ?? ''} onChange={(e) => setItem(k, { unit: e.target.value })} />
                <input className="col-span-4 rounded-lg border border-black/15 px-2 py-2 text-sm sm:col-span-2" type="number" min={0} step="any" placeholder="Valor unit." value={i.unitPrice} onChange={(e) => setItem(k, { unitPrice: Number(e.target.value) })} aria-label="Valor unitario" />
                <button type="button" className="col-span-2 rounded-lg bg-red-50 text-red-600 sm:col-span-1" onClick={() => setItems((a) => a.filter((_, j) => j !== k))} aria-label="Quitar renglón">×</button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setItems((a) => [...a, { description: '', qty: 1, unitPrice: 0 }])}>+ Renglón</Button>
            <select
              className="rounded-lg border border-black/15 px-2 py-1.5 text-sm"
              value=""
              onChange={(e) => {
                const s = catalog?.services.find((x) => x.id === e.target.value);
                if (s) setItems((a) => [...a, { serviceId: s.id, description: s.name, qty: 1, unitPrice: 0 }]);
              }}
            >
              <option value="">+ Desde el catálogo…</option>
              {catalog?.services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Input label="IVA %" type="number" value={f.taxRate} onChange={(e) => setF({ ...f, taxRate: Number(e.target.value) })} />
          <Input label="Válida hasta" type="date" value={f.validUntil} onChange={(e) => setF({ ...f, validUntil: e.target.value })} />
          <div className="rounded-lg bg-light p-2 text-sm">
            <p className="text-brand-gray">Subtotal {formatCurrency(subtotal)}</p>
            <p className="font-semibold text-primary">Total {formatCurrency(total)}</p>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-primary">Cobros por hito {pctSum !== 100 && milestones.length > 0 && <span className="text-red-600">(suman {pctSum} %, deben sumar 100 %)</span>}</p>
          <div className="space-y-2">
            {milestones.map((m, k) => (
              <div key={k} className="flex gap-2">
                <input className="flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm" value={m.label} onChange={(e) => setMilestones((a) => a.map((x, j) => (j === k ? { ...x, label: e.target.value } : x)))} />
                <input className="w-20 rounded-lg border border-black/15 px-2 py-2 text-sm" type="number" value={m.pct} onChange={(e) => setMilestones((a) => a.map((x, j) => (j === k ? { ...x, pct: Number(e.target.value) } : x)))} aria-label="Porcentaje" />
                <span className="self-center text-sm text-brand-gray">%</span>
                <button type="button" className="rounded-lg bg-red-50 px-3 text-red-600" onClick={() => setMilestones((a) => a.filter((_, j) => j !== k))} aria-label="Quitar hito">×</button>
              </div>
            ))}
          </div>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => setMilestones((a) => [...a, { label: '', pct: 0 }])}>+ Hito</Button>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-primary">Trámite que se abre al aceptar</span>
          <select value={f.templateId} onChange={(e) => setF({ ...f, templateId: e.target.value })} className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm">
            {catalog?.templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.steps.length} etapas)</option>)}
          </select>
        </label>
        <Textarea label="Condiciones" rows={4} value={f.terms} onChange={(e) => setF({ ...f, terms: e.target.value })} />
      </div>
      <div className="mt-4 flex justify-end gap-2 border-t border-black/5 pt-4">
        <Button variant="ghost" onClick={onClose} disabled={busy}>Cancelar</Button>
        <Button onClick={save} disabled={busy}>{busy ? 'Guardando…' : 'Guardar borrador'}</Button>
      </div>
    </Modal>
  );
}

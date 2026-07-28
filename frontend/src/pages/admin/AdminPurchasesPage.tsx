import { useEffect, useState } from 'react';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAdminGet } from '@/hooks/useAdminAPI';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency } from '@/lib/utils';
import type { Purchase, PurchaseStatus } from '@shared/types';
import type { AdminProduct } from '@/lib/adminTypes';

const STATUS_BADGE: Record<PurchaseStatus, string> = {
  pending: 'bg-gray-200 text-gray-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminPurchasesPage() {
  const { toast } = useToast();
  const [status, setStatus] = useState('');
  const { data, loading, reload } = useAdminGet<Purchase[]>(
    `/admin/purchases?${new URLSearchParams(status ? { status } : {})}`,
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [toConfirm, setToConfirm] = useState<Purchase | null>(null);
  const [toCancel, setToCancel] = useState<Purchase | null>(null);
  const [busy, setBusy] = useState(false);
  const { isSuperadmin } = useAdminAuth();

  async function confirm() {
    if (!toConfirm) return;
    setBusy(true);
    try {
      const res = await adminApi.post<{ commissionsCreated: number }>(`/admin/purchases/${toConfirm.id}/confirm`);
      toast(`Compra confirmada · ${res.commissionsCreated} comisión(es) generada(s)`, 'success');
      setToConfirm(null);
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!toCancel) return;
    setBusy(true);
    try {
      await adminApi.post(`/admin/purchases/${toCancel.id}/cancel`);
      toast('Compra cancelada y comisiones reversadas', 'success');
      setToCancel(null);
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  const cols: Column<Purchase>[] = [
    { header: 'Cliente', cell: (p) => <span className="text-primary">{p.customerName}</span> },
    { header: 'Producto', cell: (p) => p.product?.name ?? '—' },
    { header: 'Monto', cell: (p) => formatCurrency(p.amount) },
    {
      header: 'Estado',
      cell: (p) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[p.status]}`}>{p.status}</span>
      ),
    },
    { header: 'Referido por', cell: (p) => p.referrer?.fullName ?? (p.referralCode ? `${p.referralCode} (?)` : '—') },
    { header: 'Fecha', cell: (p) => new Date(p.createdAt).toLocaleDateString('es-EC') },
    {
      header: '',
      cell: (p) => (
        <div className="flex gap-2">
          {p.status === 'pending' && (
            <Button size="sm" onClick={() => setToConfirm(p)}>Confirmar</Button>
          )}
          {isSuperadmin && (
            <Button size="sm" variant="outline" onClick={() => setEditing(p)}>Editar</Button>
          )}
          {p.status !== 'cancelled' && (
            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setToCancel(p)}>Cancelar</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-primary">Compras</h1>
        <Button onClick={() => setCreateOpen(true)}>+ Compra manual</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {['', 'pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${status === s ? 'bg-primary text-white' : 'bg-light text-brand-gray'}`}
          >
            {s || 'Todas'}
          </button>
        ))}
      </div>

      <DataTable columns={cols} rows={data ?? []} keyOf={(p) => p.id} loading={loading} empty="Sin compras." />

      <CreatePurchaseModal open={createOpen} onClose={() => setCreateOpen(false)} onSaved={reload} />
      <EditPurchaseModal purchase={editing} onClose={() => setEditing(null)} onSaved={reload} />

      <ConfirmModal
        open={!!toConfirm}
        title="Confirmar compra"
        message={`Confirmar la compra de ${toConfirm?.customerName}. Esto generará la comisión al referidor${toConfirm?.referrer ? ` (${toConfirm.referrer.fullName})` : ''}.`}
        confirmLabel="Confirmar y generar comisión"
        loading={busy}
        onConfirm={confirm}
        onClose={() => setToConfirm(null)}
      />
      <ConfirmModal
        open={!!toCancel}
        title="Cancelar compra"
        message="Se reversarán las comisiones generadas por esta compra."
        confirmLabel="Cancelar compra"
        danger
        loading={busy}
        onConfirm={cancel}
        onClose={() => setToCancel(null)}
      />
    </div>
  );
}

function CreatePurchaseModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productId, setProductId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) adminApi.get<AdminProduct[]>('/admin/products?active=true').then(setProducts).catch(() => {});
  }, [open]);

  async function save() {
    if (!productId || !customerName || !customerEmail) {
      toast('Producto, nombre y email requeridos', 'error');
      return;
    }
    setSaving(true);
    try {
      await adminApi.post('/admin/purchases', {
        productId,
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        amount: amount ? Number(amount) : undefined,
        referralCode: referralCode || null,
        notes: notes || null,
      });
      toast('Compra creada (pending)', 'success');
      onSaved();
      onClose();
      setProductId(''); setCustomerName(''); setCustomerEmail(''); setCustomerPhone(''); setAmount(''); setReferralCode(''); setNotes('');
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva compra manual">
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-primary">Producto</span>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full rounded-lg border border-black/15 bg-white px-4 py-3 text-sm">
            <option value="">— Selecciona —</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.promoPrice ?? p.price)})</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Cliente" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          <Input label="Email" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Teléfono" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
          <Input label="Monto (opcional)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <Input label="Código de referido (opcional)" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="3IP-XXXXXX" />
        <Textarea label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Crear compra'}</Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Edición manual de una compra (solo superadmin). Permite corregir producto,
 * monto, datos del cliente y el código de referido. Si la compra ya estaba
 * confirmada, ofrece regenerar las comisiones con los datos corregidos:
 * reversa las existentes y vuelve a confirmar.
 */
function EditPurchaseModal({
  purchase,
  onClose,
  onSaved,
}: {
  purchase: Purchase | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productId, setProductId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [notes, setNotes] = useState('');
  const [regenerate, setRegenerate] = useState(false);
  const [saving, setSaving] = useState(false);

  const wasConfirmed = purchase?.status === 'confirmed' || purchase?.status === 'completed';

  useEffect(() => {
    if (!purchase) return;
    adminApi.get<AdminProduct[]>('/admin/products?active=true').then(setProducts).catch(() => {});
    setProductId(purchase.productId ?? '');
    setCustomerName(purchase.customerName);
    setCustomerEmail(purchase.customerEmail);
    setCustomerPhone(purchase.customerPhone ?? '');
    setAmount(String(purchase.amount));
    setReferralCode(purchase.referralCode ?? '');
    setNotes(purchase.notes ?? '');
    setRegenerate(false);
  }, [purchase]);

  async function save() {
    if (!purchase) return;
    setSaving(true);
    try {
      const res = await adminApi.patch<{ regenerated: { commissionsCreated: number } | null }>(
        `/admin/purchases/${purchase.id}`,
        {
          productId,
          amount: Number(amount),
          customerName,
          customerEmail,
          customerPhone,
          referralCode: referralCode.trim() || null,
          notes,
          regenerateCommissions: regenerate,
        },
      );
      toast(
        res.regenerated
          ? `Compra actualizada · ${res.regenerated.commissionsCreated} comisión(es) regenerada(s)`
          : 'Compra actualizada',
        'success',
      );
      onSaved();
      onClose();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={!!purchase} onClose={onClose} title="Editar compra">
      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-primary">Producto</span>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full rounded-lg border border-black/15 bg-white px-4 py-3 text-sm"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({formatCurrency(p.promoPrice ?? p.price)})
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Cliente" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          <Input label="Email" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Teléfono" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
          <Input label="Monto" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <Input
          label="Código de referido"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          placeholder="3IP-XXXXXX (vacío = sin referidor)"
        />
        <p className="text-xs text-brand-gray">
          Si el comprador ya es socio, la comisión se acredita siempre a su referidor real,
          sin importar el código que se ponga aquí.
        </p>
        <Textarea label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} />

        {wasConfirmed && (
          <label className="flex cursor-pointer items-start gap-2 rounded-xl bg-light p-3 text-sm">
            <input
              type="checkbox"
              checked={regenerate}
              onChange={(e) => setRegenerate(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--color-secondary)]"
            />
            <span className="text-brand-gray">
              <strong className="text-primary">Regenerar comisiones.</strong> Reversa las comisiones
              actuales de esta compra (devolviendo el saldo si ya estaba acreditado) y las vuelve a
              generar con los datos corregidos.
            </span>
          </label>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</Button>
        </div>
      </div>
    </Modal>
  );
}

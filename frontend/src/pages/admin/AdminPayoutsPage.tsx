import { useState } from 'react';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAdminGet } from '@/hooks/useAdminAPI';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency } from '@/lib/utils';

interface AdminPayout {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  paidAt: string | null;
  createdAt: string;
  member: { fullName: string; email: string; payoutMethod: string | null; payoutEmail: string | null };
}

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Solicitado', cls: 'bg-red-100 text-red-700' },
  processing: { label: 'En proceso', cls: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Pagado', cls: 'bg-green-100 text-green-700' },
  failed: { label: 'Fallido', cls: 'bg-gray-200 text-gray-600' },
};

const FILTERS = ['', 'pending', 'processing', 'paid', 'failed'];

export default function AdminPayoutsPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState('');
  const { data, loading, reload } = useAdminGet<AdminPayout[]>(
    `/admin/payouts${filter ? `?status=${filter}` : ''}`,
  );
  const [paying, setPaying] = useState<AdminPayout | null>(null);
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);

  async function update(id: string, status: string, ref?: string) {
    setBusy(true);
    try {
      await adminApi.patch(`/admin/payouts/${id}`, { status, ...(ref ? { reference: ref } : {}) });
      toast('Retiro actualizado', 'success');
      setPaying(null);
      setReference('');
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  const cols: Column<AdminPayout>[] = [
    {
      header: 'Socio',
      cell: (p) => (
        <div>
          <p className="font-medium text-primary">{p.member.fullName}</p>
          <p className="text-xs text-brand-gray">{p.member.payoutEmail ?? p.member.email}</p>
        </div>
      ),
    },
    { header: 'Monto', cell: (p) => <span className="font-semibold text-primary">{formatCurrency(p.amount)}</span> },
    { header: 'Método', cell: (p) => <span className="capitalize">{p.method}</span> },
    {
      header: 'Estado',
      cell: (p) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS[p.status].cls}`}>
          {STATUS[p.status].label}
        </span>
      ),
    },
    { header: 'Ref.', cell: (p) => p.reference ?? '—' },
    { header: 'Fecha', cell: (p) => new Date(p.createdAt).toLocaleDateString('es-EC') },
    {
      header: '',
      cell: (p) => (
        <div className="flex gap-2">
          {p.status === 'pending' && (
            <Button size="sm" variant="outline" onClick={() => update(p.id, 'processing')}>
              Procesar
            </Button>
          )}
          {(p.status === 'pending' || p.status === 'processing') && (
            <>
              <Button size="sm" onClick={() => { setPaying(p); setReference(''); }}>
                Marcar pagado
              </Button>
              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => update(p.id, 'failed')}>
                Fallido
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-primary">Retiros</h1>
      <p className="text-sm text-brand-gray">
        Solicitudes de retiro de comisiones. "Fallido" devuelve el monto al saldo del socio.
      </p>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${filter === s ? 'bg-primary text-white' : 'bg-light text-brand-gray'}`}
          >
            {s ? STATUS[s].label : 'Todos'}
          </button>
        ))}
      </div>

      <DataTable columns={cols} rows={data ?? []} keyOf={(p) => p.id} loading={loading} empty="Sin retiros." />

      <Modal open={!!paying} onClose={() => setPaying(null)} title="Confirmar pago">
        {paying && (
          <div className="space-y-4">
            <p className="text-sm text-brand-gray">
              Marcar como pagado el retiro de{' '}
              <strong className="text-primary">{formatCurrency(paying.amount)}</strong> a{' '}
              {paying.member.fullName} ({paying.member.payoutMethod ?? paying.method}).
            </p>
            <Input
              label="Referencia / comprobante (opcional)"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="N° transferencia, ID PayPal…"
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setPaying(null)}>Cancelar</Button>
              <Button onClick={() => update(paying.id, 'paid', reference)} disabled={busy}>
                {busy ? 'Guardando…' : 'Confirmar pago'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

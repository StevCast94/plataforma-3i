import { useState } from 'react';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAdminGet } from '@/hooks/useAdminAPI';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency } from '@/lib/utils';
import { COMMISSION_BADGE } from '@/lib/referral';
import type { AdminCommission } from '@/lib/adminTypes';
import type { CommissionStatus } from '@shared/types';

const STATES: (CommissionStatus | 'ALL')[] = ['ALL', 'PENDING', 'CONFIRMED', 'LIQUIDATED', 'PAID', 'REVERSED'];

export default function AdminCommissionsPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>('');
  const { data, loading, reload } = useAdminGet<AdminCommission[]>(
    `/admin/commissions?${new URLSearchParams(filter ? { status: filter } : {})}`,
  );
  const [resolving, setResolving] = useState<AdminCommission | null>(null);
  const [busy, setBusy] = useState(false);

  async function resolve(resolution: 'member' | 'club' | 'split') {
    if (!resolving) return;
    setBusy(true);
    try {
      await adminApi.post(`/admin/commissions/${resolving.id}/resolve`, { resolution });
      toast('Disputa resuelta', 'success');
      setResolving(null);
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  const cols: Column<AdminCommission>[] = [
    { header: 'Miembro', cell: (c) => <span className="text-primary">{c.member.fullName}</span> },
    { header: 'Referido', cell: (c) => c.referral?.referred.fullName ?? c.purchase?.customerName ?? '—' },
    { header: 'Producto', cell: (c) => c.product?.name ?? '—' },
    { header: 'Nivel', cell: (c) => `N${c.level}` },
    { header: 'Monto', cell: (c) => <span className="font-semibold">{formatCurrency(c.amount)}</span> },
    { header: 'Tasa', cell: (c) => (c.type === 'fixed' ? 'Fijo' : `${(c.rate * 100).toFixed(0)}%`) },
    {
      header: 'Estado',
      cell: (c) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${COMMISSION_BADGE[c.status].className}`}>
          {COMMISSION_BADGE[c.status].label}
        </span>
      ),
    },
    {
      header: '',
      cell: (c) => (
        <Button size="sm" variant="outline" onClick={() => setResolving(c)}>Resolver</Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-primary">Comisiones</h1>

      <div className="flex flex-wrap gap-2">
        {STATES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s === 'ALL' ? '' : s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              (s === 'ALL' && !filter) || filter === s ? 'bg-primary text-white' : 'bg-light text-brand-gray'
            }`}
          >
            {s === 'ALL' ? 'Todas' : COMMISSION_BADGE[s].label}
          </button>
        ))}
      </div>

      <DataTable columns={cols} rows={data ?? []} keyOf={(c) => c.id} loading={loading} empty="Sin comisiones." />

      <Modal open={!!resolving} onClose={() => setResolving(null)} title="Resolver disputa">
        {resolving && (
          <div className="space-y-4">
            <p className="text-sm text-brand-gray">
              Comisión de <strong className="text-primary">{formatCurrency(resolving.amount)}</strong> para{' '}
              {resolving.member.fullName}.
            </p>
            <div className="grid gap-3">
              <Button onClick={() => resolve('member')} disabled={busy}>A favor del miembro (confirmar)</Button>
              <Button variant="outline" onClick={() => resolve('split')} disabled={busy}>Dividir (50%)</Button>
              <Button variant="ghost" className="text-red-600" onClick={() => resolve('club')} disabled={busy}>
                A favor del Club (reversar)
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

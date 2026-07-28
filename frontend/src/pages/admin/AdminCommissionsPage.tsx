import { useState } from 'react';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAdminGet } from '@/hooks/useAdminAPI';
import { useAdminAuth } from '@/hooks/useAdminAuth';
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
  const [editing, setEditing] = useState<AdminCommission | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editStatus, setEditStatus] = useState<CommissionStatus>('PENDING');
  const [editReason, setEditReason] = useState('');
  const [creating, setCreating] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newLevel, setNewLevel] = useState('1');
  const [newReason, setNewReason] = useState('');
  const [busy, setBusy] = useState(false);
  const { isSuperadmin } = useAdminAuth();

  function openEdit(c: AdminCommission) {
    setEditing(c);
    setEditAmount(String(c.amount));
    setEditStatus(c.status);
    setEditReason('');
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(true);
    try {
      await adminApi.patch(`/admin/commissions/${editing.id}`, {
        amount: Number(editAmount),
        status: editStatus,
        reason: editReason || undefined,
      });
      toast('Comisión ajustada', 'success');
      setEditing(null);
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function createManual() {
    setBusy(true);
    try {
      await adminApi.post('/admin/commissions', {
        memberId: newMemberId.trim(),
        amount: Number(newAmount),
        level: Number(newLevel),
        reason: newReason || undefined,
      });
      toast('Comisión creada', 'success');
      setCreating(false);
      setNewMemberId('');
      setNewAmount('');
      setNewReason('');
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

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
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setResolving(c)}>Resolver</Button>
          {isSuperadmin && (
            <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>Ajustar</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-primary">Comisiones</h1>
        {isSuperadmin && (
          <Button size="sm" onClick={() => setCreating(true)}>+ Comisión manual</Button>
        )}
      </div>

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

      {/* Ajuste manual de una comisión */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Ajustar comisión">
        {editing && (
          <div className="space-y-4">
            <p className="text-sm text-brand-gray">
              Comisión de <strong className="text-primary">{editing.member.fullName}</strong> ·{' '}
              Nivel {editing.level} · {editing.product?.name ?? 'sin producto'}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-brand-gray">Monto (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-brand-gray">Estado</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as CommissionStatus)}
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                >
                  {STATES.filter((s) => s !== 'ALL').map((s) => (
                    <option key={s} value={s}>{COMMISSION_BADGE[s as CommissionStatus].label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-brand-gray">Motivo (queda en auditoría)</label>
              <input
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Ej: corrección por auto-referido"
                className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
              />
            </div>

            <p className="rounded-lg bg-light p-3 text-xs text-brand-gray">
              Si la comisión ya estaba acreditada (Liquidada/Pagada), el saldo del socio se
              ajusta automáticamente por la diferencia.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)} disabled={busy}>Cancelar</Button>
              <Button onClick={saveEdit} disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Crear comisión manual */}
      <Modal open={creating} onClose={() => setCreating(false)} title="Crear comisión manual">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-brand-gray">ID del miembro</label>
            <input
              value={newMemberId}
              onChange={(e) => setNewMemberId(e.target.value)}
              placeholder="Cópialo desde el detalle del miembro"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-brand-gray">Monto (USD)</label>
              <input
                type="number"
                step="0.01"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-brand-gray">Nivel</label>
              <select
                value={newLevel}
                onChange={(e) => setNewLevel(e.target.value)}
                className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
              >
                <option value="1">Nivel 1</option>
                <option value="2">Nivel 2</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-brand-gray">Motivo (queda en auditoría)</label>
            <input
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="Ej: compensación por comisión perdida"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreating(false)} disabled={busy}>Cancelar</Button>
            <Button onClick={createManual} disabled={busy || !newMemberId || !newAmount}>
              {busy ? 'Creando…' : 'Crear'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

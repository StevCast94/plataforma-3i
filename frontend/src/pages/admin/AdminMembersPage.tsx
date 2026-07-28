import { useState } from 'react';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AdminMemberDetail } from './AdminMemberDetail';
import { WhatsAppButton } from '@/components/admin/WhatsAppButton';
import { useAdminGet } from '@/hooks/useAdminAPI';
import { formatCurrency } from '@/lib/utils';
import { statusLabel } from '@/lib/referral';
import type { AdminMemberRow, AdminMembersResponse } from '@/lib/adminTypes';

export default function AdminMembersPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [kyc, setKyc] = useState('');
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({
    ...(q ? { q } : {}),
    ...(status ? { status } : {}),
    ...(kyc ? { kyc } : {}),
    page: String(page),
  });
  const { data, loading, reload } = useAdminGet<AdminMembersResponse>(`/admin/members?${params}`);
  const [selected, setSelected] = useState<string | null>(null);

  const cols: Column<AdminMemberRow>[] = [
    { header: 'Nombre', cell: (m) => <span className="font-medium text-primary">{m.fullName}</span> },
    { header: 'Email', cell: (m) => <span className="text-sm text-brand-gray">{m.email}</span> },
    { header: 'WhatsApp', cell: (m) => <WhatsAppButton phone={m.phone} name={m.fullName} variant="icon" /> },
    { header: 'Estatus', cell: (m) => <Badge variant={m.status === 'ELITE' ? 'gold' : 'light'}>{statusLabel(m.status)}</Badge> },
    { header: 'KYC', cell: (m) => (m.kycVerified ? '✅' : '⏳') },
    {
      header: 'Referidor',
      cell: (m) =>
        m.referrer ? (
          <span className="text-sm text-primary">{m.referrer.fullName}</span>
        ) : (
          <span className="text-xs text-brand-gray">—</span>
        ),
    },
    { header: 'Referidos', cell: (m) => `${m.totalReferrals}` },
    { header: 'Ganado', cell: (m) => formatCurrency(m.totalEarned) },
    { header: 'Registro', cell: (m) => new Date(m.createdAt).toLocaleDateString('es-EC') },
  ];

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-primary">Miembros</h1>

      <div className="flex flex-wrap gap-3">
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Buscar nombre/email…" className="rounded-lg border border-black/15 px-3 py-2 text-sm" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-lg border border-black/15 px-3 py-2 text-sm">
          <option value="">Todos</option>
          <option value="PREMIERE">Premiere</option>
          <option value="ELITE">Elite</option>
          <option value="SUSPENDED">Suspendidos</option>
        </select>
        <select value={kyc} onChange={(e) => { setKyc(e.target.value); setPage(1); }} className="rounded-lg border border-black/15 px-3 py-2 text-sm">
          <option value="">KYC: todos</option>
          <option value="true">Verificados</option>
          <option value="false">Pendientes</option>
        </select>
      </div>

      <DataTable
        columns={cols}
        rows={data?.items ?? []}
        keyOf={(m) => m.id}
        loading={loading}
        onRowClick={(m) => setSelected(m.id)}
        empty="No hay miembros."
      />

      {/* Paginación */}
      <div className="flex items-center justify-between text-sm text-brand-gray">
        <span>{data?.total ?? 0} miembros</span>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
          <span>{page} / {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
        </div>
      </div>

      <AdminMemberDetail memberId={selected} onClose={() => setSelected(null)} onChanged={reload} />
    </div>
  );
}

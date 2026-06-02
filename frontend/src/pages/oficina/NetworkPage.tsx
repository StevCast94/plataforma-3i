import { useState } from 'react';
import { Seo } from '@/components/shared/Seo';
import { ReferralTree } from '@/components/oficina/ReferralTree';
import { Badge } from '@/components/ui/Badge';
import { useReferralTree, useReferrals } from '@/hooks/useReferrals';
import { formatCurrency } from '@/lib/utils';
import { statusLabel } from '@/lib/referral';
import { cn } from '@/lib/utils';

type View = 'tree' | 'list';
type Filter = 'all' | 'active' | 'pending' | 'inactive';

export default function NetworkPage() {
  const { data: tree, loading } = useReferralTree();
  const { data: list } = useReferrals();
  const [view, setView] = useState<View>('tree');
  const [filter, setFilter] = useState<Filter>('all');

  const stats = tree?.stats;
  const totalCommissions = (list ?? []).reduce((s, r) => s + r.commissionsGenerated, 0);
  const conversion =
    stats && stats.total > 0
      ? Math.round(((list ?? []).filter((r) => r.firstPurchaseAt).length / stats.total) * 100)
      : 0;

  const filtered = (list ?? []).filter((r) =>
    filter === 'all' ? true : r.status === filter,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Seo title="Mi Red — Oficina Virtual" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-primary">Mi Red</h1>
        <div className="flex gap-2">
          <ToggleBtn active={view === 'tree'} onClick={() => setView('tree')}>
            Árbol
          </ToggleBtn>
          <ToggleBtn active={view === 'list'} onClick={() => setView('list')}>
            Lista
          </ToggleBtn>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatBox label="Miembros en red" value={`${stats?.total ?? 0}`} />
        <StatBox label="Tasa de conversión" value={`${conversion}%`} />
        <StatBox label="Comisiones generadas" value={formatCurrency(totalCommissions)} />
      </div>

      {loading && <p className="text-brand-gray">Cargando red…</p>}

      {!loading && view === 'tree' && <ReferralTree nodes={tree?.level1 ?? []} />}

      {!loading && view === 'list' && (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="flex flex-wrap gap-2 border-b border-black/5 p-4">
            {(['all', 'active', 'pending', 'inactive'] as Filter[]).map((f) => (
              <ToggleBtn key={f} active={filter === f} onClick={() => setFilter(f)}>
                {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : f === 'pending' ? 'Pendientes' : 'Inactivos'}
              </ToggleBtn>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/5 text-xs uppercase tracking-wider text-brand-gray">
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Nivel</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Registro</th>
                  <th className="px-4 py-3">Compra</th>
                  <th className="px-4 py-3">Comisiones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-brand-gray">
                      Sin referidos en esta categoría.
                    </td>
                  </tr>
                )}
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-black/5">
                    <td className="px-4 py-3 text-sm text-primary">{r.referred.fullName}</td>
                    <td className="px-4 py-3 text-sm">Nivel {r.level}</td>
                    <td className="px-4 py-3">
                      <Badge variant={r.referred.status === 'ELITE' ? 'gold' : 'light'}>
                        {statusLabel(r.referred.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-gray">
                      {new Date(r.registeredAt).toLocaleDateString('es-EC')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {r.firstPurchaseAt ? '✓' : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-primary">
                      {formatCurrency(r.commissionsGenerated)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition',
        active ? 'bg-primary text-white' : 'bg-light text-brand-gray hover:text-primary',
      )}
    >
      {children}
    </button>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <p className="text-xs uppercase tracking-wider text-brand-gray">{label}</p>
      <p className="mt-2 font-serif text-2xl font-bold text-primary">{value}</p>
    </div>
  );
}

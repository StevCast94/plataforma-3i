import { StatsCard } from '@/components/admin/StatsCard';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { useAdminGet } from '@/hooks/useAdminAPI';
import { formatCurrency } from '@/lib/utils';
import type { AdminStats } from '@/lib/adminTypes';

type Recent = AdminStats['recentPurchases'][number];

export default function AdminDashboardPage() {
  const { data, loading } = useAdminGet<AdminStats>('/admin/stats');

  const maxSales = Math.max(1, ...(data?.months ?? []).map((m) => m.sales));
  const maxMembers = Math.max(1, ...(data?.months ?? []).map((m) => m.members));

  const cols: Column<Recent>[] = [
    { header: 'Cliente', cell: (r) => r.customerName },
    { header: 'Producto', cell: (r) => r.product?.name ?? '—' },
    { header: 'Monto', cell: (r) => formatCurrency(r.amount) },
    {
      header: 'Estado',
      cell: (r) => <span className="capitalize">{r.status}</span>,
    },
    {
      header: 'Fecha',
      cell: (r) => new Date(r.createdAt).toLocaleDateString('es-EC'),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Dashboard</h1>

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Ventas del mes"
          value={formatCurrency(data?.salesMonth.total ?? 0)}
          hint={`${data?.salesMonth.count ?? 0} compras`}
          accent
        />
        <StatsCard label="Comisiones pagadas" value={formatCurrency(data?.commissionsPaidMonth ?? 0)} />
        <StatsCard
          label="Miembros activos"
          value={`${data?.activeMembers.total ?? 0}`}
          hint={`${data?.activeMembers.premiere ?? 0} Premiere · ${data?.activeMembers.elite ?? 0} Elite`}
        />
        <StatsCard
          label="Compras pendientes"
          value={`${data?.alerts.pendingPurchases ?? 0}`}
          hint="por confirmar"
        />
      </div>

      {/* Alertas */}
      {data && (data.alerts.kycPending > 0 || data.alerts.disputed > 0 || data.alerts.pendingPurchases > 0) && (
        <div className="flex flex-wrap gap-3">
          {data.alerts.kycPending > 0 && (
            <Alert text={`${data.alerts.kycPending} KYC pendientes`} />
          )}
          {data.alerts.disputed > 0 && (
            <Alert text={`${data.alerts.disputed} comisiones en revisión`} />
          )}
          {data.alerts.pendingPurchases > 0 && (
            <Alert text={`${data.alerts.pendingPurchases} compras sin confirmar`} />
          )}
        </div>
      )}

      {/* Gráficos CSS */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h3 className="mb-4 text-sm font-semibold text-primary">Ventas (últimos 6 meses)</h3>
          <div className="flex h-40 items-end gap-3">
            {(data?.months ?? []).map((m) => (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-secondary"
                  style={{ height: `${(m.sales / maxSales) * 100}%`, minHeight: 2 }}
                  title={formatCurrency(m.sales)}
                />
                <span className="text-[10px] capitalize text-brand-gray">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h3 className="mb-4 text-sm font-semibold text-primary">Miembros nuevos por mes</h3>
          <div className="flex h-40 items-end gap-3">
            {(data?.months ?? []).map((m) => (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-accent"
                  style={{ height: `${(m.members / maxMembers) * 100}%`, minHeight: 2 }}
                  title={`${m.members} miembros`}
                />
                <span className="text-[10px] capitalize text-brand-gray">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top productos */}
      {(data?.topProducts.length ?? 0) > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h3 className="mb-4 text-sm font-semibold text-primary">Productos más vendidos</h3>
          <ul className="space-y-2">
            {data!.topProducts.map((p) => (
              <li key={p.name} className="flex justify-between text-sm">
                <span className="text-primary">{p.name}</span>
                <span className="text-brand-gray">
                  {p.count} · {formatCurrency(p.total)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Últimas transacciones */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-primary">Últimas transacciones</h3>
        <DataTable
          columns={cols}
          rows={data?.recentPurchases ?? []}
          keyOf={(r) => r.id}
          loading={loading}
          empty="Sin transacciones aún."
        />
      </div>
    </div>
  );
}

function Alert({ text }: { text: string }) {
  return (
    <span className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-800">
      ⚠️ {text}
    </span>
  );
}

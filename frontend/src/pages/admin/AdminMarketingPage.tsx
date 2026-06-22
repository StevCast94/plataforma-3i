import { DataTable, type Column } from '@/components/admin/DataTable';
import { useAdminGet } from '@/hooks/useAdminAPI';
import { formatCurrency } from '@/lib/utils';

interface Funnel {
  clicks: number;
  registrations: number;
  leads: number;
  attributedLeads: number;
  sales: number;
  attributedSales: number;
  salesAmount: number;
  rates: { clickToLead: number; leadToSale: number; attributedLeadShare: number };
}

interface TopReferrer {
  memberId: string;
  name: string;
  code: string;
  status: string;
  referrals: number;
  sales: number;
  salesAmount: number;
  earned: number;
}

export default function AdminMarketingPage() {
  const { data: funnel } = useAdminGet<Funnel>('/admin/marketing/funnel');
  const { data: top, loading } = useAdminGet<TopReferrer[]>('/admin/marketing/top-referrers');

  const steps = [
    { label: 'Clicks en enlaces', value: funnel?.clicks ?? 0, hint: 'Visitas vía enlace de referido' },
    { label: 'Registros', value: funnel?.registrations ?? 0, hint: 'Se unieron como socios' },
    { label: 'Leads', value: funnel?.leads ?? 0, hint: `${funnel?.attributedLeads ?? 0} atribuidos a un referidor` },
    { label: 'Ventas', value: funnel?.sales ?? 0, hint: formatCurrency(funnel?.salesAmount ?? 0) },
  ];

  const cols: Column<TopReferrer>[] = [
    { header: 'Referidor', cell: (r) => <span className="font-medium text-primary">{r.name}</span> },
    { header: 'Código', cell: (r) => <span className="text-xs text-secondary">{r.code}</span> },
    { header: 'Estatus', cell: (r) => r.status },
    { header: 'Referidos', cell: (r) => r.referrals },
    { header: 'Ventas', cell: (r) => r.sales },
    { header: 'Monto vendido', cell: (r) => formatCurrency(r.salesAmount) },
    { header: 'Comisión ganada', cell: (r) => <span className="font-semibold text-primary">{formatCurrency(r.earned)}</span> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Marketing y conversión</h1>

      {/* Embudo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div key={s.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <p className="text-xs uppercase tracking-wider text-brand-gray">{s.label}</p>
            <p className="mt-1 font-serif text-3xl font-bold text-primary">{s.value}</p>
            <p className="mt-1 text-xs text-brand-gray">{s.hint}</p>
            {i > 0 && (
              <p className="mt-2 text-xs font-medium text-accent">
                {i === 2 && `${funnel?.rates.clickToLead ?? 0}% de clicks`}
                {i === 3 && `${funnel?.rates.leadToSale ?? 0}% de leads`}
              </p>
            )}
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold text-primary">Top referidores</h2>
        <DataTable columns={cols} rows={top ?? []} keyOf={(r) => r.memberId} loading={loading} empty="Aún no hay ventas atribuidas." />
      </div>
    </div>
  );
}

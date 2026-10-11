import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency } from '@/lib/utils';
import { LEAD_SOURCE_LABEL, SALE_STATUS_LABEL, type DevSale, type SaleInstallment } from '@/lib/developerApi';

// Ventas de proyectos de terceros: confirmar, devolver o anular, y marcar cada cuota
// como cobrada (eso genera las comisiones de los referidores).

type AdminSale = Omit<DevSale, 'installments' | 'totals' | 'project' | 'lead'> & {
  lead: DevSale['lead'] & { referralCode: string | null };
  project: { name: string; developer: { name: string } | null };
  installments: (SaleInstallment & { commissions: { amount: number; level: number; member: { fullName: string } }[] })[];
  totals: DevSale['totals'] & { commissions: number; net: number };
};
interface Alert { code: string; projectId: string; project: { name: string; developer: { name: string } | null } }

export function AdminDeveloperSales() {
  const { toast } = useToast();
  const [sales, setSales] = useState<AdminSale[] | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const load = useCallback(() => {
    adminApi.get<AdminSale[]>('/admin/developers/sales').then(setSales).catch(() => setSales([]));
    adminApi.get<Alert[]>('/admin/developers/alerts').then(setAlerts).catch(() => setAlerts([]));
  }, []);
  useEffect(load, [load]);

  async function review(s: AdminSale, decision: 'confirm' | 'reject' | 'cancel') {
    let note: string | null = null;
    if (decision !== 'confirm') {
      note = window.prompt(decision === 'reject' ? '¿Qué debe corregir el desarrollador?' : 'Motivo del desistimiento')?.trim() || null;
      if (!note) return;
    } else if (!window.confirm(`¿Confirmar la venta de ${s.lead.name} por ${formatCurrency(s.price)}? El solar pasará a Vendido.`)) return;
    try {
      await adminApi.post(`/admin/developers/sales/${s.id}/review`, { decision, note });
      load();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  async function collect(i: SaleInstallment) {
    if (!window.confirm(`¿Confirmas que el desarrollador ya pagó ${formatCurrency(i.feeAmount)}? Se generarán las comisiones de los referidores.`)) return;
    try {
      const r = await adminApi.post<{ commissions: { amount: number }[] }>(`/admin/developers/installments/${i.id}/collect`);
      toast(r.commissions.length ? `Cobrado · ${r.commissions.length} comisión(es) generadas` : 'Cobrado', 'success');
      load();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  if (!sales) return null;
  const owed = sales.reduce((a, s) => a + (s.status === 'CONFIRMED' ? s.totals.feeTotal - s.totals.feeCollected : 0), 0);
  const net = sales.reduce((a, s) => a + s.totals.net, 0);

  return (
    <div className="mt-8">
      {alerts.length > 0 && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <strong>⚠️ Solares vendidos sin venta declarada:</strong>{' '}
          {alerts.map((a) => `${a.code} (${a.project.name})`).join(', ')}. Pídele al desarrollador que la declare.
        </div>
      )}
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-serif text-xl font-bold text-primary">Ventas de terceros</h2>
        <div className="flex gap-3 text-right text-sm">
          <div className="rounded-xl bg-white px-4 py-2 shadow-sm">
            <p className="text-xs text-brand-gray">Por cobrar a desarrolladores</p>
            <p className="font-bold text-primary">{formatCurrency(owed)}</p>
          </div>
          <div className="rounded-xl bg-white px-4 py-2 shadow-sm">
            <p className="text-xs text-brand-gray">Neto Grupo 3i (cobrado − comisiones)</p>
            <p className="font-bold text-primary">{formatCurrency(net)}</p>
          </div>
        </div>
      </div>
      {sales.length === 0 ? (
        <p className="rounded-xl border-2 border-dashed border-black/10 p-6 text-center text-sm text-brand-gray">Aún no hay ventas declaradas.</p>
      ) : (
        <div className="space-y-3">
          {sales.map((s) => {
            const st = SALE_STATUS_LABEL[s.status];
            return (
              <div key={s.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-primary">
                      {s.lead.name} · {s.project.name}
                      {s.lotCode && ` · Solar ${s.lotCode}`}
                    </p>
                    <p className="text-xs text-brand-gray">
                      {s.project.developer?.name} · {formatCurrency(s.price)} · {s.paymentType === 'CASH' ? 'contado' : 'financiado'} ·{' '}
                      {Math.round(s.feeRate * 1000) / 10} % · {LEAD_SOURCE_LABEL[s.lead.source].text}
                      {s.lead.referralCode && ` (${s.lead.referralCode})`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.text}</span>
                    {s.status === 'DECLARED' && (
                      <>
                        <Button size="sm" onClick={() => review(s, 'confirm')}>Confirmar</Button>
                        <Button size="sm" variant="outline" onClick={() => review(s, 'reject')}>Devolver</Button>
                      </>
                    )}
                    {s.status === 'CONFIRMED' && (
                      <button onClick={() => review(s, 'cancel')} className="text-xs text-brand-gray hover:underline">Desistimiento</button>
                    )}
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-xs">
                  {s.installments.map((i) => (
                    <li key={i.id} className={`flex flex-wrap items-center justify-between gap-2 ${i.voided ? 'text-brand-gray line-through' : ''}`}>
                      <span>
                        {new Date(i.paidAt).toLocaleDateString('es-EC')} · pago {formatCurrency(i.amount)} → comisión {formatCurrency(i.feeAmount)}
                        {i.receiptUrl && (
                          <a href={i.receiptUrl} target="_blank" rel="noreferrer" className="ml-2 text-secondary hover:underline">comprobante</a>
                        )}
                        {i.commissions.length > 0 &&
                          ` · referidores: ${i.commissions.map((c) => `${c.member.fullName} N${c.level} ${formatCurrency(c.amount)}`).join(', ')}`}
                      </span>
                      {i.collectedAt ? (
                        <span className="text-green-700">✓ cobrada</span>
                      ) : !i.voided && s.status === 'CONFIRMED' ? (
                        <button onClick={() => collect(i)} className="font-semibold text-secondary hover:underline">Marcar cobrada</button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/components/shared/Toast';

export default function AdminReportsPage() {
  const { toast } = useToast();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  function range() {
    const p = new URLSearchParams({ format: 'csv' });
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    return p.toString();
  }

  async function download(kind: 'sales' | 'commissions') {
    try {
      await adminApi.download(
        `/admin/report/${kind}?${range()}`,
        `reporte-${kind === 'sales' ? 'ventas' : 'comisiones'}.csv`,
      );
      toast('Descarga iniciada', 'success');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-primary">Reportes</h1>

      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-lg text-primary">Rango de fechas</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Input label="Desde" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="Hasta" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
          <span className="text-3xl">🧾</span>
          <h3 className="mt-2 text-lg text-primary">Reporte de ventas</h3>
          <p className="mt-1 text-sm text-brand-gray">Compras con cliente, producto, referidor y comisión.</p>
          <Button className="mt-4" onClick={() => download('sales')}>Exportar CSV</Button>
        </div>
        <div className="rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
          <span className="text-3xl">💰</span>
          <h3 className="mt-2 text-lg text-primary">Reporte de comisiones</h3>
          <p className="mt-1 text-sm text-brand-gray">Comisiones por miembro, nivel, monto y estado.</p>
          <Button className="mt-4" onClick={() => download('commissions')}>Exportar CSV</Button>
        </div>
      </div>
    </div>
  );
}

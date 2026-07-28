import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { Seo } from '@/components/shared/Seo';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/shared/ErrorState';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

// ============================================================
// COMPROBANTE DE COMPRA — público, imprimible, se comparte por WhatsApp.
// No requiere sesión: el id (uuid) de la compra funciona como token de
// acceso. Solo expone lo necesario para el comprobante (ver purchases.ts).
// ============================================================

interface Confirmation {
  id: string;
  customerName: string;
  amount: number;
  status: string;
  confirmedAt: string | null;
  createdAt: string;
  product: { name: string; type: string };
  referrer: { fullName: string } | null;
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente de confirmación',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

export default function PurchaseConfirmationPage() {
  const { id } = useParams();
  const { data, loading, error } = useFetch<Confirmation>(
    () => api.get<Confirmation>(`/purchases/${id}/confirmation`),
    [id],
  );

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-brand-gray">Cargando…</div>;
  }
  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <ErrorState message="Comprobante no encontrado." />
      </div>
    );
  }

  const date = data.confirmedAt ?? data.createdAt;

  return (
    <div className="min-h-screen bg-light py-10 print:bg-white print:py-0">
      <Seo title={`Comprobante · ${data.product.name} — Grupo 3i`} />

      <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-xl print:rounded-none print:shadow-none sm:p-10">
        <div className="flex items-center justify-between border-b border-black/10 pb-6">
          <div>
            <p className="font-serif text-2xl font-bold text-primary">
              Grupo<span className="text-secondary"> 3i</span>
            </p>
            <p className="text-xs uppercase tracking-widest text-brand-gray">Comprobante de compra</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              data.status === 'confirmed' || data.status === 'completed'
                ? 'bg-green-100 text-green-700'
                : data.status === 'cancelled'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-200 text-gray-700'
            }`}
          >
            {STATUS_LABEL[data.status] ?? data.status}
          </span>
        </div>

        <div className="mt-6 space-y-4">
          <Row label="Cliente" value={data.customerName} />
          <Row label="Producto" value={data.product.name} />
          <Row label="Monto" value={<span className="font-serif text-2xl font-bold text-primary">{formatCurrency(data.amount)}</span>} />
          {data.referrer && <Row label="Referido por" value={data.referrer.fullName} />}
          <Row label="Fecha" value={new Date(date).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })} />
          <Row label="N.º de comprobante" value={<span className="font-mono text-xs">{data.id}</span>} />
        </div>

        <p className="mt-8 text-center text-xs text-brand-gray">
          Este comprobante certifica el registro de tu compra en Grupo 3i. Ante cualquier duda,
          contáctanos por WhatsApp o escribe a info@grupo3i.com.
        </p>

        <div className="mt-6 flex justify-center print:hidden">
          <Button variant="outline" onClick={() => window.print()}>
            Descargar / Imprimir PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-brand-gray">{label}</span>
      <span className="text-right font-medium text-primary">{value}</span>
    </div>
  );
}

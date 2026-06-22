import { useState } from 'react';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/Button';
import { useAdminGet } from '@/hooks/useAdminAPI';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/components/shared/Toast';

interface Lead {
  id: string;
  kind: 'product' | 'contact';
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  intent: string;
  productName: string | null;
  source: string | null;
  referralCode: string | null;
  status: string;
  createdAt: string;
}

const INTENT_LABEL: Record<string, { label: string; cls: string }> = {
  info: { label: 'Info', cls: 'bg-gray-100 text-gray-700' },
  whatsapp: { label: 'WhatsApp', cls: 'bg-green-100 text-green-700' },
  visit: { label: 'Visita', cls: 'bg-blue-100 text-blue-700' },
  meet: { label: 'Meet', cls: 'bg-purple-100 text-purple-700' },
  purchase: { label: 'Compra', cls: 'bg-amber-100 text-amber-800' },
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Nuevo', cls: 'bg-red-100 text-red-700' },
  contacted: { label: 'Contactado', cls: 'bg-blue-100 text-blue-700' },
  closed: { label: 'Cerrado', cls: 'bg-gray-200 text-gray-600' },
};

const FILTERS: { key: string; label: string; q: string }[] = [
  { key: 'all', label: 'Todos', q: '' },
  { key: 'pending', label: 'Nuevos', q: 'status=pending' },
  { key: 'visit', label: 'Visitas', q: 'intent=visit' },
  { key: 'meet', label: 'Meets', q: 'intent=meet' },
  { key: 'purchase', label: 'Compras', q: 'intent=purchase' },
  { key: 'contact', label: 'Contacto', q: 'kind=contact' },
];

export default function AdminLeadsPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState('all');
  const q = FILTERS.find((f) => f.key === filter)?.q ?? '';
  const { data, loading, reload } = useAdminGet<Lead[]>(`/admin/leads${q ? `?${q}` : ''}`);

  async function setStatus(lead: Lead, status: string) {
    try {
      await adminApi.patch(`/admin/leads/${lead.id}`, { status });
      toast('Estado actualizado', 'success');
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  const cols: Column<Lead>[] = [
    {
      header: 'Contacto',
      cell: (l) => (
        <div>
          <p className="font-medium text-primary">{l.name}</p>
          <p className="text-xs text-brand-gray">{l.email}</p>
          {l.phone && (
            <a
              href={`https://wa.me/${l.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-green-700 hover:underline"
            >
              {l.phone}
            </a>
          )}
        </div>
      ),
    },
    {
      header: 'Interés',
      cell: (l) => (
        <div>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${INTENT_LABEL[l.intent]?.cls ?? ''}`}>
            {INTENT_LABEL[l.intent]?.label ?? l.intent}
          </span>
          <p className="mt-1 text-xs text-brand-gray">
            {l.productName ?? (l.source ? `Contacto · ${l.source}` : 'Contacto')}
          </p>
        </div>
      ),
    },
    {
      header: 'Mensaje',
      cell: (l) => <span className="text-sm text-brand-gray line-clamp-2">{l.message ?? '—'}</span>,
    },
    {
      header: 'Referido',
      cell: (l) => (l.referralCode ? <span className="text-xs text-secondary">{l.referralCode}</span> : '—'),
    },
    { header: 'Fecha', cell: (l) => new Date(l.createdAt).toLocaleDateString('es-EC') },
    {
      header: 'Estado',
      cell: (l) =>
        l.kind === 'contact' ? (
          <span className="text-xs text-brand-gray">—</span>
        ) : (
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_LABEL[l.status]?.cls ?? ''}`}>
            {STATUS_LABEL[l.status]?.label ?? l.status}
          </span>
        ),
    },
    {
      header: '',
      cell: (l) =>
        l.kind === 'product' && l.status !== 'closed' ? (
          <div className="flex gap-2">
            {l.status === 'pending' && (
              <Button size="sm" variant="outline" onClick={() => setStatus(l, 'contacted')}>
                Contactado
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setStatus(l, 'closed')}>
              Cerrar
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-primary">Leads</h1>
      <p className="text-sm text-brand-gray">
        Solicitudes de información, visitas, meets, intención de compra y formularios de contacto.
      </p>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              filter === f.key ? 'bg-primary text-white' : 'bg-light text-brand-gray'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <DataTable columns={cols} rows={data ?? []} keyOf={(l) => `${l.kind}-${l.id}`} loading={loading} empty="Sin leads aún." />
    </div>
  );
}

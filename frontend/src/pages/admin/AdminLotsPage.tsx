import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { CloudinaryUpload } from '@/components/admin/CloudinaryUpload';
import { useAdminGet } from '@/hooks/useAdminAPI';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency } from '@/lib/utils';
import type { AdminLot, LotStatus } from '@shared/types';

const STATUS_LABEL: Record<LotStatus, string> = {
  AVAILABLE: 'Disponible',
  RESERVED: 'Reservado',
  SOLD: 'Vendido',
  NOT_FOR_SALE: 'No a la venta',
};

const STATUS_BADGE: Record<LotStatus, 'gold' | 'light'> = {
  AVAILABLE: 'gold',
  RESERVED: 'light',
  SOLD: 'light',
  NOT_FOR_SALE: 'light',
};

/**
 * Gestión de solares de un proyecto (Lot). Los datos base (geometría, área,
 * manzana) vienen del import desde GEO 3i — aquí el admin solo ajusta lo
 * comercial: estado, precio y, si aplica, datos del comprador (privados,
 * nunca se exponen en /api/projects/:slug/lots).
 */
export default function AdminLotsPage() {
  const { projectId } = useParams();
  const { toast } = useToast();
  const [status, setStatus] = useState('');
  const [block, setBlock] = useState('');
  const [q, setQ] = useState('');
  const params = new URLSearchParams({
    projectId: projectId ?? '',
    ...(status ? { status } : {}),
    ...(block ? { block } : {}),
    ...(q ? { q } : {}),
  });
  const { data, loading, reload } = useAdminGet<AdminLot[]>(projectId ? `/admin/lots?${params}` : null);
  const { data: projects } = useAdminGet<{ id: string; slug: string }[]>('/admin/projects');
  const slug = projects?.find((p) => p.id === projectId)?.slug;
  const [editing, setEditing] = useState<AdminLot | null>(null);

  const lots = data ?? [];
  const blocks = [...new Set(lots.map((l) => l.block).filter(Boolean))].sort() as string[];
  const totalDisponible = lots.filter((l) => l.status === 'AVAILABLE').reduce((s, l) => s + (l.price ?? 0), 0);

  const cols: Column<AdminLot>[] = [
    { header: 'Código', cell: (l) => <span className="font-medium text-primary">{l.code}</span> },
    { header: 'Manzana', cell: (l) => l.block ?? '—' },
    { header: 'Área m²', cell: (l) => l.areaM2?.toLocaleString('en-US', { maximumFractionDigits: 1 }) ?? '—' },
    { header: 'Estado', cell: (l) => <Badge variant={STATUS_BADGE[l.status]}>{STATUS_LABEL[l.status]}</Badge> },
    { header: 'Precio', cell: (l) => (l.price != null ? formatCurrency(l.price) : '—') },
    { header: 'Uso', cell: (l) => l.name ?? '—' },
    {
      header: '',
      cell: (l) => (
        <div className="flex justify-end gap-2">
          {slug && (
            <a
              href={`/proyectos/${slug}?lote=${encodeURIComponent(l.code)}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded-lg border border-black/15 px-2.5 py-1 text-xs font-medium text-primary hover:bg-light"
            >
              Ver ficha
            </a>
          )}
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setEditing(l); }}>
            Editar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <Link to="/admin/proyectos" className="text-sm text-accent hover:underline">← Proyectos</Link>
        <h1 className="mt-1 text-2xl font-bold text-primary">Lotes</h1>
        <p className="text-sm text-brand-gray">
          {lots.length} lotes · {lots.filter((l) => l.status === 'AVAILABLE').length} disponibles ·{' '}
          {formatCurrency(totalDisponible)} en inventario disponible
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar código…" className="rounded-lg border border-black/15 px-3 py-2 text-sm" />
        <select value={block} onChange={(e) => setBlock(e.target.value)} className="rounded-lg border border-black/15 px-3 py-2 text-sm">
          <option value="">Todas las manzanas</option>
          {blocks.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-black/15 px-3 py-2 text-sm">
          <option value="">Todos los estados</option>
          {(Object.keys(STATUS_LABEL) as LotStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </div>

      <DataTable columns={cols} rows={lots} keyOf={(l) => l.id} loading={loading} empty="No hay lotes." />

      <LotEditForm lot={editing} onClose={() => setEditing(null)} onSaved={() => { reload(); toast('Lote actualizado', 'success'); }} />
    </div>
  );
}

function LotEditForm({ lot, onClose, onSaved }: { lot: AdminLot | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<AdminLot>>({});
  const [saving, setSaving] = useState(false);

  // Reinicia el formulario cada vez que se abre un lote distinto.
  if (lot && form.id !== lot.id) setForm(lot);

  async function save() {
    if (!lot) return;
    setSaving(true);
    try {
      await adminApi.put(`/admin/lots/${lot.id}`, {
        status: form.status,
        price: form.price === null || form.price === undefined ? null : Number(form.price),
        pricePerM2: form.pricePerM2 === null || form.pricePerM2 === undefined ? null : Number(form.pricePerM2),
        cadastralCode: form.cadastralCode || null,
        ownerName: form.ownerName || null,
        ownerPhone: form.ownerPhone || null,
        notes: form.notes || null,
        name: form.name || null,
        images: form.images ?? [],
      });
      onSaved();
      onClose();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={!!lot} onClose={onClose} title={lot ? `Lote ${lot.code}` : ''}>
      {lot && (
        <div className="space-y-4">
          <p className="text-sm text-brand-gray">
            {lot.block} · {lot.areaM2?.toLocaleString('en-US', { maximumFractionDigits: 1 })} m² (GEO 3i)
          </p>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-primary">Estado</span>
            <select
              value={form.status ?? 'AVAILABLE'}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as LotStatus }))}
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
            >
              {(Object.keys(STATUS_LABEL) as LotStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Precio (USD)"
              type="number"
              value={form.price ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value === '' ? null : Number(e.target.value) }))}
            />
            <Input
              label="Precio / m²"
              type="number"
              value={form.pricePerM2 ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, pricePerM2: e.target.value === '' ? null : Number(e.target.value) }))}
            />
          </div>

          <Input
            label="Uso / proyecto de negocio"
            placeholder="Ej. Zona de camping, Aqua park…"
            value={form.name ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />

          <Input
            label="Código catastral"
            value={form.cadastralCode ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, cadastralCode: e.target.value }))}
          />

          <div>
            <span className="mb-1.5 block text-sm font-medium text-primary">Fotos del solar</span>
            <p className="mb-2 text-xs text-brand-gray">
              Se muestran en la ficha pública del mapa. La primera es la principal; arrástralas con las
              flechas para reordenarlas.
            </p>
            <CloudinaryUpload
              value={form.images ?? []}
              onChange={(images) => setForm((f) => ({ ...f, images }))}
            />
          </div>

          <div className="rounded-xl bg-light p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-gray">
              Datos privados — nunca se muestran en la web pública
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Comprador / reservante"
                value={form.ownerName ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
              />
              <Input
                label="Teléfono"
                value={form.ownerPhone ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, ownerPhone: e.target.value }))}
              />
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-primary">Notas internas</span>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
          </label>

          <div className="flex justify-end gap-2 border-t border-black/5 pt-4">
            <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

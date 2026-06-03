import { useState } from 'react';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AdminProductForm } from './AdminProductForm';
import { useAdminGet } from '@/hooks/useAdminAPI';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency } from '@/lib/utils';
import type { AdminProduct } from '@/lib/adminTypes';

export default function AdminProductsPage() {
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const query = `/admin/products?${new URLSearchParams({ ...(q ? { q } : {}), ...(activeFilter ? { active: activeFilter } : {}) })}`;
  const { data, loading, reload } = useAdminGet<AdminProduct[]>(query);

  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<AdminProduct | null>(null);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(p: AdminProduct) {
    setEditing(p);
    setFormOpen(true);
  }

  async function doDelete() {
    if (!toDelete) return;
    try {
      await adminApi.del(`/admin/products/${toDelete.id}`);
      toast('Producto desactivado', 'success');
      setToDelete(null);
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  const cols: Column<AdminProduct>[] = [
    { header: 'Nombre', cell: (p) => <span className="font-medium text-primary">{p.name}</span> },
    { header: 'Tipo', cell: (p) => <span className="text-xs text-brand-gray">{p.type}</span> },
    { header: 'Precio', cell: (p) => formatCurrency(p.promoPrice ?? p.price) },
    { header: 'Activo', cell: (p) => <Badge variant={p.active ? 'gold' : 'light'}>{p.active ? 'Sí' : 'No'}</Badge> },
    { header: 'Destacado', cell: (p) => (p.featured ? '⭐' : '—') },
    {
      header: '',
      cell: (p) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openEdit(p); }}>Editar</Button>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setToDelete(p); }} className="text-red-600">Eliminar</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-primary">Productos</h1>
        <Button onClick={openNew}>+ Nuevo producto</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar…"
          className="rounded-lg border border-black/15 px-3 py-2 text-sm"
        />
        <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} className="rounded-lg border border-black/15 px-3 py-2 text-sm">
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>

      <DataTable columns={cols} rows={data ?? []} keyOf={(p) => p.id} loading={loading} empty="No hay productos." />

      <AdminProductForm open={formOpen} product={editing} onClose={() => setFormOpen(false)} onSaved={reload} />
      <ConfirmModal
        open={!!toDelete}
        title="Desactivar producto"
        message={`¿Desactivar "${toDelete?.name}"? Dejará de mostrarse en la tienda.`}
        confirmLabel="Desactivar"
        danger
        onConfirm={doDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}

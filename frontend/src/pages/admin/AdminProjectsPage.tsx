import { useState } from 'react';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AdminProjectForm } from './AdminProjectForm';
import { useAdminGet } from '@/hooks/useAdminAPI';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/components/shared/Toast';
import type { AdminProject } from '@/lib/adminTypes';

export default function AdminProjectsPage() {
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const query = `/admin/projects?${new URLSearchParams(q ? { q } : {})}`;
  const { data, loading, reload } = useAdminGet<AdminProject[]>(query);

  const [editing, setEditing] = useState<AdminProject | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<AdminProject | null>(null);

  async function doDelete() {
    if (!toDelete) return;
    try {
      await adminApi.del(`/admin/projects/${toDelete.id}`);
      toast('Proyecto desactivado', 'success');
      setToDelete(null);
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  const cols: Column<AdminProject>[] = [
    { header: 'Nombre', cell: (p) => <span className="font-medium text-primary">{p.name}</span> },
    { header: 'Ubicación', cell: (p) => <span className="text-sm text-brand-gray">{p.location ?? '—'}</span> },
    { header: 'Precio', cell: (p) => p.priceLabel ?? '—' },
    { header: 'Activo', cell: (p) => <Badge variant={p.active ? 'gold' : 'light'}>{p.active ? 'Sí' : 'No'}</Badge> },
    { header: 'Destacado', cell: (p) => (p.featured ? '⭐' : '—') },
    {
      header: '',
      cell: (p) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setEditing(p); setFormOpen(true); }}>Editar</Button>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setToDelete(p); }} className="text-red-600">Eliminar</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-primary">Proyectos</h1>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>+ Nuevo proyecto</Button>
      </div>

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="rounded-lg border border-black/15 px-3 py-2 text-sm" />

      <DataTable columns={cols} rows={data ?? []} keyOf={(p) => p.id} loading={loading} empty="No hay proyectos." />

      <AdminProjectForm open={formOpen} project={editing} onClose={() => setFormOpen(false)} onSaved={reload} />
      <ConfirmModal
        open={!!toDelete}
        title="Desactivar proyecto"
        message={`¿Desactivar "${toDelete?.name}"?`}
        confirmLabel="Desactivar"
        danger
        onConfirm={doDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}

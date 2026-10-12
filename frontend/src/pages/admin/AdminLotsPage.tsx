import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { CloudinaryUpload } from '@/components/admin/CloudinaryUpload';
import { useAdminGet } from '@/hooks/useAdminAPI';
import { usePanelClient } from '@/lib/panelClient';
import { useToast } from '@/components/shared/Toast';
import { formatCurrency } from '@/lib/utils';
import { PROPERTY_TYPES, typeInfo, isBuilt } from '@/lib/propertyTypes';
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
 * Gestión de lotes de un proyecto (Lot). Los datos base (geometría, área,
 * manzana) vienen del import desde GEO 3i — aquí el admin solo ajusta lo
 * comercial: estado, precio y, si aplica, datos del comprador (privados,
 * nunca se exponen en /api/projects/:slug/lots).
 */
export default function AdminLotsPage() {
  const client = usePanelClient();
  const { projectId } = useParams();
  const { toast } = useToast();
  const [status, setStatus] = useState('');
  const [block, setBlock] = useState('');
  const [q, setQ] = useState('');
  const [unitType, setUnitType] = useState('');
  const [adding, setAdding] = useState(false);
  const params = new URLSearchParams({
    projectId: projectId ?? '',
    ...(status ? { status } : {}),
    ...(block ? { block } : {}),
    ...(q ? { q } : {}),
    ...(unitType ? { unitType } : {}),
  });
  const { data, loading, reload } = useAdminGet<AdminLot[]>(projectId ? `/admin/lots?${params}` : null);
  const { data: projects } = useAdminGet<{ id: string; slug: string }[]>('/admin/projects');
  const slug = projects?.find((p) => p.id === projectId)?.slug;
  const [editing, setEditing] = useState<AdminLot | null>(null);

  const lots = data ?? [];
  const typesHere = [...new Set(lots.map((l) => l.unitType ?? 'lotes'))];
  const blocks = [...new Set(lots.map((l) => l.block).filter(Boolean))].sort() as string[];
  const totalDisponible = lots.filter((l) => l.status === 'AVAILABLE').reduce((s, l) => s + (l.price ?? 0), 0);

  const cols: Column<AdminLot>[] = [
    { header: 'Código', cell: (l) => <span className="font-medium text-primary">{l.code}</span> },
    ...(typesHere.length > 1 || typesHere[0] !== 'lotes' ? [{ header: 'Tipo', cell: (l: AdminLot) => typeInfo(l.unitType).unit }] : []),
    { header: 'Manzana / torre', cell: (l) => [l.block, l.floor ? `piso ${l.floor}` : ''].filter(Boolean).join(' · ') || '—' },
    { header: 'Área m²', cell: (l) => (l.builtM2 ?? l.areaM2)?.toLocaleString('en-US', { maximumFractionDigits: 1 }) ?? '—' },
    { header: 'Estado', cell: (l) => <Badge variant={STATUS_BADGE[l.status]}>{STATUS_LABEL[l.status]}</Badge> },
    { header: 'Precio', cell: (l) => (l.price != null ? formatCurrency(l.price) : <span className="text-brand-gray">{l.status === 'SOLD' ? 'sin precio registrado' : '—'}</span>) },
    // «Uso» solo si algún lote lo tiene (áreas comunales, proyectos de negocio).
    ...(lots.some((l) => l.name) ? [{ header: 'Uso', cell: (l: AdminLot) => l.name ?? '—' }] : []),
    {
      header: '',
      cell: (l) => (
        <div className="flex justify-end gap-2">
          {slug && (
            <a
              href={l.geometry ? `/proyectos/${slug}?lote=${encodeURIComponent(l.code)}` : `/proyectos/${slug}/lote/${encodeURIComponent(l.code)}`}
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
        <Link to={client.backTo} className="text-sm text-accent hover:underline">← Proyectos</Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="mt-1 text-2xl font-bold text-primary">Inventario</h1>
          <Button size="sm" onClick={() => setAdding(true)}>+ Agregar unidad</Button>
        </div>
        <p className="text-sm text-brand-gray">
          {lots.length} unidades · {lots.filter((l) => l.status === 'AVAILABLE').length} disponibles ·{' '}
          {formatCurrency(totalDisponible)} en inventario disponible
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar código…" className="rounded-lg border border-black/15 px-3 py-2 text-sm" />
        <select value={block} onChange={(e) => setBlock(e.target.value)} className="rounded-lg border border-black/15 px-3 py-2 text-sm">
          <option value="">Todas las manzanas y torres</option>
          {blocks.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={unitType} onChange={(e) => setUnitType(e.target.value)} className="rounded-lg border border-black/15 px-3 py-2 text-sm">
          <option value="">Todos los tipos</option>
          {PROPERTY_TYPES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-black/15 px-3 py-2 text-sm">
          <option value="">Todos los estados</option>
          {(Object.keys(STATUS_LABEL) as LotStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </div>

      <DataTable columns={cols} rows={lots} keyOf={(l) => l.id} loading={loading} empty="Todavía no hay unidades. Los lotes con plano los carga Grupo 3i; casas, departamentos y locales puedes agregarlos con «Agregar unidad»." />

      <LotEditForm lot={editing} onClose={() => setEditing(null)} onSaved={() => { reload(); toast('Unidad actualizada', 'success'); }} />
      {projectId && <NewUnitForm open={adding} projectId={projectId} onClose={() => setAdding(false)} onSaved={() => { reload(); toast('Unidad agregada', 'success'); }} />}
    </div>
  );
}

function LotEditForm({ lot, onClose, onSaved }: { lot: AdminLot | null; onClose: () => void; onSaved: () => void }) {
  const client = usePanelClient();
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<AdminLot>>({});
  const [saving, setSaving] = useState(false);

  // Reinicia el formulario cada vez que se abre un lote distinto.
  if (lot && form.id !== lot.id) setForm(lot);

  async function save() {
    if (!lot) return;
    setSaving(true);
    try {
      await client.put(`/admin/lots/${lot.id}`, {
        status: form.status,
        price: form.price === null || form.price === undefined ? null : Number(form.price),
        pricePerM2: form.pricePerM2 === null || form.pricePerM2 === undefined ? null : Number(form.pricePerM2),
        cashOnly: !!form.cashOnly,
        cadastralCode: form.cadastralCode || null,
        ownerName: form.ownerName || null,
        ownerPhone: form.ownerPhone || null,
        notes: form.notes || null,
        name: form.name || null,
        images: form.images ?? [],
        unitType: form.unitType ?? 'lotes',
        block: form.block ?? null,
        floor: form.floor ?? null,
        builtM2: form.builtM2 ?? null,
        bedrooms: form.bedrooms ?? null,
        bathrooms: form.bathrooms ?? null,
        parking: form.parking ?? null,
        description: form.description || null,
        ...(lot.geometry ? {} : { areaM2: form.areaM2 ?? null }),
      });
      onSaved();
      onClose();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!lot || !confirm(`¿Borrar ${typeInfo(lot.unitType).unit} ${lot.code}? No se puede deshacer.`)) return;
    setSaving(true);
    try {
      await client.del(`/admin/lots/${lot.id}`);
      onSaved();
      onClose();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={!!lot} onClose={onClose} title={lot ? `${typeInfo(lot.unitType).unit} ${lot.code}` : ''}>
      {lot && (
        <div className="space-y-4">
          {lot.geometry ? (
            <p className="text-sm text-brand-gray">
              {lot.block} · {lot.areaM2?.toLocaleString('en-US', { maximumFractionDigits: 1 })} m² (GEO 3i)
            </p>
          ) : null}
          <UnitFields form={form} setForm={setForm} fromPlan={!!lot.geometry} />

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

          <label className="flex items-center gap-2 text-sm text-primary">
            <input
              type="checkbox"
              checked={!!form.cashOnly}
              onChange={(e) => setForm((f) => ({ ...f, cashOnly: e.target.checked }))}
            />
            Promoción solo de contado (no aplica el plan de 24 cuotas)
          </label>

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
            <span className="mb-1.5 block text-sm font-medium text-primary">Fotos del lote</span>
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
            {!lot.geometry && lot.status !== 'SOLD' && (
              <Button variant="ghost" className="mr-auto text-red-600" disabled={saving} onClick={remove}>Borrar</Button>
            )}
            <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

const numOrNull = (v: string) => (v === '' ? null : Number(v));

/** Tipo y datos de edificación de una unidad (se usa al crear y al editar). */
function UnitFields({ form, setForm, fromPlan }: { form: Partial<AdminLot>; setForm: React.Dispatch<React.SetStateAction<Partial<AdminLot>>>; fromPlan: boolean }) {
  const built = isBuilt(form.unitType);
  const set = (k: keyof AdminLot, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-primary">Tipo de unidad</span>
          <select value={form.unitType ?? 'lotes'} onChange={(e) => set('unitType', e.target.value)} className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm">
            {PROPERTY_TYPES.map((p) => <option key={p.id} value={p.id}>{p.unit}</option>)}
          </select>
        </label>
        {!fromPlan && <Input label="Manzana / torre / etapa" value={form.block ?? ''} onChange={(e) => set('block', e.target.value)} />}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {!fromPlan && <Input label={built ? 'Terreno m²' : 'Área m²'} type="number" value={form.areaM2 ?? ''} onChange={(e) => set('areaM2', numOrNull(e.target.value))} />}
        {built && <Input label="Construcción m²" type="number" value={form.builtM2 ?? ''} onChange={(e) => set('builtM2', numOrNull(e.target.value))} />}
        {built && <Input label="Piso / nivel" value={form.floor ?? ''} onChange={(e) => set('floor', e.target.value)} />}
        {built && <Input label="Dormitorios" type="number" value={form.bedrooms ?? ''} onChange={(e) => set('bedrooms', numOrNull(e.target.value))} />}
        {built && <Input label="Baños" type="number" step="0.5" value={form.bathrooms ?? ''} onChange={(e) => set('bathrooms', numOrNull(e.target.value))} />}
        {built && <Input label="Parqueaderos" type="number" value={form.parking ?? ''} onChange={(e) => set('parking', numOrNull(e.target.value))} />}
      </div>
      {!fromPlan && (
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-primary">Descripción pública</span>
          <textarea value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} rows={3} className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm" />
        </label>
      )}
    </div>
  );
}

/** Alta de una unidad sin plano: casa, departamento, local, oficina… */
function NewUnitForm({ open, projectId, onClose, onSaved }: { open: boolean; projectId: string; onClose: () => void; onSaved: () => void }) {
  const client = usePanelClient();
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<AdminLot>>({ unitType: 'casas' });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await client.post('/admin/lots', { projectId, ...form });
      setForm({ unitType: form.unitType });
      onSaved();
      onClose();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Agregar unidad">
      <div className="space-y-4">
        <p className="text-sm text-brand-gray">
          Para casas, departamentos, locales y oficinas. Los lotes con plano los carga Grupo 3i desde el levantamiento.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Código *" placeholder="4B, Casa 7, L-03" value={form.code ?? ''} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
          <Input label="Precio (USD)" type="number" value={form.price ?? ''} onChange={(e) => setForm((f) => ({ ...f, price: numOrNull(e.target.value) }))} />
        </div>
        <UnitFields form={form} setForm={setForm} fromPlan={false} />
        <p className="text-xs text-brand-gray">Las fotos y el estado se editan después, desde la lista.</p>
        <div className="flex justify-end gap-2 border-t border-black/5 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving || !form.code?.trim()}>{saving ? 'Guardando…' : 'Agregar'}</Button>
        </div>
      </div>
    </Modal>
  );
}

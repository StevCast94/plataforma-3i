import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CloudinaryUpload } from '@/components/admin/CloudinaryUpload';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/components/shared/Toast';
import type { AdminProduct, AdminProject } from '@/lib/adminTypes';
import type { ProductType } from '@shared/types';

const TYPES: { value: ProductType; label: string }[] = [
  { value: 'TRAVEL_MEMBERSHIP', label: 'Membresía de viajes' },
  { value: 'FRACTIONAL_PROPERTY', label: 'Propiedad fraccionada' },
  { value: 'TRADITIONAL_PROPERTY', label: 'Propiedad tradicional' },
  { value: 'LAND', label: 'Terreno' },
];

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

interface Props {
  open: boolean;
  product: AdminProduct | null;
  onClose: () => void;
  onSaved: () => void;
}

export function AdminProductForm({ open, product, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const isEdit = !!product;
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState<ProductType>('FRACTIONAL_PROPERTY');
  const [price, setPrice] = useState('');
  const [promoPrice, setPromoPrice] = useState('');
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [projectId, setProjectId] = useState('');
  const [active, setActive] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [commissionType, setCommissionType] = useState<'percentage' | 'fixed'>('percentage');
  const [fixedPremiere, setFixedPremiere] = useState('');
  const [fixedElite, setFixedElite] = useState('');

  useEffect(() => {
    if (!open) return;
    adminApi.get<AdminProject[]>('/admin/projects').then(setProjects).catch(() => setProjects([]));
    setName(product?.name ?? '');
    setSlug(product?.slug ?? '');
    setType(product?.type ?? 'FRACTIONAL_PROPERTY');
    setPrice(product ? String(product.price) : '');
    setPromoPrice(product?.promoPrice != null ? String(product.promoPrice) : '');
    setDescription(product?.description ?? '');
    setFeatures(Array.isArray(product?.features) ? product!.features! : []);
    setImages(product?.images ?? []);
    setProjectId(product?.projectId ?? '');
    setActive(product?.active ?? true);
    setFeatured(product?.featured ?? false);
    setCommissionType(product?.commissionType ?? 'percentage');
    setFixedPremiere(product?.commissionFixedPremiere != null ? String(product.commissionFixedPremiere) : '');
    setFixedElite(product?.commissionFixedElite != null ? String(product.commissionFixedElite) : '');
  }, [open, product]);

  async function save() {
    if (!name || !price) {
      toast('Nombre y precio son requeridos', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      name,
      slug: slug || slugify(name),
      type,
      price: Number(price),
      promoPrice: promoPrice ? Number(promoPrice) : null,
      description,
      features,
      images,
      projectId: projectId || null,
      active,
      featured,
      commissionType,
      commissionFixedPremiere: commissionType === 'fixed' && fixedPremiere ? Number(fixedPremiere) : null,
      commissionFixedElite: commissionType === 'fixed' && fixedElite ? Number(fixedElite) : null,
    };
    try {
      if (isEdit) await adminApi.put(`/admin/products/${product!.id}`, payload);
      else await adminApi.post('/admin/products', payload);
      toast(isEdit ? 'Producto actualizado' : 'Producto creado', 'success');
      onSaved();
      onClose();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar producto' : 'Nuevo producto'}>
      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        <Input label="Nombre" value={name} onChange={(e) => { setName(e.target.value); if (!isEdit) setSlug(slugify(e.target.value)); }} />
        <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-primary">Tipo</span>
          <select value={type} onChange={(e) => setType(e.target.value as ProductType)} className="w-full rounded-lg border border-black/15 bg-white px-4 py-3 text-sm">
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Precio" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          <Input label="Precio promo (opcional)" type="number" value={promoPrice} onChange={(e) => setPromoPrice(e.target.value)} />
        </div>

        <Textarea label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} />

        {/* Features dinámicas */}
        <div>
          <span className="mb-1.5 block text-sm font-medium text-primary">Beneficios / Features</span>
          <div className="space-y-2">
            {features.map((f, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={f}
                  onChange={(e) => setFeatures((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))}
                  className="flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm"
                />
                <button type="button" onClick={() => setFeatures((arr) => arr.filter((_, j) => j !== i))} className="rounded-lg bg-red-100 px-3 text-red-600">×</button>
              </div>
            ))}
          </div>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => setFeatures((a) => [...a, ''])}>
            + Agregar
          </Button>
        </div>

        {/* Imágenes */}
        <div>
          <span className="mb-1.5 block text-sm font-medium text-primary">Imágenes</span>
          <CloudinaryUpload value={images} onChange={setImages} />
        </div>

        {/* Proyecto vinculado */}
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-primary">Proyecto vinculado (opcional)</span>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full rounded-lg border border-black/15 bg-white px-4 py-3 text-sm">
            <option value="">— Ninguno —</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>

        {/* Comisión de referidos */}
        <div className="rounded-xl bg-light p-4">
          <span className="mb-1.5 block text-sm font-medium text-primary">Comisión de referidos</span>
          <select
            value={commissionType}
            onChange={(e) => setCommissionType(e.target.value as 'percentage' | 'fixed')}
            className="w-full rounded-lg border border-black/15 bg-white px-4 py-3 text-sm"
          >
            <option value="percentage">Porcentaje (reglamento: 4/2% Elite · 2/1% Premiere)</option>
            <option value="fixed">Valor fijo por venta</option>
          </select>
          {commissionType === 'fixed' && (
            <div className="mt-3 grid grid-cols-2 gap-4">
              <Input label="Fijo si Premiere ($)" type="number" value={fixedPremiere} onChange={(e) => setFixedPremiere(e.target.value)} />
              <Input label="Fijo si Elite ($)" type="number" value={fixedElite} onChange={(e) => setFixedElite(e.target.value)} />
            </div>
          )}
          <p className="mt-2 text-xs text-brand-gray">
            En valor fijo, el segundo nivel no recibe comisión.
          </p>
        </div>

        <div className="flex gap-6">
          <Toggle label="Activo" checked={active} onChange={setActive} />
          <Toggle label="Destacado" checked={featured} onChange={setFeatured} />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
      </div>
    </Modal>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-primary">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--color-secondary)]" />
      {label}
    </label>
  );
}

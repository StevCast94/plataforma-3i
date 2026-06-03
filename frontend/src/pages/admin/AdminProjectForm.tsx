import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CloudinaryUpload } from '@/components/admin/CloudinaryUpload';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/components/shared/Toast';
import type { AdminProject } from '@/lib/adminTypes';

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

interface KV { key: string; value: string }

function featuresToKV(features?: Record<string, unknown> | null): KV[] {
  if (!features) return [];
  return Object.entries(features).map(([key, value]) => ({
    key,
    value: Array.isArray(value) ? value.join(', ') : String(value ?? ''),
  }));
}

function kvToFeatures(kvs: KV[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const { key, value } of kvs) {
    if (!key.trim()) continue;
    out[key.trim()] = key.trim() === 'amenities'
      ? value.split(',').map((v) => v.trim()).filter(Boolean)
      : isNaN(Number(value)) || value.trim() === '' ? value : Number(value);
  }
  return out;
}

interface Props {
  open: boolean;
  project: AdminProject | null;
  onClose: () => void;
  onSaved: () => void;
}

export function AdminProjectForm({ open, project, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const isEdit = !!project;
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [coverImage, setCoverImage] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [kvs, setKvs] = useState<KV[]>([]);
  const [priceFrom, setPriceFrom] = useState('');
  const [priceLabel, setPriceLabel] = useState('');
  const [active, setActive] = useState(true);
  const [featured, setFeatured] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(project?.name ?? '');
    setSlug(project?.slug ?? '');
    setSubtitle(project?.subtitle ?? '');
    setDescription(project?.description ?? '');
    setLocation(project?.location ?? '');
    setCoverImage(project?.coverImage ? [project.coverImage] : []);
    setImages(project?.images ?? []);
    setKvs(featuresToKV(project?.features));
    setPriceFrom(project?.priceFrom != null ? String(project.priceFrom) : '');
    setPriceLabel(project?.priceLabel ?? '');
    setActive(project?.active ?? true);
    setFeatured(project?.featured ?? false);
  }, [open, project]);

  async function save() {
    if (!name || !description) {
      toast('Nombre y descripción son requeridos', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      name,
      slug: slug || slugify(name),
      subtitle: subtitle || null,
      description,
      location: location || null,
      coverImage: coverImage[0] ?? null,
      images,
      features: kvToFeatures(kvs),
      priceFrom: priceFrom ? Number(priceFrom) : null,
      priceLabel: priceLabel || null,
      active,
      featured,
    };
    try {
      if (isEdit) await adminApi.put(`/admin/projects/${project!.id}`, payload);
      else await adminApi.post('/admin/projects', payload);
      toast(isEdit ? 'Proyecto actualizado' : 'Proyecto creado', 'success');
      onSaved();
      onClose();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar proyecto' : 'Nuevo proyecto'}>
      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        <Input label="Nombre" value={name} onChange={(e) => { setName(e.target.value); if (!isEdit) setSlug(slugify(e.target.value)); }} />
        <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <Input label="Subtítulo" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        <Textarea label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input label="Ubicación" value={location} onChange={(e) => setLocation(e.target.value)} />

        <div>
          <span className="mb-1.5 block text-sm font-medium text-primary">Imagen de portada</span>
          <CloudinaryUpload value={coverImage} onChange={setCoverImage} single />
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-medium text-primary">Galería</span>
          <CloudinaryUpload value={images} onChange={setImages} />
        </div>

        {/* Features key-value */}
        <div>
          <span className="mb-1.5 block text-sm font-medium text-primary">
            Características (clave/valor — usa "amenities" separadas por coma)
          </span>
          <div className="space-y-2">
            {kvs.map((kv, i) => (
              <div key={i} className="flex gap-2">
                <input value={kv.key} placeholder="clave" onChange={(e) => setKvs((a) => a.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))} className="w-1/3 rounded-lg border border-black/15 px-3 py-2 text-sm" />
                <input value={kv.value} placeholder="valor" onChange={(e) => setKvs((a) => a.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} className="flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm" />
                <button type="button" onClick={() => setKvs((a) => a.filter((_, j) => j !== i))} className="rounded-lg bg-red-100 px-3 text-red-600">×</button>
              </div>
            ))}
          </div>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => setKvs((a) => [...a, { key: '', value: '' }])}>+ Agregar</Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Precio desde" type="number" value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} />
          <Input label="Etiqueta de precio" value={priceLabel} onChange={(e) => setPriceLabel(e.target.value)} placeholder="Desde $25,000" />
        </div>

        <div className="flex gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-primary">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-[var(--color-secondary)]" /> Activo
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-primary">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 accent-[var(--color-secondary)]" /> Destacado
          </label>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
      </div>
    </Modal>
  );
}

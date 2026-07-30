import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CloudinaryUpload } from '@/components/admin/CloudinaryUpload';
import { BrochureContentEditor } from '@/components/admin/BrochureContentEditor';
import { BrochureDigital } from '@/components/shared/BrochureDigital';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/components/shared/Toast';
import { resolveBrochureContent, type BrochureContent } from '@/lib/brochureContent';
import type { AdminProject } from '@/lib/adminTypes';
import type { Project } from '@shared/types';

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
  const [showBrochure, setShowBrochure] = useState(false);
  const [mapLat, setMapLat] = useState('');
  const [mapLng, setMapLng] = useState('');
  const [brochureContent, setBrochureContent] = useState<BrochureContent>({});
  const [advancedMode, setAdvancedMode] = useState(false);
  const [brochureJson, setBrochureJson] = useState('');
  const [brochureJsonError, setBrochureJsonError] = useState('');
  const [previewing, setPreviewing] = useState(false);

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
    setShowBrochure(project?.showBrochure ?? false);
    setMapLat(project?.mapLat != null ? String(project.mapLat) : '');
    setMapLng(project?.mapLng != null ? String(project.mapLng) : '');
    // Precargar con lo que YA se está mostrando en la página (contenido propio +
    // valores por defecto donde falte), no solo lo que el proyecto tiene guardado
    // explícitamente — así el admin ve y puede editar cada campo, no una casilla
    // vacía. Los proyectos nuevos arrancan en blanco (usan "Cargar plantilla" si
    // quieren partir del ejemplo, para no publicar copy de Ibiza sin querer).
    const initialBrochure = project ? resolveBrochureContent(project.brochureContent) : {};
    setBrochureContent(initialBrochure);
    setAdvancedMode(false);
    setBrochureJson(JSON.stringify(initialBrochure, null, 2));
    setBrochureJsonError('');
  }, [open, project]);

  async function save() {
    if (!name || !description) {
      toast('Nombre y descripción son requeridos', 'error');
      return;
    }
    let brochureContentPayload: BrochureContent | Record<string, unknown> | null = null;
    if (showBrochure) {
      if (advancedMode) {
        if (brochureJson.trim()) {
          try {
            brochureContentPayload = JSON.parse(brochureJson);
            setBrochureJsonError('');
          } catch {
            setBrochureJsonError('JSON inválido — revisa comas y comillas antes de guardar.');
            toast('El contenido del brochure tiene un error de formato JSON', 'error');
            return;
          }
        }
      } else {
        brochureContentPayload = brochureContent;
      }
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
      showBrochure,
      mapLat: mapLat ? Number(mapLat) : null,
      mapLng: mapLng ? Number(mapLng) : null,
      brochureContent: brochureContentPayload,
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

  // Objeto de proyecto "en vivo" para la vista previa: el mismo componente que
  // ve el público, alimentado con los datos aún sin guardar del formulario.
  function buildPreviewProject(): Project {
    let content: BrochureContent = brochureContent;
    if (advancedMode) {
      try {
        content = brochureJson.trim() ? JSON.parse(brochureJson) : {};
      } catch {
        content = brochureContent;
      }
    }
    return {
      id: project?.id ?? 'preview',
      slug: slug || 'preview',
      name: name || 'Nombre del proyecto',
      subtitle: subtitle || null,
      description: description || '',
      location: location || null,
      coverImage: coverImage[0] ?? null,
      images,
      priceFrom: priceFrom ? Number(priceFrom) : null,
      priceLabel: priceLabel || null,
      active,
      featured,
      showBrochure: true,
      mapLat: mapLat ? Number(mapLat) : null,
      mapLng: mapLng ? Number(mapLng) : null,
      brochureContent: content as Record<string, unknown>,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
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

        <div>
          <span className="mb-1.5 block text-sm font-medium text-primary">
            Coordenadas del mapa (para el mapa satelital del brochure)
          </span>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Latitud" type="number" value={mapLat} onChange={(e) => setMapLat(e.target.value)} placeholder="-1.7987" />
            <Input label="Longitud" type="number" value={mapLng} onChange={(e) => setMapLng(e.target.value)} placeholder="-80.7398" />
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-primary">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-[var(--color-secondary)]" /> Activo
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-primary">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 accent-[var(--color-secondary)]" /> Destacado
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-primary">
            <input type="checkbox" checked={showBrochure} onChange={(e) => setShowBrochure(e.target.checked)} className="h-4 w-4 accent-[var(--color-secondary)]" /> Brochure Digital premium
          </label>
        </div>

        {showBrochure && (
          <div className="rounded-xl border border-black/10 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-primary">Contenido del Brochure Digital</span>
              <div className="flex items-center gap-3">
                <Button size="sm" type="button" onClick={() => setPreviewing(true)}>
                  Vista previa en vivo
                </Button>
              <button
                type="button"
                className="text-xs text-accent underline"
                onClick={() => {
                  if (advancedMode) {
                    // Volver al editor por campos: intenta parsear lo que haya en el JSON.
                    try {
                      const parsed = brochureJson.trim() ? JSON.parse(brochureJson) : {};
                      setBrochureContent(parsed);
                      setBrochureJsonError('');
                      setAdvancedMode(false);
                    } catch {
                      toast('El JSON tiene un error de formato — corrígelo antes de volver al editor por campos', 'error');
                    }
                  } else {
                    setBrochureJson(JSON.stringify(brochureContent, null, 2));
                    setAdvancedMode(true);
                  }
                }}
              >
                {advancedMode ? '← Volver al editor por campos' : 'Modo avanzado (JSON)'}
              </button>
              </div>
            </div>
            <p className="mb-3 text-xs text-brand-gray">
              Las fotos NO se editan aquí — usa "Imagen de portada" y "Galería" arriba. El orden de la
              galería decide qué foto sale grande en el mosaico, cuál acompaña "Vista General" y cuál se
              usa en el banner. Lo que dejes vacío en el brochure se completa con el contenido de ejemplo.
            </p>

            {advancedMode ? (
              <>
                <textarea
                  value={brochureJson}
                  onChange={(e) => { setBrochureJson(e.target.value); setBrochureJsonError(''); }}
                  rows={14}
                  spellCheck={false}
                  className="w-full rounded-lg border border-black/15 px-3 py-2 font-mono text-xs"
                />
                {brochureJsonError && <p className="mt-1 text-xs text-red-600">{brochureJsonError}</p>}
              </>
            ) : (
              <BrochureContentEditor value={brochureContent} onChange={setBrochureContent} />
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
      </div>

      {previewing && (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-white">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white/95 px-4 py-3 backdrop-blur">
            <span className="text-sm font-semibold text-primary">
              Vista previa — cambios aún no guardados
            </span>
            <Button size="sm" variant="outline" onClick={() => setPreviewing(false)}>
              Cerrar vista previa
            </Button>
          </div>
          <BrochureDigital project={buildPreviewProject()} onRequestInfo={() => {}} />
        </div>
      )}
    </Modal>
  );
}

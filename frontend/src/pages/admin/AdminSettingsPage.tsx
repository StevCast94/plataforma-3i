import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CloudinaryUpload } from '@/components/admin/CloudinaryUpload';
import { useAdminGet } from '@/hooks/useAdminAPI';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/components/shared/Toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import type { AuditLogRow } from '@/lib/adminTypes';
import type { SiteContentMap } from '@shared/types';

/** Campos de SiteContent que son imágenes: se editan subiendo archivos, no
 * pegando una URL a mano. "hero.image_url" además rota entre varias (por eso
 * usa CloudinaryUpload sin `single`, guardando las URLs unidas por línea). */
const IMAGE_FIELDS = new Set(['hero.image_url']);

type Tab = 'content' | 'cards';

/** Secciones que tienen su propia pantalla y no se editan aquí. */
const HIDDEN_SECTIONS = new Set(['tracking', 'propuesta_mv', 'referral_og']);
const SECTION_LABEL: Record<string, string> = {
  hero: 'Portada',
  about: 'Nosotros',
  contact: 'Contacto y WhatsApp oficial',
  footer: 'Pie de página',
  club: 'Club 3i',
  projects: 'Proyectos',
};

/** Sección de SiteContent donde viven las campañas (una fila por campaña,
 *  el `value` es el JSON de la tarjeta). Debe coincidir con OG_SECTION del backend. */
const OG_SECTION = 'referral_og';

interface Campaign {
  key: string;
  label: string;
  title: string;
  description: string;
  image: string;
  message: string;
  to: string;
}

export default function AdminSettingsPage() {
  const { isSuperadmin } = useAdminAuth();
  const [tab, setTab] = useState<Tab>('content');
  const tabs: Tab[] = isSuperadmin ? ['content', 'cards'] : ['content'];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-primary">Contenido del sitio</h1>
        <p className="text-sm text-brand-gray">Textos e imágenes de la web y tarjetas para compartir. El equipo está en «Equipo» y la medición de anuncios en «Campañas y medición».</p>
      </div>
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === t ? 'bg-primary text-white' : 'bg-light text-brand-gray'}`}
          >
            {t === 'content' ? 'Textos e imágenes' : 'Tarjetas de referido'}
          </button>
        ))}
      </div>

      {tab === 'content' && <ContentTab />}
      {tab === 'cards' && <CardsTab />}
    </div>
  );
}

function ContentTab() {
  const { toast } = useToast();
  const { data, loading } = useAdminGet<SiteContentMap>('/content');

  async function saveField(section: string, key: string, value: string) {
    try {
      await adminApi.put('/content', { section, key, value });
      toast('Contenido guardado', 'success');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  if (loading) return <p className="text-brand-gray">Cargando contenido…</p>;
  const sections = Object.entries(data ?? {}).filter(([k]) => !HIDDEN_SECTIONS.has(k));

  return (
    <div className="space-y-5">
      {sections.map(([section, fields]) => (
        <div key={section} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h3 className="text-lg text-primary">{SECTION_LABEL[section] ?? section}</h3>
          <div className="mt-4 space-y-3">
            {Object.entries(fields).map(([key, value]) =>
              IMAGE_FIELDS.has(`${section}.${key}`) ? (
                <ImageContentField
                  key={key}
                  section={section}
                  fieldKey={key}
                  initial={value}
                  onSave={saveField}
                  hint="La imagen del proyecto ya incluida por defecto se muestra siempre primero; las que subas aquí se agregan a la rotación del hero."
                />
              ) : (
                <ContentField key={key} section={section} fieldKey={key} initial={value} onSave={saveField} />
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ContentField({
  section,
  fieldKey,
  initial,
  onSave,
  hint,
}: {
  section: string;
  fieldKey: string;
  initial: string;
  onSave: (section: string, key: string, value: string) => void;
  hint?: string;
}) {
  const [value, setValue] = useState(initial);
  const dirty = value !== initial;
  return (
    <div className="flex items-end gap-2">
      <label className="flex-1">
        <span className="mb-1 block text-xs uppercase tracking-wider text-brand-gray">{fieldKey}</span>
        <textarea value={value} onChange={(e) => setValue(e.target.value)} rows={value.length > 60 ? 2 : 1} className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm" />
        {hint && <span className="mt-1 block text-xs text-brand-gray">{hint}</span>}
      </label>
      <Button size="sm" disabled={!dirty} onClick={() => onSave(section, fieldKey, value)}>Guardar</Button>
    </div>
  );
}

function ImageContentField({
  section,
  fieldKey,
  initial,
  onSave,
  hint,
}: {
  section: string;
  fieldKey: string;
  initial: string;
  onSave: (section: string, key: string, value: string) => void;
  hint?: string;
}) {
  const initialUrls = initial
    .split(/[\n,]+/)
    .map((u) => u.trim())
    .filter(Boolean);
  const [urls, setUrls] = useState<string[]>(initialUrls);
  const dirty = urls.join('\n') !== initial;

  return (
    <div>
      <span className="mb-1 block text-xs uppercase tracking-wider text-brand-gray">{fieldKey}</span>
      <CloudinaryUpload value={urls} onChange={setUrls} />
      {hint && <p className="mt-1 text-xs text-brand-gray">{hint}</p>}
      <Button
        size="sm"
        className="mt-2"
        disabled={!dirty}
        onClick={() => onSave(section, fieldKey, urls.join('\n'))}
      >
        Guardar
      </Button>
    </div>
  );
}

/**
 * Editor de las tarjetas que WhatsApp muestra al pegar un enlace de referido.
 * Lee las campañas efectivas desde /referral/campaigns (defaults del código ya
 * fusionados con lo guardado) y escribe cada una como un JSON en SiteContent.
 */
function CardsTab() {
  const { toast } = useToast();
  const { data, loading } = useAdminGet<Campaign[]>('/referral/campaigns');

  if (loading) return <p className="text-brand-gray">Cargando tarjetas…</p>;

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-light p-4 text-sm text-brand-gray">
        Cada tarjeta es lo que ve quien recibe el enlace por WhatsApp. Usa{' '}
        <code className="rounded bg-white px-1 font-mono text-primary">{'{nombre}'}</code> en el
        título para insertar el nombre del socio que comparte. La imagen debe ser{' '}
        <strong className="text-primary">cuadrada</strong> y con el texto al centro.
        <br />
        <span className="mt-1 block">
          Ojo: WhatsApp guarda la tarjeta de cada enlace por varios días. Si cambias una imagen,
          los mensajes ya enviados seguirán mostrando la anterior.
        </span>
      </div>

      {(data ?? []).map((c) => (
        <CampaignEditor key={c.key} campaign={c} onSaved={() => toast('Tarjeta guardada', 'success')} />
      ))}
    </div>
  );
}

function CampaignEditor({ campaign, onSaved }: { campaign: Campaign; onSaved: () => void }) {
  const { toast } = useToast();
  const { key, ...initial } = campaign;
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const set = (field: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  async function save() {
    setSaving(true);
    try {
      await adminApi.put('/content', {
        section: OG_SECTION,
        key,
        value: JSON.stringify(form),
      });
      onSaved();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg text-primary">{form.label || key}</h3>
        <code className="rounded bg-light px-2 py-1 font-mono text-xs text-brand-gray">?c={key}</code>
      </div>

      <div className="mt-4 grid gap-5 md:grid-cols-[13rem_1fr]">
        <div>
          <span className="mb-1 block text-xs uppercase tracking-wider text-brand-gray">
            Imagen de la tarjeta
          </span>
          <CloudinaryUpload
            value={form.image ? [form.image] : []}
            onChange={(urls) => set('image')(urls[urls.length - 1] ?? '')}
          />
        </div>

        <div className="space-y-3">
          <Input label="Nombre interno" value={form.label} onChange={(e) => set('label')(e.target.value)} />
          <Input label="Título de la tarjeta" value={form.title} onChange={(e) => set('title')(e.target.value)} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-primary">Descripción</span>
            <textarea
              value={form.description}
              onChange={(e) => set('description')(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-primary">
              Mensaje de WhatsApp (el enlace se agrega solo al final)
            </span>
            <textarea
              value={form.message}
              onChange={(e) => set('message')(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
          </label>
          <Input
            label="Página de destino"
            value={form.to}
            onChange={(e) => set('to')(e.target.value)}
          />
          <Button disabled={!dirty} loading={saving} onClick={save}>
            Guardar tarjeta
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AuditTab() {
  const { data, loading } = useAdminGet<AuditLogRow[]>('/admin/audit-logs');
  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/5">
      {loading && <p className="p-6 text-brand-gray">Cargando…</p>}
      {(data ?? []).map((l) => (
        <div key={l.id} className="flex items-center justify-between border-b border-black/5 px-6 py-3 text-sm last:border-0">
          <div>
            <span className="font-medium text-primary">{l.staff?.username ?? 'sistema'}</span>{' '}
            <span className="text-brand-gray">{l.action} · {l.entity}</span>
          </div>
          <span className="text-xs text-brand-gray">{new Date(l.createdAt).toLocaleString('es-EC')}</span>
        </div>
      ))}
      {!loading && (data?.length ?? 0) === 0 && <p className="p-6 text-brand-gray">Sin registros.</p>}
    </div>
  );
}

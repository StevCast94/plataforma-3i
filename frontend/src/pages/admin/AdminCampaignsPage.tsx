import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/shared/Toast';
import { useAdminGet } from '@/hooks/useAdminAPI';
import { adminApi } from '@/lib/adminApi';
import { adminCrmClient } from '@/lib/crmClient';

// Campañas y medición: identificadores de los píxeles (sin tocar código),
// generador de enlaces con UTM y resultados por campaña (del CRM).

const FIELDS: { key: string; label: string; hint: string; placeholder: string }[] = [
  { key: 'ga4_id', label: 'Google Analytics 4 · ID de medición', hint: 'Analytics → Administrar → Flujos de datos → web.', placeholder: 'G-XXXXXXXXXX' },
  { key: 'google_ads_id', label: 'Google Ads · ID de conversión', hint: 'Ads → Objetivos → Conversiones → «Contacto» → etiqueta.', placeholder: 'AW-123456789' },
  { key: 'google_ads_lead_label', label: 'Google Ads · etiqueta de la conversión «Contacto»', hint: 'El texto después de la barra en send_to.', placeholder: 'AbCdEfGh1234' },
  { key: 'meta_pixel_id', label: 'Meta (Facebook / Instagram) · ID del píxel', hint: 'Administrador de eventos → orígenes de datos.', placeholder: '123456789012345' },
  { key: 'tiktok_pixel_id', label: 'TikTok · ID del píxel', hint: 'TikTok Ads → Herramientas → Eventos → web.', placeholder: 'CXXXXXXXXXXXXXXX' },
  { key: 'search_console_file', label: 'Google Search Console · archivo de verificación', hint: 'Método «Archivo HTML»: solo el nombre del archivo.', placeholder: 'google1a2b3c4d5e.html' },
];

const SOURCES = [
  ['facebook', 'paid', 'Facebook / Instagram (Meta)'],
  ['google', 'cpc', 'Google Ads'],
  ['youtube', 'video', 'YouTube'],
  ['tiktok', 'paid', 'TikTok'],
  ['whatsapp', 'social', 'WhatsApp (difusión)'],
  ['email', 'email', 'Correo'],
] as const;

const slug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

interface Report {
  campaigns: { name: string; leads: number; won: number }[];
  total: number;
}

export default function AdminCampaignsPage() {
  const { toast } = useToast();
  const { data } = useAdminGet<Record<string, string>>('/content?section=tracking');
  const { data: projects } = useAdminGet<{ slug: string; name: string }[]>('/admin/projects');
  const [ids, setIds] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState<Report | null>(null);

  // Generador de enlaces
  const [page, setPage] = useState('/proyectos/montanita-view');
  const [src, setSrc] = useState(0);
  const [campaign, setCampaign] = useState('');
  const [content, setContent] = useState('');
  const [lang, setLang] = useState<'es' | 'en'>('es');

  useEffect(() => {
    if (data) setIds(data);
  }, [data]);
  useEffect(() => {
    adminCrmClient.get<Report>('/crm/report?days=90').then(setReport).catch(() => {});
  }, []);

  async function saveIds() {
    setSaving(true);
    try {
      for (const f of FIELDS) {
        const v = (ids[f.key] ?? '').trim();
        if (v !== (data?.[f.key] ?? '')) await adminApi.put('/content', { section: 'tracking', key: f.key, value: v });
      }
      toast('Medición guardada. Se aplica al recargar la web.', 'success');
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const link = useMemo(() => {
    const [s, m] = SOURCES[src];
    const q = new URLSearchParams({ utm_source: s, utm_medium: m, utm_campaign: slug(campaign) || 'campana' });
    if (content.trim()) q.set('utm_content', slug(content));
    return `https://grupo3i.com${lang === 'en' ? '/en' : ''}${page}?${q.toString()}`;
  }, [src, campaign, content, page, lang]);

  const active = FIELDS.filter((f) => (data?.[f.key] ?? '').trim()).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Campañas y medición</h1>
        <p className="max-w-3xl text-sm text-brand-gray">
          Conecta Google, Meta y TikTok para medir qué anuncio trae cada contacto. Los píxeles solo se activan cuando el visitante acepta las
          cookies. Cada contacto guarda su campaña y la ves en su ficha del CRM.
        </p>
      </div>

      <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-primary">1 · Identificadores</h2>
          <span className={`rounded-full px-3 py-1 text-xs ${active ? 'bg-green-50 text-green-700' : 'bg-light text-brand-gray'}`}>
            {active ? `${active} de ${FIELDS.length} conectados` : 'Sin conectar'}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <Input label={f.label} placeholder={f.placeholder} value={ids[f.key] ?? ''} onChange={(e) => setIds({ ...ids, [f.key]: e.target.value })} />
              <p className="mt-1 text-xs text-brand-gray">{f.hint}</p>
            </div>
          ))}
        </div>
        <Button className="mt-5" onClick={saveIds} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
        <p className="mt-3 text-xs text-brand-gray">
          Mapa del sitio para Google: <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="text-secondary hover:underline">grupo3i.com/sitemap.xml</a>
        </p>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="mb-1 text-lg font-semibold text-primary">2 · Enlace para cada anuncio</h2>
        <p className="mb-4 text-sm text-brand-gray">Usa este enlace como destino del anuncio: así el contacto llega al CRM con el nombre de la campaña.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-primary">Página de destino</span>
            <select value={page} onChange={(e) => setPage(e.target.value)} className="w-full rounded-lg border border-black/15 bg-white px-4 py-3 text-sm">
              {(projects ?? []).map((p) => (
                <option key={p.slug} value={`/proyectos/${p.slug}`}>{p.name}</option>
              ))}
              <option value="/proyectos">Todos los proyectos</option>
              <option value="/publica-tu-proyecto">Para desarrolladoras</option>
              <option value="/oficina">Refiere y gana</option>
              <option value="/club">Club 3i</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-primary">Red</span>
            <select value={src} onChange={(e) => setSrc(Number(e.target.value))} className="w-full rounded-lg border border-black/15 bg-white px-4 py-3 text-sm">
              {SOURCES.map(([, , l], i) => (
                <option key={l} value={i}>{l}</option>
              ))}
            </select>
          </label>
          <Input label="Nombre de la campaña" placeholder="MV lanzamiento octubre" value={campaign} onChange={(e) => setCampaign(e.target.value)} />
          <Input label="Anuncio (opcional)" placeholder="video dron 30s" value={content} onChange={(e) => setContent(e.target.value)} />
          <div className="flex gap-2 text-sm">
            {(['es', 'en'] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} className={`rounded-full px-3 py-1 ${lang === l ? 'bg-primary text-white' : 'bg-light text-brand-gray'}`}>
                {l === 'es' ? 'Español' : 'Inglés'}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-light p-3">
          <code className="min-w-0 flex-1 break-all text-xs text-primary">{link}</code>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard?.writeText(link);
              toast('Enlace copiado', 'success');
            }}
          >
            Copiar
          </Button>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="mb-1 text-lg font-semibold text-primary">3 · Resultados por campaña (90 días, proyectos propios)</h2>
        <p className="mb-4 text-sm text-brand-gray">Contactos y ventas según el origen guardado en cada contacto del CRM.</p>
        {!report ? (
          <p className="text-sm text-brand-gray">Cargando…</p>
        ) : !report.campaigns.length ? (
          <p className="text-sm text-brand-gray">Aún no hay contactos en el período.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-brand-gray">
              <tr>
                <th className="py-2">Origen · campaña</th>
                <th className="py-2 text-right">Contactos</th>
                <th className="py-2 text-right">Ventas</th>
              </tr>
            </thead>
            <tbody>
              {report.campaigns.map((c) => (
                <tr key={c.name} className="border-t border-black/5">
                  <td className="py-2 text-primary">{c.name}</td>
                  <td className="py-2 text-right tabular-nums">{c.leads}</td>
                  <td className="py-2 text-right tabular-nums">{c.won}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}


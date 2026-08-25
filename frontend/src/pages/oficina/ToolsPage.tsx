import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Smartphone, Link2, Image as ImageIcon } from 'lucide-react';
import { Seo } from '@/components/shared/Seo';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useToast } from '@/components/shared/Toast';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
import { whatsappShareUrl } from '@/lib/referral';
import { copyToClipboard } from '@/lib/clipboard';
import { generateShareCard } from '@/lib/shareCard';
import { ReferralPerks } from '@/components/shared/ReferralPerks';
import { useSectionContent } from '@/hooks/useSiteContent';
import { useReferralCampaigns } from '@/hooks/useReferralCampaigns';

interface LinkInfo {
  code: string;
  clicks: number;
  conversions: number;
}

// Valores por defecto — se usan solo si el admin aún no configuró
// "referral_templates" en Configuración > Contenido.
const DEFAULT_WHATSAPP_TEMPLATES = [
  '¡Hola! Te invito al Club 3i 🌍 Viaja con hasta 70% de descuento en hoteles. Regístrate con mi enlace:',
  '¿Sabías que puedes invertir en propiedades desde $5,000? Te cuento cómo con Grupo 3i:',
  'Estoy ganando ingresos refiriendo al Club 3i. Únete a mi equipo aquí:',
  '🎁 Compra tu propiedad o fracción con Grupo 3i por mi enlace y te llevas GRATIS la membresía del Club de Viajes:',
];

export default function ToolsPage() {
  const { member } = useAuth();
  const { toast } = useToast();
  const { data: products } = useProducts();
  const { data: templateContent } = useSectionContent('referral_templates');
  const { data: campaigns, loading: loadingCampaigns } = useReferralCampaigns();
  const [info, setInfo] = useState<LinkInfo | null>(null);
  const [qr, setQr] = useState<string>('');
  const [sharePath, setSharePath] = useState('/');
  const [generatingCard, setGeneratingCard] = useState(false);

  const whatsappTemplates =
    templateContent && Object.keys(templateContent).length > 0
      ? Object.keys(templateContent)
          .sort()
          .map((k) => templateContent[k])
      : DEFAULT_WHATSAPP_TEMPLATES;

  useEffect(() => {
    if (!member) return;
    api
      .get<LinkInfo>(`/referral-links/${member.referralCode}`)
      .then(setInfo)
      .catch(() => setInfo(null));
  }, [member]);

  // El enlace se construye SIEMPRE con el origin actual del navegador, nunca
  // con una URL guardada en la base de datos: así sigue funcionando aunque el
  // dominio cambie más adelante (justo lo que rompió los enlaces viejos al
  // migrar a grupo3i.com — quedaron con la URL de Railway congelada en la BD).
  // Sin ?to=, el backend lo manda al formulario de registro (ver referral.ts).
  const fullUrl = member ? `${window.location.origin}/r/${member.referralSlug}` : '';

  useEffect(() => {
    if (!fullUrl) return;
    QRCode.toDataURL(fullUrl, { width: 320, margin: 2, color: { dark: '#1A1A1A', light: '#FFFFFF' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [fullUrl]);

  if (!member) return null;

  // ?to= SIEMPRE explícito: el destino por defecto de /r/:slug es el registro,
  // así que "Página principal" necesita declararlo para no caer en el formulario.
  const shareLink = `${window.location.origin}/r/${member.referralSlug}?to=${encodeURIComponent(sharePath)}`;

  async function copy(text: string) {
    const ok = await copyToClipboard(text);
    toast(ok ? 'Copiado ✅' : 'No se pudo copiar. Mantén presionado el texto para copiarlo.', ok ? 'success' : 'error');
  }

  function downloadQr() {
    if (!qr) return;
    const a = document.createElement('a');
    a.href = qr;
    a.download = `qr-${member!.referralCode}.png`;
    a.click();
  }

  async function downloadShareCard() {
    if (!qr || !member) return;
    setGeneratingCard(true);
    try {
      const dataUrl = await generateShareCard(qr, member.fullName.split(' ')[0]);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `grupo3i-${member.referralSlug}.png`;
      a.click();
    } catch {
      toast('No se pudo generar la tarjeta. Intenta de nuevo.', 'error');
    } finally {
      setGeneratingCard(false);
    }
  }

  const conversionRate =
    info && info.clicks > 0 ? Math.round((info.conversions / info.clicks) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Seo title="Mi enlace y comisiones — Oficina Virtual" />
      <h1 className="text-3xl font-bold text-primary">Mi enlace y comisiones</h1>

      <ReferralPerks variant="member" />

      {/* Mi enlace */}
      <section className="grid gap-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 lg:grid-cols-2">
        <div>
          <h2 className="text-xl text-primary">Mi enlace de referido</h2>
          <p className="mt-1 text-sm text-brand-gray">
            Lleva directo al <strong className="text-primary">formulario de registro</strong> con
            tu nombre ya vinculado. Compártelo para empezar a ganar.
          </p>

          <div className="mt-4">
            <p className="text-xs uppercase tracking-wider text-brand-gray">Enlace completo</p>
            <div className="mt-1 flex items-center gap-2">
              <input
                readOnly
                value={fullUrl}
                className="min-w-0 flex-1 rounded-lg bg-light px-3 py-2 text-sm text-primary"
              />
              <Button size="sm" variant="outline" onClick={() => copy(fullUrl)}>
                Copiar
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs uppercase tracking-wider text-brand-gray">Código</p>
            <p className="mt-0.5 text-xs text-brand-gray">
              Para cuando invitas de palabra: si alguien va a registrarse por su cuenta, dale este
              código para que lo escriba en "¿Alguien te invitó?" del registro. Para redes sociales
              usa tu enlace de arriba.
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="rounded-lg bg-light px-3 py-2 font-mono text-lg font-bold text-primary">
                {member.referralCode}
              </code>
              <Button size="sm" variant="outline" onClick={() => copy(member.referralCode)}>
                Copiar
              </Button>
            </div>
          </div>

          {/* Stats del enlace */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <Stat label="Clicks" value={`${info?.clicks ?? 0}`} />
            <Stat label="Conversiones" value={`${info?.conversions ?? 0}`} />
            <Stat label="Tasa" value={`${conversionRate}%`} />
          </div>
        </div>

        {/* QR */}
        <div className="flex flex-col items-center justify-center rounded-2xl bg-light p-6">
          {qr ? (
            <img src={qr} alt="QR de tu enlace" className="h-48 w-48 rounded-xl bg-white p-2" />
          ) : (
            <div className="h-48 w-48 animate-pulse rounded-xl bg-white" />
          )}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button size="sm" variant="outline" onClick={downloadQr} disabled={!qr}>
              Descargar QR
            </Button>
            <Button
              size="sm"
              onClick={downloadShareCard}
              disabled={!qr}
              loading={generatingCard}
            >
              <ImageIcon className="h-3.5 w-3.5" strokeWidth={1.8} /> Tarjeta para Stories
            </Button>
          </div>
          <p className="mt-2 max-w-[220px] text-center text-xs text-brand-gray">
            Lista para Instagram o WhatsApp Status, con tu QR y la marca 3i.
          </p>
        </div>
      </section>

      {/* Compartir cualquier página */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-xl text-primary">Comparte cualquier página con tu código</h2>
        <p className="mt-1 text-sm text-brand-gray">
          Comparte la página principal o un producto. Quien abra tu enlace queda vinculado a ti
          por 90 días, aunque solo pida información o agende una visita.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <select
            value={sharePath}
            onChange={(e) => setSharePath(e.target.value)}
            className="rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm text-primary"
          >
            <option value="/">Página principal</option>
            <option value="/club">Club 3i</option>
            <option value="/club/viajes">Club de Viajes</option>
            {(products ?? []).map((p) => (
              <option key={p.id} value={`/tienda/${p.slug}`}>
                Producto: {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <input
            readOnly
            value={shareLink}
            className="min-w-0 flex-1 rounded-lg bg-light px-3 py-2 text-sm text-primary"
          />
          <Button size="sm" variant="outline" onClick={() => copy(shareLink)}>Copiar</Button>
          <a href={whatsappShareUrl(shareLink)} target="_blank" rel="noreferrer">
            <Button size="sm">WhatsApp</Button>
          </a>
        </div>
      </section>

      {/* Compartir directo */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-xl text-primary">Compartir directamente</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={whatsappShareUrl(fullUrl)} target="_blank" rel="noreferrer">
            <Button><Smartphone className="h-4 w-4" strokeWidth={1.8} /> Compartir por WhatsApp</Button>
          </a>
          <Button variant="outline" onClick={() => copy(fullUrl)}>
            <Link2 className="h-4 w-4" strokeWidth={1.8} /> Copiar enlace
          </Button>
        </div>
      </section>

      {/* Mensajes listos con su tarjeta */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-xl text-primary">Mensajes listos para compartir</h2>
        <p className="mt-1 text-sm text-brand-gray">
          Cada mensaje lleva su propia tarjeta de presentación: al pegarlo en WhatsApp,
          quien lo reciba verá esta imagen con tu nombre. Copia y pega, nada más.
        </p>

        <div className="mt-5 space-y-4">
          {(campaigns ?? []).map((c) => {
            const link = `${window.location.origin}/r/${member.referralSlug}?c=${c.key}`;
            const text = `${c.message} ${link}`;
            return (
              <div
                key={c.key}
                className="grid gap-4 rounded-xl bg-light p-4 sm:grid-cols-[9rem_1fr]"
              >
                <img
                  src={c.image}
                  alt={`Tarjeta: ${c.label}`}
                  loading="lazy"
                  className="aspect-square w-full rounded-lg object-cover ring-1 ring-black/10"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-secondary">
                    {c.label}
                  </p>
                  <p className="mt-1.5 text-sm text-primary">{c.message}</p>
                  <p className="mt-1 break-all text-sm text-accent">{link}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => copy(text)}>
                      Copiar mensaje
                    </Button>
                    <a href={whatsappShareUrl(link, c.message)} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline">
                        <Smartphone className="h-3.5 w-3.5" strokeWidth={1.8} /> WhatsApp
                      </Button>
                    </a>
                    <a href={c.image} download={`grupo3i-${c.key}.jpg`}>
                      <Button size="sm" variant="outline">
                        <ImageIcon className="h-3.5 w-3.5" strokeWidth={1.8} /> Imagen
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}

          {loadingCampaigns && <p className="text-sm text-brand-gray">Cargando mensajes…</p>}

          {/* Respaldo: si la API de campañas falla, al menos quedan los textos. */}
          {!loadingCampaigns && (campaigns?.length ?? 0) === 0 &&
            whatsappTemplates.map((t, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-light p-4">
                <p className="flex-1 text-sm text-primary">
                  {t} <span className="text-accent">{fullUrl}</span>
                </p>
                <Button size="sm" variant="outline" onClick={() => copy(`${t} ${fullUrl}`)}>
                  Copiar
                </Button>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-light p-3">
      <p className="font-serif text-xl font-bold text-primary">{value}</p>
      {/* Sin tracking extra y con guion de corte: "Conversiones" es una sola
          palabra de 85px y la celda mide 66px en pantallas de 375px — con
          letter-spacing se cortaba a media palabra. */}
      <p className="hyphens-auto break-words text-[10px] uppercase text-brand-gray" lang="es">
        {label}
      </p>
    </div>
  );
}

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Seo } from '@/components/shared/Seo';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useToast } from '@/components/shared/Toast';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
import { whatsappShareUrl } from '@/lib/referral';

interface LinkInfo {
  code: string;
  fullUrl: string;
  clicks: number;
  conversions: number;
}

const WHATSAPP_TEMPLATES = [
  '¡Hola! Te invito al Club 3i 🌍 Viaja con hasta 70% de descuento en hoteles. Regístrate con mi enlace:',
  '¿Sabías que puedes invertir en propiedades desde $5,000? Te cuento cómo con Grupo 3i:',
  'Estoy ganando ingresos refiriendo al Club 3i. Únete a mi equipo aquí:',
];

export default function ToolsPage() {
  const { member } = useAuth();
  const { toast } = useToast();
  const { data: products } = useProducts();
  const [info, setInfo] = useState<LinkInfo | null>(null);
  const [qr, setQr] = useState<string>('');
  const [sharePath, setSharePath] = useState('/');

  useEffect(() => {
    if (!member) return;
    api
      .get<LinkInfo>(`/referral-links/${member.referralCode}`)
      .then(setInfo)
      .catch(() => setInfo(null));
  }, [member]);

  const fullUrl = info?.fullUrl ?? '';

  useEffect(() => {
    if (!fullUrl) return;
    QRCode.toDataURL(fullUrl, { width: 320, margin: 2, color: { dark: '#1A1A1A', light: '#FFFFFF' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [fullUrl]);

  if (!member) return null;

  const shareLink =
    `${window.location.origin}/r/${member.referralCode}` +
    (sharePath !== '/' ? `?to=${encodeURIComponent(sharePath)}` : '');

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => toast('Copiado ✅', 'success'));
  }

  function downloadQr() {
    if (!qr) return;
    const a = document.createElement('a');
    a.href = qr;
    a.download = `qr-${member!.referralCode}.png`;
    a.click();
  }

  const conversionRate =
    info && info.clicks > 0 ? Math.round((info.conversions / info.clicks) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Seo title="Herramientas — Oficina Virtual" />
      <h1 className="text-3xl font-bold text-primary">Herramientas</h1>

      {/* Mi enlace */}
      <section className="grid gap-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 lg:grid-cols-2">
        <div>
          <h2 className="text-xl text-primary">Mi enlace de referido</h2>
          <p className="mt-1 text-sm text-brand-gray">Compártelo para empezar a ganar.</p>

          <div className="mt-4">
            <p className="text-xs uppercase tracking-wider text-brand-gray">Código</p>
            <div className="mt-1 flex items-center gap-2">
              <code className="rounded-lg bg-light px-3 py-2 font-mono text-lg font-bold text-primary">
                {member.referralCode}
              </code>
              <Button size="sm" variant="outline" onClick={() => copy(member.referralCode)}>
                Copiar
              </Button>
            </div>
          </div>

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
          <Button size="sm" className="mt-4" onClick={downloadQr} disabled={!qr}>
            Descargar QR
          </Button>
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
            <Button>📲 Compartir por WhatsApp</Button>
          </a>
          <Button variant="outline" onClick={() => copy(fullUrl)}>
            🔗 Copiar enlace
          </Button>
        </div>
      </section>

      {/* Materiales */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-xl text-primary">Plantillas de WhatsApp</h2>
        <div className="mt-4 space-y-3">
          {WHATSAPP_TEMPLATES.map((t, i) => (
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

      {/* Banners placeholder */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-xl text-primary">Materiales promocionales</h2>
        <p className="mt-1 text-sm text-brand-gray">Banners y posts listos para compartir (próximamente).</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-center text-sm font-semibold text-white"
            >
              Banner 3i #{i}
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
      <p className="text-[10px] uppercase tracking-wider text-brand-gray">{label}</p>
    </div>
  );
}

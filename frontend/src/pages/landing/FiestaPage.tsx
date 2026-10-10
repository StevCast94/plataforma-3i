import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Seo } from '@/components/shared/Seo';
import { PhoneField } from '@/components/shared/PhoneField';
import { copyToClipboard } from '@/lib/clipboard';

// ============================================================
// /fiesta — "Comparte y Grupo 3i te invita un trago".
// El invitado deja nombre y WhatsApp (queda como socio pre-registrado con su
// enlace de referidor), comparte una imagen con su enlace en su estado de
// WhatsApp, historia de Instagram o Facebook, y por cada red recibe una
// bebida (máximo 2). El bartender canjea tocando el botón en su teléfono.
// ============================================================

const BG = 'https://res.cloudinary.com/db3t73yas/image/upload/f_jpg,q_80,w_1400/v1782175132/grupo3i/yufkwt3egbepie1jjfbx.jpg';
const SECRET_KEY = 'g3i_fiesta_secret';
const IG = '@grupoinmobiliario3i';

type Channel = 'whatsapp' | 'instagram' | 'facebook';
const CHANNELS: { id: Channel; label: string; where: string; color: string }[] = [
  { id: 'whatsapp', label: 'Estado de WhatsApp', where: 'WhatsApp → Mi estado', color: '#25D366' },
  { id: 'instagram', label: 'Historia de Instagram', where: 'Instagram → Tu historia', color: '#E1306C' },
  { id: 'facebook', label: 'Historia de Facebook', where: 'Facebook → Historia', color: '#1877F2' },
];

interface Drink {
  id: string;
  channel: Channel;
  code: string;
  redeemedAt: string | null;
}
interface Guest {
  name: string;
  firstName: string;
  link: string;
  drinks: Drink[];
  maxDrinks: number;
}
interface EventInfo {
  id: string;
  title: string;
  place: string;
  active: boolean;
}

const store = {
  get: () => {
    try {
      return localStorage.getItem(SECRET_KEY);
    } catch {
      return null;
    }
  },
  set: (v: string) => {
    try {
      localStorage.setItem(SECRET_KEY, v);
    } catch {
      /* sin almacenamiento */
    }
  },
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  const words = text.split(' ');
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      line = w;
      y += lh;
    } else line = test;
  }
  ctx.fillText(line, x, y);
  return y;
}

/** Imagen vertical (1080×1920) para historia / estado, con el enlace personal y su QR. */
async function makeShareImage(guest: Guest, place: string): Promise<File> {
  await document.fonts.ready;
  const W = 1080;
  const H = 1920;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const bg = await loadImage(BG);
  // Fondo: el mapa de solares, recortado al formato vertical.
  const scale = Math.max(W / bg.width, H / bg.height);
  const bw = bg.width * scale;
  const bh = bg.height * scale;
  ctx.drawImage(bg, (W - bw) / 2 - bw * 0.08, (H - bh) / 2, bw, bh);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(0,0,0,0.70)');
  g.addColorStop(0.35, 'rgba(0,0,0,0.15)');
  g.addColorStop(0.6, 'rgba(0,0,0,0.55)');
  g.addColorStop(1, 'rgba(0,0,0,0.92)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffc428';
  ctx.font = '600 34px Inter, sans-serif';
  ctx.fillText('GRUPO 3i  ·  ' + IG, W / 2, 120);
  ctx.fillStyle = '#fff';
  ctx.font = '700 92px "Playfair Display", serif';
  let y = wrap(ctx, `Grupo 3i me invitó un trago 🍹`, W / 2, 250, 940, 104);
  ctx.font = '500 44px Inter, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  y = wrap(ctx, `en el ${place}`, W / 2, y + 80, 940, 56);

  // Bloque inferior
  ctx.fillStyle = '#ffc428';
  ctx.font = '700 64px "Playfair Display", serif';
  ctx.fillText('Montañita View', W / 2, 1180);
  ctx.fillStyle = '#fff';
  ctx.font = '500 42px Inter, sans-serif';
  wrap(ctx, 'Elige tu solar con vista al mar desde $41,721', W / 2, 1250, 900, 54);

  const qr = await QRCode.toDataURL(guest.link, { margin: 1, width: 360, color: { dark: '#111827', light: '#ffffff' } });
  const q = await loadImage(qr);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.roundRect(W / 2 - 200, 1360, 400, 400, 28);
  ctx.fill();
  ctx.drawImage(q, W / 2 - 180, 1380, 360, 360);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '500 32px Inter, sans-serif';
  ctx.fillText(guest.link.replace(/^https?:\/\//, '').replace(/\?.*$/, ''), W / 2, 1815);
  ctx.fillStyle = '#ffc428';
  ctx.font = '600 30px Inter, sans-serif';
  ctx.fillText('#GrupoTeInvita', W / 2, 1870);

  const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), 'image/jpeg', 0.9));
  return new File([blob], 'grupo3i-montanita-view.jpg', { type: 'image/jpeg' });
}

export default function FiestaPage() {
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [secret, setSecret] = useState<string | null>(store.get());
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [fallback, setFallback] = useState<{ channel: Channel; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get<EventInfo>('/events/current').then(setEvent).catch(() => {});
    if (!secret) {
      setLoading(false);
      return;
    }
    api
      .get<Guest>(`/events/me?secret=${secret}`)
      .then(setGuest)
      .catch(() => setSecret(null))
      .finally(() => setLoading(false));
  }, [secret]);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) return setError('Escribe tu nombre.');
    if (phone.replace(/\D/g, '').length < 9) return setError('Escribe tu número de WhatsApp.');
    if (!consent) return setError('Acepta el uso de tus datos para continuar.');
    setBusy('join');
    try {
      const r = await api.post<Guest & { secret: string }>(`/events/${event?.id ?? 'halloween-cubata'}/join`, { name, phone, consent });
      store.set(r.secret);
      setSecret(r.secret);
      setGuest(r);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy('');
    }
  }

  async function earn(channel: Channel) {
    if (!secret) return;
    const r = await api.post<Guest>('/events/drink', { secret, channel });
    setGuest(r);
    setFallback(null);
  }

  async function share(channel: Channel) {
    if (!guest || !event) return;
    setBusy(channel);
    try {
      const file = await makeShareImage(guest, event.place);
      const text = `¡Grupo 3i me invitó un trago en el ${event.place}! 🍹 Mira los solares con vista al mar: ${guest.link} ${IG} #GrupoTeInvita`;
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text });
          await earn(channel);
        } catch (err) {
          if ((err as Error).name !== 'AbortError') setFallback({ channel, url: URL.createObjectURL(file) });
        }
      } else {
        // Sin "compartir" nativo: descargar la imagen y publicarla a mano.
        setFallback({ channel, url: URL.createObjectURL(file) });
      }
    } catch {
      setError('No pudimos preparar la imagen. Inténtalo de nuevo.');
    } finally {
      setBusy('');
    }
  }

  async function redeem(d: Drink) {
    if (!secret || !window.confirm('¿Entregar esta bebida? (solo el bartender)')) return;
    setGuest(await api.post<Guest>('/events/redeem', { secret, drinkId: d.id }));
  }

  const pending = guest?.drinks.filter((d) => !d.redeemedAt) ?? [];
  const full = (guest?.drinks.length ?? 0) >= (guest?.maxDrinks ?? 2);

  return (
    <div className="min-h-screen bg-primary text-white">
      <Seo title="Comparte y Grupo 3i te invita un trago 🍹" description="Fiesta en el Lobby de Montañita View." />
      <div className="relative">
        <img src={BG} alt="" className="absolute inset-0 h-72 w-full object-cover opacity-50" />
        <div className="absolute inset-0 h-72 bg-gradient-to-b from-black/30 to-primary" />
        <div className="relative mx-auto max-w-md px-5 pb-6 pt-10 text-center">
          <img src="/images/logotipo-light.svg" alt="Grupo 3i" className="mx-auto h-7" />
          <h1 className="mt-6 font-serif text-4xl font-bold leading-tight">
            Comparte y te invitamos un trago <span aria-hidden>🍹</span>
          </h1>
          <p className="mt-2 text-sm text-white/80">{event?.place ?? 'Lobby de Montañita View'}</p>
        </div>
      </div>

      <main className="mx-auto max-w-md px-5 pb-16">
        {loading ? (
          <Loader2 className="mx-auto mt-10 h-8 w-8 animate-spin text-secondary" />
        ) : event && !event.active ? (
          <p className="mt-6 rounded-2xl bg-white/10 p-5 text-center">Esta promoción ya terminó. ¡Gracias por venir!</p>
        ) : !guest ? (
          <form onSubmit={join} className="space-y-4 rounded-2xl bg-white p-5 text-primary shadow-xl">
            <p className="text-sm text-brand-gray">
              Por cada red donde compartas (estado de WhatsApp, historia de Instagram o Facebook) te invitamos{' '}
              <b className="text-primary">una bebida, hasta 2</b>.
            </p>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Tu nombre</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-base"
                placeholder="Nombre y apellido"
              />
            </label>
            <PhoneField label="Tu WhatsApp" required onChange={setPhone} />
            <label className="flex items-start gap-2 text-xs text-brand-gray">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
              <span>
                Acepto que Grupo 3i use mi nombre y WhatsApp para contactarme y crear mi enlace personal de referidor
                (puedo pedir que me den de baja cuando quiera).
              </span>
            </label>
            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            <button
              disabled={busy === 'join'}
              className="w-full rounded-full bg-secondary py-3.5 text-base font-bold text-primary shadow-lg disabled:opacity-60"
            >
              {busy === 'join' ? 'Un momento…' : 'Quiero mi trago 🍹'}
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            {/* Bebidas ganadas */}
            {guest.drinks.map((d, i) => (
              <Voucher key={d.id} drink={d} n={i + 1} onRedeem={() => redeem(d)} />
            ))}

            {!full && (
              <div className="rounded-2xl bg-white p-5 text-primary">
                <p className="font-semibold">
                  {guest.drinks.length === 0 ? `¡Listo, ${guest.firstName}! Elige dónde compartir:` : 'Comparte en otra red y gana tu segunda bebida:'}
                </p>
                <p className="mt-1 text-xs text-brand-gray">
                  Se abre la app con tu imagen lista. Publícala y muéstrasela al bartender.
                </p>
                <div className="mt-4 space-y-2.5">
                  {CHANNELS.filter((c) => !guest.drinks.some((d) => d.channel === c.id)).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => share(c.id)}
                      disabled={!!busy}
                      className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left font-semibold text-white shadow disabled:opacity-60"
                      style={{ background: c.color }}
                    >
                      <span>Compartir en {c.label}</span>
                      {busy === c.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>→</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {fallback && (
              <div className="rounded-2xl bg-white p-5 text-primary">
                <p className="font-semibold">Publícala a mano en 3 pasos:</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-brand-gray">
                  <li>Descarga tu imagen.</li>
                  <li>Ábrela en {CHANNELS.find((c) => c.id === fallback.channel)?.where}.</li>
                  <li>Vuelve aquí y toca «Ya lo publiqué».</li>
                </ol>
                <img src={fallback.url} alt="" className="mx-auto mt-3 h-64 rounded-lg" />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <a
                    href={fallback.url}
                    download="grupo3i-montanita-view.jpg"
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-black/15 py-2.5 text-sm font-semibold"
                  >
                    <Download className="h-4 w-4" /> Descargar
                  </a>
                  <button
                    onClick={() => earn(fallback.channel)}
                    className="rounded-lg bg-secondary py-2.5 text-sm font-bold text-primary"
                  >
                    Ya lo publiqué
                  </button>
                </div>
              </div>
            )}

            {full && pending.length === 0 && (
              <p className="rounded-2xl bg-white/10 p-4 text-center text-sm">
                ¡Ya disfrutaste tus {guest.maxDrinks} bebidas! Gracias por compartir 🎉
              </p>
            )}

            {/* Su enlace de referidor */}
            <div className="rounded-2xl bg-white/10 p-5">
              <p className="text-sm font-semibold text-secondary">Tu enlace personal de Grupo 3i</p>
              <p className="mt-1 text-xs text-white/70">
                Si alguien compra un solar con tu enlace, ganas comisión. Mañana te escribimos por WhatsApp para activar tu
                cuenta y verlo todo con calma.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <input readOnly value={guest.link} className="min-w-0 flex-1 rounded-lg bg-white/90 px-3 py-2 text-xs text-primary" />
                <button
                  onClick={async () => setCopied(await copyToClipboard(guest.link))}
                  className="rounded-lg bg-secondary p-2 text-primary"
                  aria-label="Copiar enlace"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        )}
        <p className="mt-8 text-center text-xs text-white/50">Válido durante el evento · máximo 2 bebidas por persona · {IG}</p>
      </main>
    </div>
  );
}

/** Vale de la bebida: animado y con la hora en vivo para que no sirva una captura. */
function Voucher({ drink, n, onRedeem }: { drink: Drink; n: number; onRedeem: () => void }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (drink.redeemedAt) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [drink.redeemedAt]);
  const ch = useMemo(() => CHANNELS.find((c) => c.id === drink.channel), [drink.channel]);

  if (drink.redeemedAt)
    return (
      <div className="rounded-2xl bg-white/10 p-4 text-center text-sm text-white/60">
        Bebida {n} · {ch?.label} · entregada a las{' '}
        {new Date(drink.redeemedAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })} ✓
      </div>
    );

  return (
    <div className="fiesta-voucher relative overflow-hidden rounded-2xl p-5 text-center text-primary shadow-2xl">
      <p className="text-xs font-bold uppercase tracking-widest">Bebida {n} · {ch?.label}</p>
      <p className="mt-1 font-serif text-3xl font-bold">¡Tu trago está listo! 🍹</p>
      <p className="mt-2 font-mono text-5xl font-bold tracking-widest">{drink.code}</p>
      <p className="mt-1 font-mono text-lg tabular-nums">{now.toLocaleTimeString('es-EC')}</p>
      <p className="mt-2 text-xs">Muestra tu publicación y esta pantalla en la barra.</p>
      <button onClick={onRedeem} className="mt-4 w-full rounded-full bg-primary py-3 text-sm font-bold text-white">
        Entregar bebida (solo el bartender)
      </button>
    </div>
  );
}

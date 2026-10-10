import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Seo } from '@/components/shared/Seo';
import { PhoneField } from '@/components/shared/PhoneField';
import { copyToClipboard } from '@/lib/clipboard';

// ============================================================
// /fiesta — activación de eventos de Grupo 3i.
// El invitado elige idioma, deja nombre y WhatsApp (queda como socio
// pre-registrado con su enlace de referidor, en su idioma), comparte una
// imagen del evento con su enlace en su estado de WhatsApp, historia de
// Instagram o Facebook, y recibe una bebida cortesía de Grupo 3i.
// El bartender la entrega tocando el botón en su teléfono.
// ============================================================

const BG = 'https://res.cloudinary.com/db3t73yas/image/upload/f_jpg,q_80,w_1400/v1782175132/grupo3i/yufkwt3egbepie1jjfbx.jpg';
const SECRET_KEY = 'g3i_fiesta_secret';
const LANG_KEY = 'g3i_fiesta_lang';
const IG = '@grupoinmobiliario3i';

type Lang = 'es' | 'en';
type Channel = 'whatsapp' | 'instagram' | 'facebook';

const TX = {
  es: {
    title: 'Comparte y te invitamos un trago',
    place: 'Lobby de Montañita View',
    intro: (
      <>
        Comparte en tu estado de WhatsApp, historia de Instagram o Facebook y{' '}
        <b className="text-primary">Grupo 3i te invita una bebida</b>.
      </>
    ),
    name: 'Tu nombre',
    namePh: 'Nombre y apellido',
    phone: 'Tu WhatsApp',
    consent:
      'Acepto que Grupo 3i use mi nombre y WhatsApp para contactarme y crear mi enlace personal de referidor (puedo pedir que me den de baja cuando quiera).',
    errName: 'Escribe tu nombre.',
    errPhone: 'Escribe tu número de WhatsApp.',
    errConsent: 'Acepta el uso de tus datos para continuar.',
    wait: 'Un momento…',
    cta: 'Quiero mi trago 🍹',
    ready: (n: string) => `¡Listo, ${n}! Elige dónde compartir:`,
    readyHint: 'Se abre la app con tu imagen lista. Publícala y muéstrasela al bartender.',
    shareIn: 'Compartir en',
    channels: { whatsapp: 'Estado de WhatsApp', instagram: 'Historia de Instagram', facebook: 'Historia de Facebook' },
    where: { whatsapp: 'WhatsApp → Mi estado', instagram: 'Instagram → Tu historia', facebook: 'Facebook → Historia' },
    manual: 'Publícala a mano en 3 pasos:',
    step1: 'Descarga tu imagen.',
    step2: (w: string) => `Ábrela en ${w}.`,
    step3: 'Vuelve aquí y toca «Ya lo publiqué».',
    download: 'Descargar',
    posted: 'Ya lo publiqué',
    done: '¡Ya disfrutaste tu bebida! Gracias por compartir 🎉',
    linkTitle: 'Tu enlace personal de Grupo 3i',
    linkHint:
      'Si alguien compra un solar con tu enlace, ganas comisión. Mañana te escribimos por WhatsApp para activar tu cuenta y verlo todo con calma.',
    footer: 'Válido durante el evento · una bebida por persona',
    over: 'Esta promoción ya terminó. ¡Gracias por venir!',
    voucherTag: 'Cortesía de Grupo 3i',
    voucherTitle: '¡Tu trago está listo! 🍹',
    voucherHint: 'Muestra tu publicación y esta pantalla en la barra.',
    give: 'Entregar bebida (solo el bartender)',
    giveConfirm: '¿Entregar esta bebida? (solo el bartender)',
    given: (t: string) => `Bebida de Grupo 3i entregada a las ${t} ✓`,
    imgErr: 'No pudimos preparar la imagen. Inténtalo de nuevo.',
    // Imagen para compartir
    imgEyebrow: '🎃 NOCHE DE HALLOWEEN · LOBBY MONTAÑITA VIEW',
    imgTitle: 'Lotes con vista al mar en la costa ecuatoriana',
    imgSub: 'Montañita View · desde $41,721 · 24 meses sin intereses',
    shareText: (link: string) =>
      `🎃 Noche de Halloween en el Lobby de Montañita View. Lotes con vista al mar en la costa ecuatoriana desde $41,721, a 24 meses sin intereses: ${link} ${IG}`,
  },
  en: {
    title: 'Share and get a drink on us',
    place: 'Montañita View Lobby',
    intro: (
      <>
        Share on your WhatsApp status, Instagram story or Facebook and{' '}
        <b className="text-primary">Grupo 3i buys you a drink</b>.
      </>
    ),
    name: 'Your name',
    namePh: 'First and last name',
    phone: 'Your WhatsApp',
    consent:
      'I agree that Grupo 3i may use my name and WhatsApp to contact me and create my personal referral link (I can ask to be removed at any time).',
    errName: 'Enter your name.',
    errPhone: 'Enter your WhatsApp number.',
    errConsent: 'Please accept the use of your data to continue.',
    wait: 'One moment…',
    cta: 'Get my drink 🍹',
    ready: (n: string) => `All set, ${n}! Choose where to share:`,
    readyHint: 'The app opens with your image ready. Post it and show it to the bartender.',
    shareIn: 'Share on',
    channels: { whatsapp: 'WhatsApp Status', instagram: 'Instagram Story', facebook: 'Facebook Story' },
    where: { whatsapp: 'WhatsApp → My status', instagram: 'Instagram → Your story', facebook: 'Facebook → Story' },
    manual: 'Post it manually in 3 steps:',
    step1: 'Download your image.',
    step2: (w: string) => `Open it in ${w}.`,
    step3: 'Come back and tap “I posted it”.',
    download: 'Download',
    posted: 'I posted it',
    done: 'You already enjoyed your drink! Thanks for sharing 🎉',
    linkTitle: 'Your personal Grupo 3i link',
    linkHint:
      'If someone buys a lot through your link, you earn a commission. Tomorrow we will message you on WhatsApp to activate your account and see it all calmly.',
    footer: 'Valid during the event · one drink per person',
    over: 'This promotion has ended. Thanks for coming!',
    voucherTag: 'Courtesy of Grupo 3i',
    voucherTitle: 'Your drink is ready! 🍹',
    voucherHint: 'Show your post and this screen at the bar.',
    give: 'Hand over drink (bartender only)',
    giveConfirm: 'Hand over this drink? (bartender only)',
    given: (t: string) => `Grupo 3i drink handed over at ${t} ✓`,
    imgErr: 'We could not prepare the image. Please try again.',
    imgEyebrow: '🎃 HALLOWEEN NIGHT · MONTAÑITA VIEW LOBBY',
    imgTitle: 'Ocean-view lots on the Ecuadorian coast',
    imgSub: 'Montañita View · from $41,721 · 24 months, 0% interest',
    shareText: (link: string) =>
      `🎃 Halloween night at the Montañita View Lobby. Ocean-view lots on the Ecuadorian coast from $41,721, 24 months interest-free: ${link} ${IG}`,
  },
};

const COLORS: Record<Channel, string> = { whatsapp: '#25D366', instagram: '#E1306C', facebook: '#1877F2' };
const CHANNELS: Channel[] = ['whatsapp', 'instagram', 'facebook'];

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
  lang?: Lang;
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
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* sin almacenamiento */
    }
  },
};

/** Idioma inicial: el del QR (?lang=en del afiche en inglés), el guardado o el del teléfono. */
function initialLang(): Lang {
  const q = new URLSearchParams(window.location.search).get('lang');
  if (q === 'es' || q === 'en') return q;
  const saved = store.get(LANG_KEY);
  if (saved === 'es' || saved === 'en') return saved;
  return /^es\b/i.test(navigator.language) ? 'es' : 'en';
}

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

/**
 * Imagen vertical (1080×1920) para historia / estado: el evento y los lotes,
 * con el enlace personal y su QR. La franja inferior queda libre porque
 * WhatsApp pone ahí el texto del estado encima de la imagen.
 */
async function makeShareImage(guest: Guest, lang: Lang): Promise<File> {
  const tx = TX[lang];
  await document.fonts.ready;
  const W = 1080;
  const H = 1920;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const bg = await loadImage(BG);
  const scale = Math.max(W / bg.width, H / bg.height);
  const bw = bg.width * scale;
  const bh = bg.height * scale;
  ctx.drawImage(bg, (W - bw) / 2 - bw * 0.08, (H - bh) / 2, bw, bh);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(0,0,0,0.88)');
  g.addColorStop(0.3, 'rgba(0,0,0,0.6)');
  g.addColorStop(0.45, 'rgba(0,0,0,0.2)');
  g.addColorStop(0.62, 'rgba(0,0,0,0.55)');
  g.addColorStop(1, 'rgba(0,0,0,0.92)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = '700 40px Inter, sans-serif';
  ctx.fillText('GRUPO 3i', W / 2, 110);
  ctx.fillStyle = '#ffc428';
  ctx.font = '600 30px Inter, sans-serif';
  ctx.fillText(IG, W / 2, 158);

  // Etiqueta del evento
  ctx.font = '700 30px Inter, sans-serif';
  const tag = tx.imgEyebrow;
  const tw = ctx.measureText(tag).width + 60;
  ctx.fillStyle = '#ffc428';
  ctx.beginPath();
  ctx.roundRect(W / 2 - tw / 2, 215, tw, 62, 31);
  ctx.fill();
  ctx.fillStyle = '#111827';
  ctx.fillText(tag, W / 2, 257);

  ctx.fillStyle = '#fff';
  ctx.font = '700 88px "Playfair Display", serif';
  let y = wrap(ctx, tx.imgTitle, W / 2, 400, 960, 100);
  ctx.fillStyle = '#ffc428';
  ctx.font = '600 40px Inter, sans-serif';
  y = wrap(ctx, tx.imgSub, W / 2, y + 85, 940, 52);

  const qr = await QRCode.toDataURL(guest.link, { margin: 1, width: 340, color: { dark: '#111827', light: '#ffffff' } });
  const q = await loadImage(qr);
  const qy = 1010;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.roundRect(W / 2 - 190, qy, 380, 380, 28);
  ctx.fill();
  ctx.drawImage(q, W / 2 - 170, qy + 20, 340, 340);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = '500 32px Inter, sans-serif';
  ctx.fillText(guest.link.replace(/^https?:\/\//, '').replace(/\?.*$/, ''), W / 2, qy + 440);
  ctx.fillStyle = '#ffc428';
  ctx.font = '600 30px Inter, sans-serif';
  ctx.fillText('#MontañitaView', W / 2, qy + 490);

  const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), 'image/jpeg', 0.9));
  return new File([blob], 'montanita-view.jpg', { type: 'image/jpeg' });
}

export default function FiestaPage() {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const tx = TX[lang];
  const setLang = (l: Lang) => {
    setLangState(l);
    store.set(LANG_KEY, l);
  };
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [secret, setSecret] = useState<string | null>(store.get(SECRET_KEY));
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [fallback, setFallback] = useState<{ channel: Channel; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    api.get<EventInfo>('/events/current').then(setEvent).catch(() => {});
    if (!secret) {
      setLoading(false);
      return;
    }
    api
      .get<Guest>(`/events/me?secret=${secret}`)
      .then((g) => {
        setGuest(g);
        if (g.lang) setLang(g.lang);
      })
      .catch(() => setSecret(null))
      .finally(() => setLoading(false));
  }, [secret]);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) return setError(tx.errName);
    if (phone.replace(/\D/g, '').length < 9) return setError(tx.errPhone);
    if (!consent) return setError(tx.errConsent);
    setBusy('join');
    try {
      const r = await api.post<Guest & { secret: string }>(`/events/${event?.id ?? 'halloween-cubata'}/join`, {
        name,
        phone,
        consent,
        lang,
      });
      store.set(SECRET_KEY, r.secret);
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
    try {
      setGuest(await api.post<Guest>('/events/drink', { secret, channel }));
    } catch (err) {
      setError((err as Error).message);
    }
    setFallback(null);
  }

  async function share(channel: Channel) {
    if (!guest) return;
    setBusy(channel);
    setError('');
    try {
      const file = await makeShareImage(guest, lang);
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: tx.shareText(guest.link) });
          await earn(channel);
        } catch (err) {
          if ((err as Error).name !== 'AbortError') setFallback({ channel, url: URL.createObjectURL(file) });
        }
      } else {
        // Sin "compartir" nativo: descargar la imagen y publicarla a mano.
        setFallback({ channel, url: URL.createObjectURL(file) });
      }
    } catch {
      setError(tx.imgErr);
    } finally {
      setBusy('');
    }
  }

  async function redeem(d: Drink) {
    if (!secret || !window.confirm(tx.giveConfirm)) return;
    setGuest(await api.post<Guest>('/events/redeem', { secret, drinkId: d.id }));
  }

  const pending = guest?.drinks.filter((d) => !d.redeemedAt) ?? [];
  const full = (guest?.drinks.length ?? 0) >= (guest?.maxDrinks ?? 1);

  return (
    <div className="min-h-screen bg-primary text-white">
      <Seo title={`${tx.title} 🍹`} description={tx.place} />
      <div className="relative">
        <img src={BG} alt="" className="absolute inset-0 h-72 w-full object-cover opacity-50" />
        <div className="absolute inset-0 h-72 bg-gradient-to-b from-black/30 to-primary" />
        <div className="relative mx-auto max-w-md px-5 pb-6 pt-6 text-center">
          {/* Selector de idioma */}
          <div className="mb-5 flex justify-end">
            <div className="inline-flex rounded-full bg-black/40 p-1 text-xs font-bold backdrop-blur" role="group" aria-label="Idioma / Language">
              {(['es', 'en'] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`rounded-full px-3 py-1.5 ${lang === l ? 'bg-secondary text-primary' : 'text-white/80'}`}
                >
                  {l === 'es' ? '🇪🇨 Español' : '🇺🇸 English'}
                </button>
              ))}
            </div>
          </div>
          <img src="/images/logotipo-light.svg" alt="Grupo 3i" className="mx-auto h-7" />
          <h1 className="mt-6 font-serif text-4xl font-bold leading-tight">
            {tx.title} <span aria-hidden>🍹</span>
          </h1>
          <p className="mt-2 text-sm text-white/80">{tx.place}</p>
        </div>
      </div>

      <main className="mx-auto max-w-md px-5 pb-16">
        {loading ? (
          <Loader2 className="mx-auto mt-10 h-8 w-8 animate-spin text-secondary" />
        ) : event && !event.active ? (
          <p className="mt-6 rounded-2xl bg-white/10 p-5 text-center">{tx.over}</p>
        ) : !guest ? (
          <form onSubmit={join} className="space-y-4 rounded-2xl bg-white p-5 text-primary shadow-xl">
            <p className="text-sm text-brand-gray">{tx.intro}</p>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">{tx.name}</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-base"
                placeholder={tx.namePh}
              />
            </label>
            <PhoneField label={tx.phone} required onChange={setPhone} />
            <label className="flex items-start gap-2 text-xs text-brand-gray">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
              <span>{tx.consent}</span>
            </label>
            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            <button
              disabled={busy === 'join'}
              className="w-full rounded-full bg-secondary py-3.5 text-base font-bold text-primary shadow-lg disabled:opacity-60"
            >
              {busy === 'join' ? tx.wait : tx.cta}
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            {guest.drinks.map((d) => (
              <Voucher key={d.id} drink={d} lang={lang} onRedeem={() => redeem(d)} />
            ))}

            {!full && (
              <div className="rounded-2xl bg-white p-5 text-primary">
                <p className="font-semibold">{tx.ready(guest.firstName)}</p>
                <p className="mt-1 text-xs text-brand-gray">{tx.readyHint}</p>
                <div className="mt-4 space-y-2.5">
                  {CHANNELS.map((c) => (
                    <button
                      key={c}
                      onClick={() => share(c)}
                      disabled={!!busy}
                      className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left font-semibold text-white shadow disabled:opacity-60"
                      style={{ background: COLORS[c] }}
                    >
                      <span>
                        {tx.shareIn} {tx.channels[c]}
                      </span>
                      {busy === c ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>→</span>}
                    </button>
                  ))}
                </div>
                {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
              </div>
            )}

            {fallback && (
              <div className="rounded-2xl bg-white p-5 text-primary">
                <p className="font-semibold">{tx.manual}</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-brand-gray">
                  <li>{tx.step1}</li>
                  <li>{tx.step2(tx.where[fallback.channel])}</li>
                  <li>{tx.step3}</li>
                </ol>
                <img src={fallback.url} alt="" className="mx-auto mt-3 h-64 rounded-lg" />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <a
                    href={fallback.url}
                    download="montanita-view.jpg"
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-black/15 py-2.5 text-sm font-semibold"
                  >
                    <Download className="h-4 w-4" /> {tx.download}
                  </a>
                  <button onClick={() => earn(fallback.channel)} className="rounded-lg bg-secondary py-2.5 text-sm font-bold text-primary">
                    {tx.posted}
                  </button>
                </div>
              </div>
            )}

            {full && pending.length === 0 && <p className="rounded-2xl bg-white/10 p-4 text-center text-sm">{tx.done}</p>}

            <div className="rounded-2xl bg-white/10 p-5">
              <p className="text-sm font-semibold text-secondary">{tx.linkTitle}</p>
              <p className="mt-1 text-xs text-white/70">{tx.linkHint}</p>
              <div className="mt-3 flex items-center gap-2">
                <input readOnly value={guest.link} className="min-w-0 flex-1 rounded-lg bg-white/90 px-3 py-2 text-xs text-primary" />
                <button
                  onClick={async () => setCopied(await copyToClipboard(guest.link))}
                  className="rounded-lg bg-secondary p-2 text-primary"
                  aria-label="Copy"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        )}
        <p className="mt-8 text-center text-xs text-white/50">
          {tx.footer} · {IG}
        </p>
      </main>
    </div>
  );
}

/** Vale de la bebida: animado y con la hora en vivo para que no sirva una captura. */
function Voucher({ drink, lang, onRedeem }: { drink: Drink; lang: Lang; onRedeem: () => void }) {
  const tx = TX[lang];
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (drink.redeemedAt) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [drink.redeemedAt]);
  const label = useMemo(() => tx.channels[drink.channel], [tx, drink.channel]);
  const locale = lang === 'en' ? 'en-US' : 'es-EC';

  if (drink.redeemedAt)
    return (
      <div className="rounded-2xl bg-white/10 p-4 text-center text-sm text-white/60">
        {tx.given(new Date(drink.redeemedAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }))}
      </div>
    );

  return (
    <div className="fiesta-voucher relative overflow-hidden rounded-2xl p-5 text-center text-primary shadow-2xl">
      <p className="text-xs font-bold uppercase tracking-widest">
        {tx.voucherTag} · {label}
      </p>
      <p className="mt-1 font-serif text-3xl font-bold">{tx.voucherTitle}</p>
      <p className="mt-2 font-mono text-5xl font-bold tracking-widest">{drink.code}</p>
      <p className="mt-1 font-mono text-lg tabular-nums">{now.toLocaleTimeString(locale)}</p>
      <p className="mt-2 text-xs">{tx.voucherHint}</p>
      <button onClick={onRedeem} className="mt-4 w-full rounded-full bg-primary py-3 text-sm font-bold text-white">
        {tx.give}
      </button>
    </div>
  );
}

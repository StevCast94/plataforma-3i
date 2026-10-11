import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { BadgeCheck, Box, Map, MessageCircle, ShieldCheck } from 'lucide-react';
import { useProject } from '@/hooks/useProjects';
import { useLang, Link } from '@/hooks/useLang';
import { Seo } from '@/components/shared/Seo';
import { PhoneField } from '@/components/shared/PhoneField';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BrandLoader } from '@/components/brand/Isotipo';
import { api } from '@/lib/api';
import { cld } from '@/lib/cloudinary';
import { formatCurrency } from '@/lib/utils';
import { INSTALLMENTS, monthly } from '@/lib/lotFinance';
import { submitProjectLead, useTrackView } from '@/lib/projectTracking';

// Página de aterrizaje para anuncios (/l/:slug y /en/l/:slug): sin menú ni
// distracciones, el formulario arriba y lo justo para decidir dejar los datos.
// El contacto entra al CRM con su campaña (utm) y abre el WhatsApp de su asesor.

interface LotLite {
  status: string;
  kind?: string;
  price: number | null;
  areaM2: number | null;
}

function LeadForm({ slug, projectName, compact }: { slug: string; projectName: string; compact?: boolean }) {
  const { t, lang } = useLang();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [href, setHref] = useState<string | null>(null);
  const message =
    lang === 'en'
      ? `Hi, I saw ${projectName} and would like prices, the lot map and payment options.`
      : `Hola, vi ${projectName} y quiero recibir precios, el plano de solares y las formas de pago.`;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim() || phone.replace(/\D/g, '').length < 8) {
      setError(t('Escribe tu nombre y tu WhatsApp con código de país.'));
      return;
    }
    setBusy(true);
    try {
      const r = await submitProjectLead(slug, { name, phone, channel: 'whatsapp', message });
      const digits = (r.whatsapp ?? '').replace(/\D/g, '');
      const url = digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : null;
      setHref(url ?? '#');
      if (url) window.open(url, '_blank', 'noopener');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (href)
    return (
      <div className="space-y-4 text-center">
        <p className="font-serif text-2xl font-bold text-primary">{t('¡Gracias!')}</p>
        <p className="text-sm text-brand-gray">{t('Un asesor te escribe por WhatsApp con precios y el plano de solares.')}</p>
        {href !== '#' && (
          <a href={href} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 font-semibold text-white">
            <MessageCircle className="h-5 w-5" /> {t('Abrir WhatsApp')}
          </a>
        )}
        <Link to={`/proyectos/${slug}#mapa-solares`} className="block text-sm text-secondary hover:underline">
          {t('Mientras tanto, mira el mapa de solares')} →
        </Link>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-3">
      {!compact && (
        <>
          <p className="font-serif text-2xl font-bold text-primary">{t('Recibe precios y el plano')}</p>
          <p className="text-sm text-brand-gray">{t('Déjanos tus datos y un asesor te escribe por WhatsApp. Sin compromiso.')}</p>
        </>
      )}
      <Input label={t('Nombre')} value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
      <PhoneField label="WhatsApp" required defaultValue={lang === 'en' ? '+1 ' : '+593 '} onChange={setPhone} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="lg" disabled={busy} className="w-full">
        {busy ? t('Enviando…') : t('Quiero recibir información')}
      </Button>
      <p className="text-center text-[11px] text-brand-gray">{t('Tus datos solo los usa el asesor del proyecto.')}</p>
    </form>
  );
}

export default function CampaignLandingPage() {
  const { slug } = useParams();
  const { t, pt, lang } = useLang();
  const { data: project, loading } = useProject(slug);
  const [lots, setLots] = useState<LotLite[]>([]);
  const [panos, setPanos] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);
  useTrackView(project?.slug, 'view');

  useEffect(() => {
    if (!slug) return;
    api.get<LotLite[]>(`/projects/${slug}/lots`).then(setLots).catch(() => {});
    api.get<unknown[]>(`/projects/${slug}/panoramas`).then((p) => setPanos(p.length)).catch(() => {});
  }, [slug]);

  const facts = useMemo(() => {
    const avail = lots.filter((l) => l.status === 'AVAILABLE' && (l.kind ?? 'LOT') === 'LOT');
    const prices = avail.map((l) => l.price).filter((p): p is number => p != null);
    const areas = avail.map((l) => l.areaM2).filter((a): a is number => a != null);
    return {
      available: avail.length,
      minPrice: prices.length ? Math.min(...prices) : null,
      minArea: areas.length ? Math.min(...areas) : null,
    };
  }, [lots]);

  if (loading) return <BrandLoader className="min-h-screen" />;
  if (!project)
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <Link to="/proyectos" className="text-secondary hover:underline">{t('Ver todos los proyectos')}</Link>
      </div>
    );

  const priceFrom = facts.minPrice ?? project.priceFrom ?? null;
  const images = [project.coverImage, ...(project.images ?? [])].filter((x): x is string => !!x);
  const cover = images[0];
  // Mosaico sin huecos: 1 grande + 2 (3 fotos) o 1 grande + 5 (6 fotos).
  const rest = images.slice(1);
  const gallery = rest.slice(0, rest.length >= 6 ? 6 : rest.length >= 3 ? 3 : rest.length);
  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const benefits = [
    { icon: Map, title: t('Elige tu solar en el mapa'), body: t('Precio, medidas y disponibilidad en vivo de cada solar.') },
    ...(panos ? [{ icon: Box, title: t('Recórrelo en 360°'), body: t('Mira el terreno y la vista desde tu celular, sin viajar.') }] : []),
    project.verified
      ? { icon: ShieldCheck, title: t('Verificado por Grupo 3i'), body: t('Revisamos escritura, gravámenes y aprobación municipal.') }
      : { icon: BadgeCheck, title: t('Asesoría personal'), body: t('Un asesor te acompaña desde la primera consulta hasta la firma.') },
  ];

  return (
    <div className="min-h-screen bg-white pb-20 text-primary md:pb-0">
      <Seo title={`${project.name} · ${t('Recibe precios')}`} description={pt(project, 'subtitle') || project.name} image={cover} noindex />

      {/* Encabezado mínimo: solo marca e idioma */}
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-4 sm:px-8">
        <img src="/images/logotipo-light.svg" alt="Grupo 3i" className="h-7 w-auto" />
        <Link to={`/proyectos/${project.slug}`} className="text-xs text-white/80 hover:text-white">{t('Ver ficha completa')} →</Link>
      </header>

      {/* Hero + formulario */}
      <section className="relative overflow-hidden bg-primary text-white">
        {cover && <img src={cld(cover, { width: 1600 })} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />}
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary/30" />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 pb-12 pt-24 sm:px-8 lg:grid-cols-[1fr_24rem] lg:items-center lg:pb-20 lg:pt-28">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-secondary">{project.location}</p>
            {project.verified && (
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                ✓ {t('Verificado por Grupo 3i')}
              </span>
            )}
            <h1 className="mt-3 font-serif text-4xl font-bold leading-tight sm:text-6xl">{project.name}</h1>
            {project.subtitle && <p className="mt-3 max-w-xl text-lg text-white/85">{pt(project, 'subtitle')}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              {priceFrom != null && (
                <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
                  <p className="text-[11px] uppercase tracking-wider text-white/60">{t('Desde')}</p>
                  <p className="font-serif text-2xl font-bold text-secondary">{formatCurrency(priceFrom)}</p>
                </div>
              )}
              {priceFrom != null && (
                <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
                  <p className="text-[11px] uppercase tracking-wider text-white/60">{t('{n} cuotas de', { n: INSTALLMENTS })}</p>
                  <p className="font-serif text-2xl font-bold">{formatCurrency(monthly(priceFrom))}</p>
                </div>
              )}
              {facts.available > 0 && (
                <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
                  <p className="text-[11px] uppercase tracking-wider text-white/60">{t('Solares disponibles')}</p>
                  <p className="font-serif text-2xl font-bold">{facts.available}</p>
                </div>
              )}
              {facts.minArea != null && (
                <div className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
                  <p className="text-[11px] uppercase tracking-wider text-white/60">{t('Desde (área)')}</p>
                  <p className="font-serif text-2xl font-bold">{Math.round(facts.minArea).toLocaleString('en-US')} m²</p>
                </div>
              )}
            </div>
          </div>
          <div ref={formRef} id="formulario" className="rounded-2xl bg-white p-6 text-primary shadow-2xl">
            <LeadForm slug={project.slug} projectName={project.name} />
          </div>
        </div>
      </section>

      {/* Por qué */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-8">
        <div className={`grid gap-6 ${benefits.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
          {benefits.map((b) => (
            <div key={b.title} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-accent">
                <b.icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div>
                <p className="font-semibold">{b.title}</p>
                <p className="mt-1 text-sm text-brand-gray">{b.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Galería */}
      {gallery.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {gallery.map((src, i) => (
              <img
                key={src}
                src={cld(src, { width: 800 })}
                alt={`${project.name} ${i + 1}`}
                loading="lazy"
                className={`h-full w-full rounded-xl object-cover ${i === 0 ? 'col-span-2 row-span-2 aspect-square sm:aspect-auto' : 'aspect-[4/3]'}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Cierre */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-8">
        <h2 className="font-serif text-3xl font-bold">{t('¿Te interesa un solar en {p}?', { p: project.name })}</h2>
        <p className="mt-3 text-brand-gray">{t('Te enviamos precios, el plano con los solares disponibles y las formas de pago.')}</p>
        <Button size="lg" className="mt-6" onClick={scrollToForm}>{t('Quiero recibir información')}</Button>
      </section>

      <footer className="border-t border-black/5 px-4 py-6 text-center text-xs text-brand-gray">
        <img src="/images/isotipo.svg" alt="" className="mx-auto mb-2 h-6 w-6" />
        Grupo 3i · {lang === 'en' ? 'Ecuadorian coast' : 'Costa ecuatoriana'} ·{' '}
        <Link to={`/proyectos/${project.slug}`} className="hover:underline">{t('Ver ficha completa')}</Link>
      </footer>

      {/* Botón fijo en el celular */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-black/10 bg-white p-3 md:hidden">
        <Button className="w-full" onClick={scrollToForm}>{t('Quiero recibir información')}</Button>
      </div>
    </div>
  );
}

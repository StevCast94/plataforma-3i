import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { Navigate } from 'react-router-dom';
import { Link, useLang } from '@/hooks/useLang';
import { LangSwitch } from '@/components/shared/LangSwitch';
import { motion } from 'framer-motion';
import { Seo } from '@/components/shared/Seo';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ClipboardPen, Link2, HandCoins, FileText, type LucideIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { BrandLoader } from '@/components/brand/Isotipo';

const steps: { icon: LucideIcon; title: string; body: string; image: string }[] = [
  {
    icon: ClipboardPen,
    title: 'Regístrate gratis',
    body: 'Crea tu cuenta con tu cédula en minutos. No inviertes nada.',
    image: '/images/secciones/paso-registro.jpg',
  },
  {
    icon: Link2,
    title: 'Comparte tu enlace',
    body: 'Recibe tu enlace personal y compártelo con quien busca invertir en la costa.',
    image: '/images/secciones/paso-comparte.jpg',
  },
  {
    icon: HandCoins,
    title: 'Gana comisiones',
    body: 'Cobras por cada lote, fracción o membresía que se venda con tu enlace.',
    image: '/images/secciones/paso-gana.jpg',
  },
];

const compare = [
  { feature: 'Venta inmobiliaria de tu referido directo', premiere: '2%', elite: '4%' },
  { feature: 'Venta inmobiliaria de un referido de tu referido', premiere: '1%', elite: '2%' },
  { feature: 'Retiro mínimo (transferencia)', premiere: '$100', elite: '$50' },
  { feature: 'Liquidación', premiere: '30 días', elite: '3 días' },
];

const faqs = [
  { q: '¿Cuánto cuesta entrar?', a: 'Nada. El registro es gratuito; solo verificamos tu identidad con tu cédula para poder pagarte.' },
  { q: '¿Qué puedo recomendar?', a: 'Los lotes de Montañita View, las fracciones de Ibiza Condohotel y los demás proyectos publicados en Grupo 3i. Tu enlace registra a quien llega por ti, aunque compre semanas después.' },
  { q: '¿Cómo llego a Elite?', a: 'Comprando cualquier producto inmobiliario, o cuando 5 de tus referidos compren en 180 días. Y durante la promoción de lanzamiento, con tu primer referido.' },
  { q: '¿Cuándo cobro mis comisiones?', a: 'Después de los 14 días de retracto, más el plazo de liquidación de tu nivel: 30 días en Premiere y 3 días en Elite.' },
  { q: '¿Pierdo mi cuenta si no refiero?', a: 'En Premiere, la cuenta se suspende tras 180 días sin referidos nuevos, con avisos previos. Elite es permanente, salvo el Elite de regalo de la promoción de lanzamiento, que se mantiene con al menos una venta en la temporada.' },
];

/**
 * Una venta de cada cosa, con las tasas del motor de comisiones
 * (backend/src/lib/referralRules.ts): 2% / 4% inmobiliario, $50 / $100 membresía.
 */
function examples(mv: number, ibiza: number) {
  return [
    { what: 'Un lote en Montañita View', price: { k: 'desde {p}', p: mv }, premiere: mv * 0.02, elite: mv * 0.04 },
    { what: 'Una fracción en Ibiza Condohotel', price: { k: 'desde {p}', p: ibiza }, premiere: ibiza * 0.02, elite: ibiza * 0.04 },
  ];
}

export default function OfficeLanding() {
  const { t } = useLang();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  // Precios desde el inventario en vivo (los mismos de las fichas); respaldo si la API tarda.
  const { data: projects } = useProjects();
  const from = (slug: string, fallback: number) => projects?.find((p) => p.slug === slug)?.priceFrom ?? fallback;
  const EXAMPLES = examples(from('montanita-view', 41721), from('ibiza-condohotel', 12000));

  // Esta es una página de VENTA del programa (pública, sin sidebar). Si ya hay
  // sesión, no tiene sentido mostrarle "Regístrate gratis" a alguien que ya es
  // socio — se lo manda directo a su panel real.
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <BrandLoader className="min-h-screen" label={t('Cargando…')} />;
  if (isAuthenticated) return <Navigate to="/oficina/dashboard" replace />;

  return (
    <>
      <Seo
        title={t('Refiere y gana — Programa de referidos')}
        description={t('Recomienda un lote en Montañita View o una fracción en Ibiza Condohotel y gana hasta el 4% de la venta.')}
      />

      {/* Barra superior: la única página de Oficina sin Navbar del sitio público. */}
      <header className="flex items-center justify-between border-b border-black/5 bg-white px-4 py-3 sm:px-6">
        <Link to="/" className="inline-flex items-center">
          <img src="/images/logo-completo.svg" alt={t('Grupo 3i — Volver al inicio')} className="h-8 w-auto" />
        </Link>
        <LangSwitch />
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-primary text-white">
        <img
          src="/images/secciones/hero-referidos.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 -z-10 bg-primary/70" />
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center sm:px-6">
          <Badge variant="solid" className="mb-5">{t('Programa de referidos')}</Badge>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold sm:text-6xl"
          >
            {t('Refiere y gana')}
          </motion.h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80">
            {t('Recomienda un lote en Montañita View o una fracción en Ibiza Condohotel y gana hasta el 4% de la venta. Registro gratis, sin inversión propia.')}
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link to="/oficina/registro">
              <Button size="lg">{t('Registrarme gratis')}</Button>
            </Link>
            <Link to="/oficina/login">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white hover:text-primary">
                {t('Ya soy miembro')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="mb-12 text-center text-3xl font-bold text-primary sm:text-4xl">{t('Cómo funciona')}</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="overflow-hidden rounded-2xl bg-white text-center shadow-sm ring-1 ring-black/5">
              <img src={s.image} alt="" className="h-36 w-full object-cover" />
              <div className="p-8">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-light text-accent ring-1 ring-secondary/30">
                  <s.icon className="h-6 w-6" strokeWidth={1.6} />
                </span>
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-secondary">{t('Paso')} {i + 1}</p>
                <h3 className="mt-1 text-xl text-primary">{t(s.title)}</h3>
                <p className="mt-2 text-sm text-brand-gray">{t(s.body)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparativa */}
      <section className="bg-light">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
          <h2 className="mb-10 text-center text-3xl font-bold text-primary sm:text-4xl">{t('Elige tu nivel')}</h2>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="px-4 py-4 text-sm">{t('Beneficio')}</th>
                  <th className="px-4 py-4 text-center text-sm">{t('Premiere')}</th>
                  <th className="px-4 py-4 text-center text-sm text-secondary">{t('Elite')}</th>
                </tr>
              </thead>
              <tbody>
                {compare.map((row) => (
                  <tr key={row.feature} className="border-b border-black/5">
                    <td className="px-4 py-3 text-sm text-primary">{t(row.feature)}</td>
                    <td className="px-4 py-3 text-center text-sm text-brand-gray">{t(row.premiere)}</td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-accent">{t(row.elite)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link
            to="/reglamento"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <FileText className="h-4 w-4" strokeWidth={1.8} />
            {t('Ver el reglamento completo del programa')}
          </Link>
        </div>
      </section>

      {/* Cuánto se gana: casos reales, con los precios de hoy */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <h2 className="mb-3 text-center text-3xl font-bold text-primary">{t('¿Cuánto podrías ganar?')}</h2>
        <p className="mb-10 text-center text-brand-gray">{t('Por una sola venta hecha con tu enlace:')}</p>
        <div className="grid gap-5 sm:grid-cols-3">
          {EXAMPLES.map((e) => (
            <div key={e.what} className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
              <p className="text-sm font-medium text-primary">{t(e.what)}</p>
              <p className="text-xs text-brand-gray">{t(e.price.k, { p: formatCurrency(e.price.p) })}</p>
              <p className="mt-4 text-xs uppercase tracking-wider text-brand-gray">{t('Premiere')}</p>
              <p className="font-serif text-2xl font-bold text-primary">{formatCurrency(e.premiere)}</p>
              <p className="mt-2 text-xs uppercase tracking-wider text-brand-gray">{t('Elite')}</p>
              <p className="font-serif text-2xl font-bold text-accent">{formatCurrency(e.elite)}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-brand-gray">
          {t('Comisión sobre el precio de venta, que cobras después de la liquidación. El precio depende del lote o la fracción que elija tu referido.')}
        </p>
      </section>

      {/* Libertad financiera */}
      <section className="relative overflow-hidden bg-primary text-white">
        <img
          src="/images/secciones/libertad-financiera.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/70" />
        <div className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <h2 className="text-3xl font-bold sm:text-4xl">{t('Libertad financiera, no solo un ingreso extra')}</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">
            {t('Tus comisiones se acumulan con cada referido, sin importar dónde estés. Empieza hoy y deja que tu red trabaje para ti.')}
          </p>
          <Link to="/oficina/registro" className="mt-8 inline-block">
            <Button size="lg">{t('Registrarme gratis')}</Button>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-light">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h2 className="mb-10 text-center text-3xl font-bold text-primary">{t('Preguntas frecuentes')}</h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-medium text-primary">{t(f.q)}</span>
                  <span className="text-accent">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && <p className="px-5 pb-4 text-sm text-brand-gray">{t(f.a)}</p>}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/oficina/registro">
              <Button size="lg">{t('Empieza gratis ahora')}</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

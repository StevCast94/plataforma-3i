import { useEffect, useMemo, useState } from 'react';
import { Seo } from '@/components/shared/Seo';
import { Link, useLang } from '@/hooks/useLang';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ProjectCard } from '@/components/shared/ProjectCard';
import { CTASection } from '@/components/shared/CTASection';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useProjects } from '@/hooks/useProjects';
import { cld } from '@/lib/cloudinary';
import { ImageCrossfade } from '@/components/shared/ImageCrossfade';

// Las cuatro puertas de Grupo 3i (docs/GUIA-DE-LENGUAJE.md, sección 2).
const DOORS = [
  { to: '/proyectos', img: '/images/ibiza/portada.jpg', kicker: 'Sé parte', title: 'Tu lugar en la costa', body: 'Fracciones en Ibiza Condohotel, lotes con vista al mar en Montañita View y proyectos verificados.', cta: 'Ver proyectos' },
  { to: '/bosque', img: 'https://res.cloudinary.com/db3t73yas/image/upload/c_fill,w_800,h_1000/v1787623457/grupo3i/szzat1etcxe280jdtabj.jpg', kicker: 'Cuida la naturaleza', title: 'Montaña Viva', body: 'Un bosque protegido en Santa Elena donde podrás adoptar un árbol. Aquí no se tala.', cta: 'Disponible próximamente' },
  { to: '/servicios', img: '/images/secciones/pilar-proyectos.jpg', kicker: 'Construye', title: 'Tu casa, lista y sostenible', body: 'Paisajismo y casas modulares con domótica y energía solar, además de topografía, planos y trámites.', cta: 'Conoce los servicios' },
  { to: '/oficina', img: '/images/secciones/comunidad-3i.jpg', kicker: 'Gana refiriendo', title: 'Compartir también es ganar', body: 'Recomienda cualquiera de nuestros proyectos con tu enlace y cobra una comisión por cada venta.', cta: 'Únete gratis' },
];

export default function HomePage() {
  const { t } = useLang();
  const { data: content } = useSiteContent();
  const { data: projects, loading: loadingProjects } = useProjects();

  const hero = content?.hero ?? {};
  const projectsSection = content?.projects ?? {};

  // La imagen local va SIEMPRE primero (se ve al instante, sin esperar la API
  // de contenido). Las del CMS (una por línea o separadas por coma en el campo
  // hero.image_url del admin) se suman a la rotación cuando llegan, en vez de
  // reemplazar de golpe lo que ya se está mostrando — así se elimina el salto
  // brusco entre la imagen por defecto y la editada desde Configuración.
  const heroImages = useMemo(() => {
    const local = '/images/secciones/hero-home.jpg';
    const cmsUrls = (hero.image_url ?? '')
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter(Boolean)
      // Alto fijo además del ancho: sin esto, una foto vertical subida desde
      // el celular (más alta que ancha) se transforma solo por ancho y sale
      // gigante en altura — mucho más peso del que el hero necesita.
      .map((u) => cld(u, { width: 1600, height: 900, crop: 'fill' }));
    return Array.from(new Set([local, ...cmsUrls]));
  }, [hero.image_url]);

  // El texto del hero rota por su cuenta (independiente de las fotos): primero
  // el eslogan de la marca, luego el mensaje del CMS y el de Montañita View.
  // Lenguaje: docs/GUIA-DE-LENGUAJE.md (Ibiza nunca como «inversión»).
  const slides = useMemo(
    () => [
      {
        title: 'Tener una parte es tenerlo todo',
        subtitle:
          'Una fracción junto al mar, un lote con vista al Pacífico o un árbol en un bosque protegido: ponemos el patrimonio inmobiliario al alcance de todos.',
      },
      {
        title: hero.title ?? 'Cuatro semanas al año junto al mar. Para siempre.',
        subtitle:
          hero.subtitle ??
          'Fracciones en Ibiza Condohotel, lotes con vista al mar y proyectos verificados en la costa ecuatoriana.',
      },
      {
        title: 'Montañita View. Lotes con vista al mar, financiados a 24 meses sin intereses',
        subtitle:
          'Lotes frente al Pacífico en Montañita, Santa Elena, y Montañita View Lobby, con piscina, restaurante y áreas sociales.',
      },
    ],
    [hero.title, hero.subtitle],
  );
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSlide((i) => (i + 1) % slides.length), 9000);
    return () => clearInterval(id);
  }, [slides.length]);
  const cur = slides[slide];

  return (
    <>
      <Seo title={t('Grupo 3i — Tener una parte es tenerlo todo')} description={t('Fracciones en Ibiza Condohotel desde $12,000, lotes con vista al mar en Montañita View con 24 cuotas sin intereses y adopción de árboles en Montaña Viva.')} />
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-primary text-white">
        <ImageCrossfade
          images={heroImages}
          activeOpacity={0.4}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="mx-auto max-w-7xl px-4 py-28 sm:px-6 lg:px-8 lg:py-40">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="min-h-[15rem] sm:min-h-[19rem]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={slide}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.5 }}
                >
                  <h1 className="text-4xl font-bold leading-tight sm:text-6xl">{t(cur.title)}</h1>
                  <p className="mt-6 text-lg text-white/80">{t(cur.subtitle)}</p>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link to="/proyectos">
                <Button size="lg">{t(hero.cta_text ?? 'Explorar proyectos')}</Button>
              </Link>
              <Link to="/oficina">
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white hover:text-primary">
                  {t('Refiere y gana')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* LAS CUATRO PUERTAS */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">{t('Inversiones Inmobiliarias Inteligentes')}</p>
          <h2 className="mt-2 text-3xl font-bold text-primary sm:text-4xl">{t('¿Cómo quieres ser parte?')}</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {DOORS.map((d) => (
            <Link key={d.to} to={d.to} className="group relative isolate flex min-h-[20rem] flex-col justify-end overflow-hidden rounded-3xl p-6 text-white shadow-lg transition hover:shadow-xl">
              <img src={d.img} alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-primary via-primary/60 to-transparent" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">{t(d.kicker)}</p>
              <h3 className="mt-1 font-serif text-2xl font-bold">{t(d.title)}</h3>
              <p className="mt-2 text-sm text-white/80">{t(d.body)}</p>
              <p className="mt-4 text-sm font-semibold text-secondary group-hover:underline">{t(d.cta)} →</p>
            </Link>
          ))}
        </div>
      </section>

      {/* PROYECTOS */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-primary sm:text-4xl">
            {t(projectsSection.title ?? 'Nuestros Proyectos')}
          </h2>
          {projectsSection.subtitle && (
            <p className="mx-auto mt-3 max-w-2xl text-brand-gray">
              {t(projectsSection.subtitle)}
            </p>
          )}
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {loadingProjects
            ? Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} />)
            : (projects ?? []).map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>

        <div className="mt-10 text-center">
          <Link to="/proyectos">
            <Button variant="outline">{t('Ver todos los proyectos')}</Button>
          </Link>
        </div>

        {/* Propuesta de inversión Montañita View */}
        <Link
          to="/propuesta/montanita-view"
          className="group mt-12 flex flex-col gap-4 rounded-3xl bg-primary p-8 text-white shadow-lg transition hover:shadow-xl sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-secondary">
              {t('Oportunidad de inversión')}
            </p>
            <h3 className="mt-2 font-serif text-2xl font-bold sm:text-3xl">{t('Propuesta Montañita View')}</h3>
            <p className="mt-2 max-w-2xl text-white/75">
              {t(
                'La lotización completa, el Lobby completo o ambos proyectos en una sola operación. Revisa las cifras, el dossier técnico y las condiciones de pago.',
              )}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-secondary px-6 py-3 text-center font-semibold text-primary transition group-hover:brightness-110">
            {t('Ver la propuesta')} →
          </span>
        </Link>
      </section>

      {/* REFIERE Y GANA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <img
            src="/images/secciones/comunidad-3i.jpg"
            alt={t('Programa de referidos Grupo 3i')}
            className="aspect-[4/3] w-full rounded-2xl object-cover shadow-lg md:order-2"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              {t('Refiere y gana')}
            </p>
            <h2 className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
              {t('Recomienda y gana hasta el 4 % por cada venta')}
            </h2>
            <p className="mt-4 text-brand-gray">
              {t(
                'Si conoces a alguien que busca un lote en la costa, una fracción junto al mar o un proyecto de la vitrina, compártele tu enlace. Cuando compra, cobras tu comisión. El registro es gratis y no necesitas comprar nada.',
              )}
            </p>
            <Link to="/oficina" className="mt-8 inline-block">
              <Button size="lg" variant="outline">{t('Conoce el programa')}</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* DESARROLLADORAS: vitrina, propuesta y manual */}
      <section className="bg-primary text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-secondary">{t('Para desarrolladoras inmobiliarias')}</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{t('Vende tus proyectos inmobiliarios con la red de Grupo 3i. Ganamos cuando tú vendes.')}</h2>
            <p className="mt-4 text-white/70">
              {t('Lotes, terrenos, casas, departamentos, suites, locales y oficinas: inventario en vivo, recorridos 360°, un CRM para tus asesores con avisos al celular, verificación legal y una red de referidores que recomienda tu proyecto.')}
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { to: '/publica-tu-proyecto', title: t('Publica tu proyecto'), body: t('Beneficios, servicios y solicitud de alta.') },
              { to: '/publica-tu-proyecto/propuesta', title: t('Propuesta comercial'), body: t('Comisión por venta y servicios a convenir. Te lo explicamos.') },
              { to: '/publica-tu-proyecto/manual', title: t('Manual de herramientas'), body: t('Todo lo que puedes hacer en la plataforma, paso a paso.') },
              { to: '/publica-tu-proyecto/galeria', title: t('Galería del sistema'), body: t('Capturas reales de cada pantalla del portal.') },
            ].map((c) => (
              <Link key={c.to} to={c.to} className="group rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 transition hover:bg-white/10">
                <p className="font-serif text-xl font-bold">{c.title}</p>
                <p className="mt-2 text-sm text-white/70">{c.body}</p>
                <p className="mt-4 text-sm font-semibold text-secondary group-hover:underline">{t('Ver más')} →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICIOS INTEGRALES (el Club de Viajes queda para desarrollo futuro) */}
      <CTASection
        title={t('Servicios integrales para tu proyecto')}
        subtitle={t('Topografía, planos, trámites, marketing y desarrollo de proyectos, con el seguimiento de cada trámite en línea.')}
        ctaText={t('Ver los servicios')}
        ctaTo="/servicios"
      />
    </>
  );
}

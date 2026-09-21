import { useMemo } from 'react';
import { Link, useLang } from '@/hooks/useLang';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ProjectCard } from '@/components/shared/ProjectCard';
import { ProductCard } from '@/components/shared/ProductCard';
import { CTASection } from '@/components/shared/CTASection';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useProjects } from '@/hooks/useProjects';
import { useProducts } from '@/hooks/useProducts';
import { cld } from '@/lib/cloudinary';
import { ImageCrossfade } from '@/components/shared/ImageCrossfade';

export default function HomePage() {
  const { t } = useLang();
  const { data: content } = useSiteContent();
  const { data: projects, loading: loadingProjects } = useProjects();
  const { data: products, loading: loadingProducts } = useProducts();

  const hero = content?.hero ?? {};
  const projectsSection = content?.projects ?? {};
  const club = content?.club ?? {};

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

  return (
    <>
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
            <h1 className="text-4xl font-bold leading-tight sm:text-6xl">
              {t(hero.title ?? 'Invierte en el futuro. Vive el presente.')}
            </h1>
            <p className="mt-6 text-lg text-white/80">
              {t(
                hero.subtitle ??
                  'Propiedades fraccionadas, membresías de viaje y experiencias premium en la costa ecuatoriana.',
              )}
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link to="/proyectos">
                <Button size="lg">{t(hero.cta_text ?? 'Explorar proyectos')}</Button>
              </Link>
              <Link to="/club">
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white hover:text-primary">
                  {t('Conoce el Club 3i')}
                </Button>
              </Link>
            </div>
          </motion.div>
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
                'Un solar desde $49,084, sociedad en Montañita View Lobby o la compra total de ambos proyectos. Revisa las cifras, el dossier técnico y las condiciones de pago.',
              )}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-secondary px-6 py-3 text-center font-semibold text-primary transition group-hover:brightness-110">
            {t('Ver la propuesta')} →
          </span>
        </Link>
      </section>

      {/* MEMBRESÍA / PRODUCTOS */}
      <section className="bg-light">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-primary sm:text-4xl">
              {t('Membresías y Oportunidades')}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-brand-gray">
              {t('Accede a beneficios de viaje y a inversiones fraccionadas.')}
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {loadingProducts
              ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
              : (products ?? []).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* COMUNIDAD */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <img
            src="/images/secciones/comunidad-3i.jpg"
            alt={t('Comunidad Grupo 3i')}
            className="aspect-[4/3] w-full rounded-2xl object-cover shadow-lg md:order-2"
          />
          <div>
            <h2 className="text-3xl font-bold text-primary sm:text-4xl">{t('Una comunidad, no solo una inversión')}</h2>
            <p className="mt-4 text-brand-gray">
              {t(
                'Socios, referidos y clientes se conectan en un mismo espacio: comparten experiencias de viaje, oportunidades y consejos de inversión. Únete y forma parte de algo más grande que una propiedad.',
              )}
            </p>
            <Link to="/comunidad" className="mt-8 inline-block">
              <Button size="lg" variant="outline">{t('Conoce la comunidad')}</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CLUB 3i */}
      <CTASection
        title={t(club.title ?? 'Únete al Club 3i')}
        subtitle={
          t(
            club.subtitle ??
              'Viaja por el mundo con descuentos de hasta 70% y accede a beneficios exclusivos.',
          )
        }
        ctaText={t('Quiero ser miembro')}
        ctaTo="/club"
      />
    </>
  );
}

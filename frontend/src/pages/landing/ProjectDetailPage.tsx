import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, ArrowRight, ChevronDown } from 'lucide-react';
import { useProject, useProjects } from '@/hooks/useProjects';
import { Seo } from '@/components/shared/Seo';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { AmenityIcon } from '@/lib/amenityIcons';
import { projectBrand } from '@/lib/projectBrand';
import { ImageGallery } from '@/components/shared/ImageGallery';
import { ProjectCard } from '@/components/shared/ProjectCard';
import { ContactForm } from '@/components/shared/ContactForm';
import { BrochureDigital } from '@/components/shared/BrochureDigital';
import { WhatsAppCTA } from '@/components/shared/WhatsAppCTA';
import { useLang } from '@/hooks/useLang';
import { LotMap } from '@/components/shared/LotMap';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { DetailSkeleton } from '@/components/shared/LoadingSkeleton';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cld } from '@/lib/cloudinary';
import { formatCurrency } from '@/lib/utils';

export default function ProjectDetailPage() {
  const { t, tb } = useLang();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: project, loading, error } = useProject(slug);
  const { data: allProjects } = useProjects();
  const [open, setOpen] = useState(false);

  if (loading) return <DetailSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => location.reload()} />;
  if (!project)
    return (
      <EmptyState
        title={t('Proyecto no encontrado')}
        message={t('Es posible que ya no esté disponible.')}
        ctaText={t('Ver todos los proyectos')}
        ctaTo="/proyectos"
        icon={<Building2 className="h-10 w-10" strokeWidth={1.4} />}
      />
    );

  const gallery =
    project.images?.length
      ? project.images
      : project.coverImage
        ? [project.coverImage]
        : [];

  const related = (allProjects ?? [])
    .filter((p) => p.id !== project.id && p.featured)
    .slice(0, 2);

  // Metadatos del hero: hasta 2 datos duros junto al precio, para dar sustancia
  // sin recargar. Salen de las características ya cargadas del proyecto.
  const brand = projectBrand(project.slug);
  const amenities = project.features?.amenities ?? [];

  const heroMeta: { label: string; value: string }[] = [];
  if (project.features?.tipo) heroMeta.push({ label: t('Tipo'), value: t(String(project.features.tipo)) });
  if (project.features?.unidades != null)
    heroMeta.push({ label: t('Unidades'), value: String(project.features.unidades) });

  // Producto de tienda vinculado a este proyecto (ej. la fracción de Ibiza) — si existe,
  // "Quiero invertir" lleva directo a solicitar la compra en vez de abrir el formulario genérico.
  const investProduct = project.products?.[0];
  const goInvest = () => {
    // Si hay mapa de solares, el precio real está ahí (por solar), no en un producto genérico.
    const map = document.getElementById('mapa-solares');
    if (map) map.scrollIntoView({ behavior: 'smooth' });
    else if (investProduct) navigate(`/tienda/${investProduct.slug}`);
    else setOpen(true);
  };

  return (
    <>
      <Seo
        title={project.name}
        description={tb(project.subtitle ?? project.description)}
        image={project.coverImage}
      />

      {/* 1. HERO FULL-SCREEN — editorial, cinematográfico */}
      <section className="relative isolate flex min-h-[92vh] items-end overflow-hidden text-white">
        {/* Imagen con zoom lento (Ken Burns) para dar movimiento sin distraer */}
        {project.coverImage && (
          <motion.img
            src={cld(project.coverImage, { width: 1920 })}
            alt={project.name}
            initial={{ scale: 1.12 }}
            animate={{ scale: 1 }}
            transition={{ duration: 12, ease: 'easeOut' }}
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
        )}
        {/* Scrim direccional: oscurece SOLO el lado del texto y deja respirar la foto */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/90 via-black/55 to-black/10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-transparent to-black/50" />

        <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: t('Inicio'), to: '/' },
              { label: t('Proyectos'), to: '/proyectos' },
              { label: project.name },
            ]}
          />

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-10 max-w-3xl border-l-2 border-secondary pl-6 sm:pl-8"
          >
            {/* Eyebrow: filete dorado + ubicación */}
            {project.location && (
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-secondary" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-secondary sm:text-xs">
                  {t(project.location)}
                </p>
              </div>
            )}

            {brand ? (
              <h1 className="mt-5">
                <img
                  src={brand.light}
                  alt={project.name}
                  className="h-24 w-auto drop-shadow-[0_2px_20px_rgba(0,0,0,0.6)] sm:h-32 lg:h-40"
                />
              </h1>
            ) : (
              <h1 className="mt-4 font-serif text-5xl font-bold leading-[0.95] tracking-tight drop-shadow-[0_2px_20px_rgba(0,0,0,0.6)] sm:text-7xl lg:text-8xl">
                {project.name}
              </h1>
            )}

            {project.subtitle && (
              <p className="mt-5 max-w-xl text-base font-light leading-relaxed text-white/85 sm:text-xl">
                {t(project.subtitle)}
              </p>
            )}

            {/* Precio editorial + metadatos, separados por filetes verticales */}
            <div className="mt-8 flex flex-wrap items-end gap-x-8 gap-y-4">
              {(project.priceFrom != null || project.priceLabel) && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/50">
                    {t('Inversión desde')}
                  </p>
                  <p className="mt-1 font-serif text-3xl font-bold text-secondary sm:text-4xl">
                    {project.priceFrom != null
                      ? formatCurrency(project.priceFrom)
                      : t(project.priceLabel ?? '')}
                  </p>
                </div>
              )}

              {heroMeta.map((m) => (
                <div key={m.label} className="border-l border-white/20 pl-8">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/50">
                    {m.label}
                  </p>
                  <p className="mt-1 font-serif text-2xl font-bold text-white sm:text-3xl">
                    {m.value}
                  </p>
                </div>
              ))}
            </div>

            {/* CTAs de esquinas rectas — más arquitectónicos que las píldoras */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button
                size="lg"
                shape="sharp"
                onClick={goInvest}
                className="group px-9 text-xs font-semibold uppercase tracking-[0.2em] shadow-[0_8px_30px_rgba(201,169,110,0.35)] hover:shadow-[0_10px_40px_rgba(201,169,110,0.5)] sm:text-sm"
              >
                {t('Quiero invertir')}
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                  strokeWidth={2}
                />
              </Button>
              <button
                onClick={() => setOpen(true)}
                className="cursor-pointer border border-white/40 px-9 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-sm transition-colors duration-200 hover:border-white hover:bg-white hover:text-primary sm:text-sm"
              >
                {t('Solicitar información')}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Indicador de scroll */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/50">{t('Descubre')}</span>
          <motion.span
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="h-5 w-5 text-secondary" strokeWidth={1.5} />
          </motion.span>
        </motion.div>
      </section>

      {/* 2. LO PRINCIPAL, JUSTO DESPUÉS DEL HERO: el mapa de solares (si hay lotes)
          y el brochure digital (si está activo). */}
      <LotMap projectSlug={project.slug} projectName={project.name} mapLat={project.mapLat} mapLng={project.mapLng} />

      {project.slug === 'montanita-view' && (
        <div className="mx-auto max-w-5xl px-4 pb-12 text-center sm:px-6">
          <Link
            to="/propuesta/montanita-view"
            className="inline-block rounded-full bg-primary px-8 py-3 font-semibold text-white transition hover:brightness-110"
          >
            {t('Ver la propuesta completa de inversión')} →
          </Link>
        </div>
      )}

      {project.showBrochure && (
        <BrochureDigital project={project} onRequestInfo={() => setOpen(true)} />
      )}

      {/* 3. SOBRE EL PROYECTO — solo sin brochure (el brochure ya trae descripción y
          amenidades más completas). Precio, ubicación y tipo ya están en el hero. */}
      {!project.showBrochure && (project.description || amenities.length > 0) && (
        <section className="bg-light">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-primary sm:text-4xl">{t('Sobre el proyecto')}</h2>
            {project.description && (
              <p className="mx-auto mt-5 max-w-2xl whitespace-pre-line text-left leading-relaxed text-primary/80 sm:text-center">
                {tb(project.description)}
              </p>
            )}
            {typeof project.features?.retorno === 'string' && (
              <p className="mt-6 text-sm text-primary/70">
                {t('Retorno estimado')}: <strong className="text-primary">{t(project.features.retorno)}</strong>
              </p>
            )}
            {amenities.length > 0 && (
              <div className="mt-10">
                <h3 className="mb-5 text-xl text-primary">{t('Amenidades')}</h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {amenities.map((am) => (
                    <div
                      key={am}
                      className="flex items-center gap-2.5 rounded-full bg-white px-4 py-2.5 shadow-sm ring-1 ring-black/5"
                    >
                      <AmenityIcon name={am} className="h-4 w-4 flex-none text-accent" />
                      <span className="text-sm font-medium text-primary">{t(am)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. GALERÍA — omitida cuando el proyecto tiene Brochure Digital propio (evita duplicado) */}
      {gallery.length > 0 && !project.showBrochure && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-3xl font-bold text-primary sm:text-4xl">
            {t('Galería')}
          </h2>
          <ImageGallery images={gallery} alt={project.name} />
        </section>
      )}

      {/* 5. CTA — el brochure ya trae su propio cierre; aquí solo si no hay brochure */}
      {!project.showBrochure && (
      <section className="bg-primary text-white">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-bold sm:text-4xl">{t('¿Te interesa este proyecto?')}</h2>
          <p className="mt-3 text-white/70">
            {t('Un asesor te explicará el plan de inversión a tu medida.')}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => setOpen(true)}>
              {t('Solicitar información')}
            </Button>
            <WhatsAppCTA
              message={t('Hola, me interesa el proyecto *{p}* y quiero información.', { p: project.name })}
              className="px-7 py-3.5 text-base"
            />
          </div>
        </div>
      </section>
      )}

      {/* 6. RELACIONADOS */}
      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-bold text-primary">{t('Otros proyectos')}</h2>
          <div className="grid gap-8 md:grid-cols-2">
            {related.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Invertir en ${project.name}`}
      >
        <ContactForm
          source={`proyecto:${project.slug}`}
          inlineSuccess={false}
          onSuccess={() => setOpen(false)}
        />
      </Modal>

      <p className="mx-auto max-w-6xl px-4 pb-10 text-xs text-brand-gray">
        * {t('Cifras referenciales. No constituyen garantía de retorno.')}
      </p>
    </>
  );
}


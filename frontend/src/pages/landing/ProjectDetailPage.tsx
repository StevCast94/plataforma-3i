import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import { useProject, useProjects } from '@/hooks/useProjects';
import { Seo } from '@/components/shared/Seo';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { FeatureGrid } from '@/components/shared/FeatureGrid';
import { ImageGallery } from '@/components/shared/ImageGallery';
import { ProjectCard } from '@/components/shared/ProjectCard';
import { ContactForm } from '@/components/shared/ContactForm';
import { ShareToCommunity } from '@/components/comunidad/ShareToCommunity';
import { BrochureDigital } from '@/components/shared/BrochureDigital';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { DetailSkeleton } from '@/components/shared/LoadingSkeleton';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cld } from '@/lib/cloudinary';
import { formatCurrency } from '@/lib/utils';

export default function ProjectDetailPage() {
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
        title="Proyecto no encontrado"
        message="Es posible que ya no esté disponible."
        ctaText="Ver todos los proyectos"
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

  // Producto de tienda vinculado a este proyecto (ej. la fracción de Ibiza) — si existe,
  // "Quiero invertir" lleva directo a solicitar la compra en vez de abrir el formulario genérico.
  const investProduct = project.products?.[0];
  const goInvest = () => {
    if (investProduct) navigate(`/tienda/${investProduct.slug}`);
    else setOpen(true);
  };

  return (
    <>
      <Seo
        title={project.name}
        description={project.subtitle ?? project.description}
        image={project.coverImage}
      />

      {/* 1. HERO FULL-SCREEN */}
      <section className="relative isolate flex min-h-[80vh] items-end overflow-hidden text-white">
        {project.coverImage && (
          <img
            src={cld(project.coverImage, { width: 1920 })}
            alt={project.name}
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/40 to-black/30" />

        <div className="mx-auto w-full max-w-7xl px-4 pb-14 pt-28 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Inicio', to: '/' },
              { label: 'Proyectos', to: '/proyectos' },
              { label: project.name },
            ]}
          />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-6 max-w-3xl"
          >
            {project.location && (
              <p className="text-sm uppercase tracking-widest text-secondary">
                {project.location}
              </p>
            )}
            <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-6xl">
              {project.name}
            </h1>
            {project.subtitle && (
              <p className="mt-4 text-lg text-white/80">{project.subtitle}</p>
            )}
            {project.priceLabel && (
              <p className="mt-6 inline-block rounded-full bg-secondary px-5 py-2 font-semibold text-primary">
                {project.priceLabel}
              </p>
            )}
            <div className="mt-8">
              <Button size="lg" onClick={goInvest}>
                Quiero invertir
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. FEATURES GRID */}
      <FeatureGrid features={project.features} />

      {/* 3. GALERÍA — omitida cuando el proyecto tiene Brochure Digital propio (evita duplicado) */}
      {gallery.length > 0 && !project.showBrochure && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-3xl font-bold text-primary sm:text-4xl">
            Galería
          </h2>
          <ImageGallery images={gallery} alt={project.name} />
        </section>
      )}

      {/* 4. OPORTUNIDAD DE INVERSIÓN */}
      <section className="bg-light">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-3xl font-bold text-primary sm:text-4xl">
              Oportunidad de Inversión
            </h2>
            <p className="mt-5 leading-relaxed text-primary/80">{project.description}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <DataCard
              label="Precio desde"
              value={
                project.priceFrom != null
                  ? formatCurrency(project.priceFrom)
                  : (project.priceLabel ?? 'Consultar')
              }
            />
            <DataCard label="Retorno estimado" value="9% anual*" />
            <DataCard label="Ubicación" value={project.location ?? 'Ecuador'} />
            <DataCard label="Estado" value={project.active ? 'Disponible' : 'No disponible'} />
          </div>
        </div>
      </section>

      {/* 4.5 BROCHURE DIGITAL — proyectos con showBrochure activo desde el admin */}
      {project.showBrochure && (
        <BrochureDigital project={project} onRequestInfo={() => setOpen(true)} />
      )}

      {/* 5. CTA */}
      <section className="bg-primary text-white">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-bold sm:text-4xl">¿Te interesa este proyecto?</h2>
          <p className="mt-3 text-white/70">
            Un asesor te explicará el plan de inversión a tu medida.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => setOpen(true)}>
              Solicitar información
            </Button>
            <ShareToCommunity
              title={project.name}
              path={`/proyectos/${project.slug}`}
              image={project.coverImage}
              description={project.subtitle ?? undefined}
            />
          </div>
        </div>
      </section>

      {/* 6. RELACIONADOS */}
      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-bold text-primary">Otros proyectos</h2>
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
        * Cifras referenciales. No constituyen garantía de retorno.
      </p>
    </>
  );
}

function DataCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <p className="text-xs uppercase tracking-wider text-brand-gray">{label}</p>
      <p className="mt-2 font-serif text-2xl font-bold text-primary">{value}</p>
    </div>
  );
}

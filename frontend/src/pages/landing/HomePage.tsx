import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ProjectCard } from '@/components/shared/ProjectCard';
import { ProductCard } from '@/components/shared/ProductCard';
import { CTASection } from '@/components/shared/CTASection';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useProjects } from '@/hooks/useProjects';
import { useProducts } from '@/hooks/useProducts';
import { cloudinaryOptimize } from '@/lib/utils';

export default function HomePage() {
  const { data: content } = useSiteContent();
  const { data: projects, loading: loadingProjects } = useProjects();
  const { data: products, loading: loadingProducts } = useProducts();

  const hero = content?.hero ?? {};
  const projectsSection = content?.projects ?? {};
  const club = content?.club ?? {};

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-primary text-white">
        {hero.image_url && (
          <img
            src={cloudinaryOptimize(hero.image_url)}
            alt=""
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40"
          />
        )}
        <div className="mx-auto max-w-7xl px-4 py-28 sm:px-6 lg:px-8 lg:py-40">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl font-bold leading-tight sm:text-6xl">
              {hero.title ?? 'Invierte en el futuro. Vive el presente.'}
            </h1>
            <p className="mt-6 text-lg text-white/80">
              {hero.subtitle ??
                'Propiedades fraccionadas, membresías de viaje y experiencias premium en la costa ecuatoriana.'}
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link to="/proyectos">
                <Button size="lg">{hero.cta_text ?? 'Explorar proyectos'}</Button>
              </Link>
              <Link to="/club">
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white hover:text-primary">
                  Conoce el Club 3i
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
            {projectsSection.title ?? 'Nuestros Proyectos'}
          </h2>
          {projectsSection.subtitle && (
            <p className="mx-auto mt-3 max-w-2xl text-brand-gray">
              {projectsSection.subtitle}
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
            <Button variant="outline">Ver todos los proyectos</Button>
          </Link>
        </div>
      </section>

      {/* MEMBRESÍA / PRODUCTOS */}
      <section className="bg-light">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-primary sm:text-4xl">
              Membresías y Oportunidades
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-brand-gray">
              Accede a beneficios de viaje y a inversiones fraccionadas.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {loadingProducts
              ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
              : (products ?? []).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* CLUB 3i */}
      <CTASection
        title={club.title ?? 'Únete al Club 3i'}
        subtitle={
          club.subtitle ??
          'Viaja por el mundo con descuentos de hasta 70% y accede a beneficios exclusivos.'
        }
        ctaText="Quiero ser miembro"
        ctaTo="/club"
      />
    </>
  );
}

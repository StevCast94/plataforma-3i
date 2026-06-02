import { PageHeader } from '@/components/layout/PageHeader';
import { ProjectCard } from '@/components/shared/ProjectCard';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useProjects } from '@/hooks/useProjects';

export default function ProjectsPage() {
  const { data, loading, error } = useProjects();

  return (
    <>
      <PageHeader
        title="Proyectos"
        subtitle="Oportunidades de inversión cuidadosamente seleccionadas en la costa ecuatoriana."
      />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {error && <p className="text-center text-red-600">{error}</p>}
        <div className="grid gap-8 md:grid-cols-2">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            : (data ?? []).map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
        {!loading && (data?.length ?? 0) === 0 && (
          <p className="text-center text-brand-gray">No hay proyectos disponibles aún.</p>
        )}
      </section>
    </>
  );
}

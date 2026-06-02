import { useParams, Link } from 'react-router-dom';
import { useProject } from '@/hooks/useProjects';
import { ImageGallery } from '@/components/shared/ImageGallery';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ProjectFeatures } from '@shared/types';

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const { data: project, loading, error } = useProject(slug);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="mt-6 h-8 w-1/2" />
        <Skeleton className="mt-3 h-4 w-full" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-3xl text-primary">Proyecto no encontrado</h1>
        <Link to="/proyectos" className="mt-6 inline-block">
          <Button variant="outline">Volver a proyectos</Button>
        </Link>
      </div>
    );
  }

  const features = (project.features ?? {}) as ProjectFeatures;
  const gallery =
    project.images && project.images.length > 0
      ? project.images
      : project.coverImage
        ? [project.coverImage]
        : [];

  return (
    <article className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-2">
        <ImageGallery images={gallery} alt={project.name} />

        <div>
          {project.location && (
            <p className="text-sm uppercase tracking-wider text-brand-gray">
              {project.location}
            </p>
          )}
          <h1 className="mt-1 text-4xl font-bold text-primary">{project.name}</h1>
          {project.subtitle && (
            <p className="mt-2 text-lg text-brand-gray">{project.subtitle}</p>
          )}
          {project.priceLabel && (
            <p className="mt-5 text-2xl font-bold text-accent">{project.priceLabel}</p>
          )}

          <p className="mt-6 leading-relaxed text-primary/80">{project.description}</p>

          {Array.isArray(features.amenities) && features.amenities.length > 0 && (
            <div className="mt-7">
              <h3 className="mb-3 text-lg text-primary">Amenidades</h3>
              <div className="flex flex-wrap gap-2">
                {features.amenities.map((a) => (
                  <Badge key={a} variant="light">{a}</Badge>
                ))}
              </div>
            </div>
          )}

          <Link to="/contacto" className="mt-9 inline-block">
            <Button size="lg">Solicitar información</Button>
          </Link>
        </div>
      </div>
    </article>
  );
}

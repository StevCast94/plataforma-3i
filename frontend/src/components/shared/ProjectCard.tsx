import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cloudinaryOptimize } from '@/lib/utils';
import type { Project } from '@shared/types';

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link to={`/proyectos/${project.slug}`}>
      <Card className="group h-full">
        <div className="relative h-56 overflow-hidden">
          <img
            src={cloudinaryOptimize(project.coverImage)}
            alt={project.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {project.featured && (
            <Badge variant="dark" className="absolute left-4 top-4">
              Destacado
            </Badge>
          )}
        </div>
        <div className="p-6">
          {project.location && (
            <p className="text-xs uppercase tracking-wider text-brand-gray">
              {project.location}
            </p>
          )}
          <h3 className="mt-1 text-2xl text-primary">{project.name}</h3>
          {project.subtitle && (
            <p className="mt-1 text-sm text-brand-gray">{project.subtitle}</p>
          )}
          {project.priceLabel && (
            <p className="mt-4 font-semibold text-accent">{project.priceLabel}</p>
          )}
        </div>
      </Card>
    </Link>
  );
}

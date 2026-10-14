import { Link, useLang } from '@/hooks/useLang';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cld } from '@/lib/cloudinary';
import { typeInfo } from '@/lib/propertyTypes';
import type { Project } from '@shared/types';

export function ProjectCard({ project }: { project: Project }) {
  const { t, pt } = useLang();
  return (
    <Link to={project.slug === 'ibiza-condohotel' ? '/ibiza' : `/proyectos/${project.slug}`}>
      <Card className="group h-full">
        <div className="relative h-56 overflow-hidden">
          <img
            src={cld(project.coverImage, { width: 800 })}
            alt={project.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {project.featured && (
            <Badge variant="dark" className="absolute left-4 top-4">
              {t('Destacado')}
            </Badge>
          )}
          {project.verified && (
            <Badge variant="gold" className="absolute right-4 top-4">
              ✓ {t('Verificado por Grupo 3i')}
            </Badge>
          )}
        </div>
        <div className="p-6">
          {project.location && (
            <p className="text-xs uppercase tracking-wider text-brand-gray">
              {t(project.location)}
            </p>
          )}
          <h3 className="mt-1 text-2xl text-primary">{project.name}</h3>
          {project.subtitle && (
            <p className="mt-1 text-sm text-brand-gray">{pt(project, 'subtitle')}</p>
          )}
          {(project.propertyTypes?.length ?? 0) > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.propertyTypes!.map((id) => (
                <span key={id} className="rounded-full bg-light px-2.5 py-0.5 text-xs font-medium text-primary">{t(typeInfo(id).label)}</span>
              ))}
            </div>
          )}
          {project.priceLabel && (
            <p className="mt-4 font-semibold text-accent">{pt(project, 'priceLabel')}</p>
          )}
        </div>
      </Card>
    </Link>
  );
}

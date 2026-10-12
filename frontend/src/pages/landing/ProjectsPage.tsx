import { PageHeader } from '@/components/layout/PageHeader';
import { Seo } from '@/components/shared/Seo';
import { useLang } from '@/hooks/useLang';
import { ProjectCard } from '@/components/shared/ProjectCard';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useProjects } from '@/hooks/useProjects';
import { useSearchParams } from 'react-router-dom';
import { PROPERTY_TYPES } from '@/lib/propertyTypes';

export default function ProjectsPage() {
  const { t } = useLang();
  const { data, loading, error } = useProjects();
  // Filtro por tipo en la URL (?tipo=casas) para poder enlazarlo desde campañas.
  const [params, setParams] = useSearchParams();
  const tipo = params.get('tipo') ?? '';
  const types = PROPERTY_TYPES.filter((p) => data?.some((x) => x.propertyTypes?.includes(p.id)));
  const list = (data ?? []).filter((p) => !tipo || p.propertyTypes?.includes(tipo));
  const pick = (id: string) => setParams(id ? { tipo: id } : {}, { replace: true });

  return (
    <>
      <Seo title={t('Proyectos')} description={t('Ibiza Condohotel (fracciones desde $12,000) y Montañita View (lotes con vista al mar desde $41,721) en Santa Elena, Ecuador.')} />
      <PageHeader
        title={t('Proyectos')}
        subtitle={t('Proyectos seleccionados y verificados en la costa ecuatoriana.')}
        image="/images/secciones/header-proyectos.jpg"
      />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {(types.length > 1 || tipo) && (
          <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label={t('Tipo de proyecto')}>
            {[{ id: '', label: 'Todos' }, ...types].map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={tipo === p.id}
                onClick={() => pick(p.id)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${tipo === p.id ? 'border-primary bg-primary text-white' : 'border-black/15 bg-white text-primary hover:bg-light'}`}
              >
                {t(p.label)}
              </button>
            ))}
          </div>
        )}
        {error && <p className="text-center text-red-600">{error}</p>}
        <div className="grid gap-8 md:grid-cols-2">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            : list.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
        {!loading && list.length === 0 && (
          <p className="text-center text-brand-gray">{tipo ? t('Todavía no hay proyectos de este tipo.') : t('No hay proyectos disponibles aún.')}</p>
        )}
      </section>
    </>
  );
}

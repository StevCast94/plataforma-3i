import { Seo } from '@/components/shared/Seo';
import { GroupCard } from '@/components/comunidad/GroupCard';
import { useGroups } from '@/hooks/useGroups';

export default function GroupsPage() {
  const { data, loading } = useGroups();
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <Seo title="Grupos — Comunidad" />
      <h1 className="mb-5 text-2xl font-bold text-primary">Grupos</h1>
      {loading && <p className="text-brand-gray">Cargando…</p>}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((g) => (
          <GroupCard key={g.id} group={g} />
        ))}
      </div>
    </div>
  );
}

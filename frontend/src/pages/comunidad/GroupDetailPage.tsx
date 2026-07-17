import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Seo } from '@/components/shared/Seo';
import { PostCreator } from '@/components/comunidad/PostCreator';
import { PostCard } from '@/components/comunidad/PostCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { useGroup } from '@/hooks/useGroups';
import { useFeed } from '@/hooks/useCommunityPosts';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/shared/Toast';
import { cld } from '@/lib/cloudinary';
import type { ReactionType } from '@shared/types';

export default function GroupDetailPage() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { data: group, loading } = useGroup(slug);
  const [joined, setJoined] = useState<boolean | null>(null);

  const isMember = joined ?? group?.isMember ?? false;
  const { posts, prepend, remove, update } = useFeed('recent', group?.id);

  if (loading) return <p className="py-16 text-center text-brand-gray">Cargando…</p>;
  if (!group) return <EmptyState title="Grupo no encontrado" ctaText="Ver grupos" ctaTo="/comunidad/grupos" icon={<Users className="h-10 w-10" strokeWidth={1.4} />} />;

  async function toggleMembership() {
    if (!isAuthenticated) {
      toast('Inicia sesión como miembro', 'info');
      return;
    }
    try {
      if (isMember) {
        await api.del(`/community/groups/${group!.id}/leave`);
        setJoined(false);
      } else {
        await api.post(`/community/groups/${group!.id}/join`);
        setJoined(true);
        toast('¡Te uniste al grupo!', 'success');
      }
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  function handleReact(id: string, myReaction: ReactionType | null, delta: number) {
    const p = posts.find((x) => x.id === id);
    if (p) update(id, { myReaction, reactionCount: p.reactionCount + delta });
  }

  return (
    <div className="mx-auto max-w-[680px] px-4 py-6 sm:px-6">
      <Seo title={`${group.name} — Comunidad`} description={group.description ?? undefined} />

      {/* Portada */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="h-36 bg-gradient-to-br from-primary to-accent">
          {group.coverImage && <img src={cld(group.coverImage, { width: 1200 })} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-primary">{group.name}</h1>
              <p className="mt-1 text-sm text-brand-gray">{group.memberCount} miembros · {group.postCount} posts</p>
            </div>
            <Badge variant="light">{group.privacy === 'private' ? 'Privado' : 'Público'}</Badge>
          </div>
          {group.description && <p className="mt-3 text-sm text-primary/80">{group.description}</p>}
          <Button className="mt-4" variant={isMember ? 'outline' : 'primary'} onClick={toggleMembership}>
            {isMember ? 'Salir del grupo' : 'Unirme'}
          </Button>
        </div>
      </div>

      {/* Crear post en el grupo (si es miembro) */}
      {isAuthenticated && isMember && (
        <div className="mt-4">
          <PostCreator onCreated={prepend} fixedGroupId={group.id} />
        </div>
      )}

      {/* Feed del grupo */}
      <div className="mt-4 space-y-4">
        {posts.length === 0 && (
          <p className="rounded-2xl bg-white p-8 text-center text-brand-gray ring-1 ring-black/5">
            Aún no hay publicaciones en este grupo.
          </p>
        )}
        {posts.map((p) => (
          <PostCard key={p.id} post={p} onReact={handleReact} onDelete={remove} />
        ))}
      </div>
    </div>
  );
}

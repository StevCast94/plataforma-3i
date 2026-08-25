import { useParams, Link } from 'react-router-dom';
import { MailX } from 'lucide-react';
import { Seo } from '@/components/shared/Seo';
import { PostCard } from '@/components/comunidad/PostCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/lib/api';
import { useState } from 'react';
import type { FeedPost, ReactionType } from '@shared/types';

export default function PostDetailPage() {
  const { id } = useParams();
  const { data, loading } = useFetch<FeedPost>(() => api.get<FeedPost>(`/community/posts/${id}`), [id]);
  const [post, setPost] = useState<FeedPost | null>(null);

  const current = post ?? data;

  if (loading && !current) return <p className="py-16 text-center text-brand-gray">Cargando…</p>;
  if (!current)
    return <EmptyState title="Post no encontrado" ctaText="Volver a la comunidad" ctaTo="/comunidad" icon={<MailX className="h-10 w-10" strokeWidth={1.4} />} />;

  function handleReact(_id: string, myReaction: ReactionType | null, delta: number) {
    setPost({ ...current!, myReaction, reactionCount: current!.reactionCount + delta });
  }

  function handleEdit(_id: string, patch: Partial<FeedPost>) {
    setPost({ ...current!, ...patch });
  }

  return (
    <div className="mx-auto max-w-[680px] px-4 py-6 sm:px-6">
      <Seo title="Publicación — Comunidad" description={current.content.slice(0, 150)} />
      <Link to="/comunidad" className="mb-4 inline-block text-sm text-accent hover:underline">← Volver al feed</Link>
      <PostCard post={current} onReact={handleReact} onEdit={handleEdit} defaultShowComments />
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '@/components/shared/Seo';
import { PostCreator } from '@/components/comunidad/PostCreator';
import { PostCard } from '@/components/comunidad/PostCard';
import { CommunitySidebar } from '@/components/comunidad/CommunitySidebar';
import { Button } from '@/components/ui/Button';
import { useFeed } from '@/hooks/useCommunityPosts';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { ReactionType } from '@shared/types';

type Tab = 'recent' | 'trending' | 'mine';

export default function CommunityFeedPage() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>('recent');
  const { posts, loading, hasMore, loadMore, prepend, remove, update } = useFeed(tab);
  const sentinel = useRef<HTMLDivElement>(null);

  // Scroll infinito.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore();
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  const tabs: { key: Tab; label: string; auth?: boolean }[] = [
    { key: 'trending', label: '🔥 Trending' },
    { key: 'recent', label: '🕐 Recientes' },
    { key: 'mine', label: '👥 Mis grupos', auth: true },
  ];

  function handleReact(id: string, myReaction: ReactionType | null, delta: number) {
    const post = posts.find((p) => p.id === id);
    if (!post) return;
    update(id, { myReaction, reactionCount: post.reactionCount + delta });
  }

  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6 sm:px-6">
      <Seo title="Comunidad Grupo 3i" description="Conecta con la comunidad inmobiliaria de Grupo 3i." />

      <div className="mx-auto w-full max-w-[680px] space-y-4">
        <h1 className="text-2xl font-bold text-primary">Comunidad Grupo 3i</h1>

        {isAuthenticated ? (
          <PostCreator onCreated={prepend} />
        ) : (
          <div className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
            <p className="text-brand-gray">Únete al Club 3i para publicar, comentar y conectar.</p>
            <Link to="/oficina/registro" className="mt-3 inline-block">
              <Button size="sm">Registrarme gratis</Button>
            </Link>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.filter((t) => !t.auth || isAuthenticated).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition',
                tab === t.key ? 'bg-primary text-white' : 'bg-white text-brand-gray ring-1 ring-black/5 hover:text-primary',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onReact={handleReact} onDelete={remove} />
          ))}
          {loading && <p className="py-4 text-center text-sm text-brand-gray">Cargando…</p>}
          {!loading && posts.length === 0 && (
            <p className="rounded-2xl bg-white p-8 text-center text-brand-gray ring-1 ring-black/5">
              Aún no hay publicaciones. ¡Sé el primero!
            </p>
          )}
          <div ref={sentinel} className="h-4" />
          {!hasMore && posts.length > 0 && (
            <p className="py-4 text-center text-xs text-brand-gray">Has llegado al final 🎉</p>
          )}
        </div>
      </div>

      <CommunitySidebar />
    </div>
  );
}

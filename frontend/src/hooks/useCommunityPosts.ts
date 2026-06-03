import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { FeedPost, FeedResponse } from '@shared/types';

type Tab = 'recent' | 'trending' | 'mine';

/** Feed con paginación incremental (scroll → cargar más). */
export function useFeed(tab: Tab, groupId?: string) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (p: number, replace: boolean) => {
      setLoading(true);
      const params = new URLSearchParams({ tab, page: String(p), ...(groupId ? { groupId } : {}) });
      try {
        const res = await api.get<FeedResponse>(`/community/posts?${params}`);
        setPosts((prev) => (replace ? res.posts : [...prev, ...res.posts]));
        setHasMore(res.hasMore);
        setPage(p);
      } finally {
        setLoading(false);
      }
    },
    [tab, groupId],
  );

  useEffect(() => {
    load(1, true);
  }, [load]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) load(page + 1, false);
  }, [loading, hasMore, page, load]);

  const prepend = useCallback((post: FeedPost) => setPosts((prev) => [post, ...prev]), []);
  const remove = useCallback((id: string) => setPosts((prev) => prev.filter((p) => p.id !== id)), []);
  const update = useCallback(
    (id: string, patch: Partial<FeedPost>) =>
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    [],
  );

  return { posts, loading, hasMore, loadMore, prepend, remove, update, reload: () => load(1, true) };
}

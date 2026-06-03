import { useEffect, useState } from 'react';
import { CommentItem } from './CommentItem';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { SocialComment } from '@shared/types';

export function CommentList({ postId, onCountChange }: { postId: string; onCountChange?: (delta: number) => void }) {
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get<SocialComment[]>(`/community/posts/${postId}/comments`).then(setComments).finally(() => setLoading(false));
  }, [postId]);

  async function submit() {
    if (!text.trim()) return;
    setSending(true);
    try {
      const c = await api.post<SocialComment>(`/community/posts/${postId}/comments`, { content: text });
      setComments((prev) => [...prev, c]);
      setText('');
      onCountChange?.(1);
    } finally {
      setSending(false);
    }
  }

  function addReply(reply: SocialComment, parentId: string) {
    setComments((prev) =>
      prev.map((c) => (c.id === parentId ? { ...c, replies: [...(c.replies ?? []), reply] } : c)),
    );
    onCountChange?.(1);
  }

  return (
    <div className="space-y-4 border-t border-black/5 pt-4">
      {isAuthenticated && (
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Escribe un comentario…"
            className="flex-1 rounded-full border border-black/15 px-4 py-2 text-sm"
          />
          <button onClick={submit} disabled={sending} className="rounded-full bg-primary px-5 text-sm font-medium text-white">
            Comentar
          </button>
        </div>
      )}

      {loading && <p className="text-sm text-brand-gray">Cargando comentarios…</p>}
      {!loading && comments.length === 0 && <p className="text-sm text-brand-gray">Sé el primero en comentar.</p>}
      {comments.map((c) => (
        <CommentItem key={c.id} comment={c} postId={postId} onReply={addReply} />
      ))}
    </div>
  );
}

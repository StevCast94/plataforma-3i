import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from './Avatar';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { timeAgo } from '@/lib/utils';
import type { SocialComment } from '@shared/types';

interface CommentItemProps {
  comment: SocialComment;
  postId: string;
  onReply: (reply: SocialComment, parentId: string) => void;
}

export function CommentItem({ comment, postId, onReply }: CommentItemProps) {
  const { isAuthenticated } = useAuth();
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const author = comment.author;

  async function submitReply() {
    if (!text.trim()) return;
    setSending(true);
    try {
      const reply = await api.post<SocialComment>(`/community/posts/${postId}/comments`, {
        content: text,
        parentId: comment.id,
      });
      onReply(reply, comment.id);
      setText('');
      setReplying(false);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex gap-3">
      <Avatar name={author?.fullName ?? '?'} avatarUrl={author?.avatarUrl} size="sm" />
      <div className="flex-1">
        <div className="rounded-2xl bg-light px-4 py-2">
          {author ? (
            <Link to={`/comunidad/perfil/${author.referralCode}`} className="text-sm font-semibold text-primary hover:underline">
              {author.fullName}
            </Link>
          ) : (
            <span className="text-sm font-semibold text-primary">Usuario</span>
          )}
          <p className="text-sm text-primary/90">{comment.content}</p>
        </div>
        <div className="mt-1 flex items-center gap-3 px-2 text-xs text-brand-gray">
          <span>{timeAgo(comment.createdAt)}</span>
          {isAuthenticated && !comment.parentId && (
            <button onClick={() => setReplying((v) => !v)} className="font-medium hover:text-accent">
              Responder
            </button>
          )}
        </div>

        {replying && (
          <div className="mt-2 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitReply()}
              placeholder="Escribe una respuesta…"
              className="flex-1 rounded-full border border-black/15 px-3 py-1.5 text-sm"
            />
            <button onClick={submitReply} disabled={sending} className="rounded-full bg-primary px-4 text-sm text-white">
              Enviar
            </button>
          </div>
        )}

        {/* Respuestas (1 nivel) */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3 border-l-2 border-light pl-3">
            {comment.replies.map((r) => (
              <div key={r.id} className="flex gap-3">
                <Avatar name={r.author?.fullName ?? '?'} avatarUrl={r.author?.avatarUrl} size="sm" />
                <div className="flex-1">
                  <div className="rounded-2xl bg-light px-4 py-2">
                    {r.author ? (
                      <Link to={`/comunidad/perfil/${r.author.referralCode}`} className="text-sm font-semibold text-primary hover:underline">
                        {r.author.fullName}
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold text-primary">Usuario</span>
                    )}
                    <p className="text-sm text-primary/90">{r.content}</p>
                  </div>
                  <span className="px-2 text-xs text-brand-gray">{timeAgo(r.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

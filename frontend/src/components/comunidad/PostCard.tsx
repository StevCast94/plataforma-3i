import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from './Avatar';
import { ReactionBar } from './ReactionBar';
import { CommentList } from './CommentList';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/shared/Toast';
import { cld } from '@/lib/cloudinary';
import { timeAgo, cn } from '@/lib/utils';
import type { FeedPost, ReactionType } from '@shared/types';

function ImageGrid({ images }: { images: string[] }) {
  if (images.length === 0) return null;
  const layout =
    images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-2';
  return (
    <div className={cn('mt-3 grid gap-1 overflow-hidden rounded-xl', layout)}>
      {images.slice(0, 4).map((img, i) => (
        <img
          key={i}
          src={cld(img, { width: 800 })}
          alt=""
          loading="lazy"
          className={cn(
            'max-h-96 w-full object-cover',
            images.length === 3 && i === 0 && 'row-span-2 max-h-full',
          )}
        />
      ))}
    </div>
  );
}

interface PostCardProps {
  post: FeedPost;
  onReact: (id: string, myReaction: ReactionType | null, delta: number) => void;
  onDelete?: (id: string) => void;
  groupName?: string;
  defaultShowComments?: boolean;
}

export function PostCard({ post, onReact, onDelete, groupName, defaultShowComments }: PostCardProps) {
  const { member } = useAuth();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(!!defaultShowComments);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [expanded, setExpanded] = useState(false);

  const author = post.author;
  const isMine = member && author && member.id === author.id;
  const isElite = author?.status === 'ELITE';
  const long = post.content.length > 280;

  async function remove() {
    try {
      await api.del(`/community/posts/${post.id}`);
      onDelete?.(post.id);
      toast('Post eliminado', 'success');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar name={author?.fullName ?? '?'} avatarUrl={author?.avatarUrl} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {author ? (
              <Link to={`/comunidad/perfil/${author.referralCode}`} className="font-semibold text-primary hover:underline">
                {author.fullName}
              </Link>
            ) : (
              <span className="font-semibold text-primary">Usuario</span>
            )}
            <Badge variant={isElite ? 'gold' : 'light'}>{isElite ? 'Elite' : 'Premiere'}</Badge>
            {groupName && <span className="text-xs text-brand-gray">en {groupName}</span>}
          </div>
          <span className="text-xs text-brand-gray">{timeAgo(post.createdAt)}</span>
        </div>
        {isMine && (
          <button onClick={remove} className="text-brand-gray hover:text-red-600" title="Eliminar">
            ✕
          </button>
        )}
      </div>

      {/* Contenido */}
      <p className="mt-3 whitespace-pre-wrap text-primary/90">
        {long && !expanded ? post.content.slice(0, 280) + '…' : post.content}
        {long && (
          <button onClick={() => setExpanded((v) => !v)} className="ml-1 text-sm font-medium text-accent">
            {expanded ? 'ver menos' : 'ver más'}
          </button>
        )}
      </p>

      <ImageGrid images={post.images} />

      {/* Link preview */}
      {post.linkUrl && (
        <a href={post.linkUrl} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-xl ring-1 ring-black/10">
          {post.linkPreview?.image && (
            <img src={cld(post.linkPreview.image, { width: 800 })} alt="" className="h-40 w-full object-cover" />
          )}
          <div className="p-3">
            <p className="text-sm font-semibold text-primary">{post.linkPreview?.title ?? post.linkUrl}</p>
            {post.linkPreview?.description && (
              <p className="line-clamp-2 text-xs text-brand-gray">{post.linkPreview.description}</p>
            )}
          </div>
        </a>
      )}

      {/* Conteos */}
      {(post.reactionCount > 0 || commentCount > 0) && (
        <div className="mt-3 flex justify-between text-xs text-brand-gray">
          <span>{post.reactionCount > 0 ? `${post.reactionCount} reacciones` : ''}</span>
          <button onClick={() => setShowComments((v) => !v)} className="hover:underline">
            {commentCount > 0 ? `${commentCount} comentarios` : ''}
          </button>
        </div>
      )}

      {/* Acciones */}
      <div className="mt-2 flex items-center gap-1 border-t border-black/5 pt-2">
        <ReactionBar
          postId={post.id}
          myReaction={post.myReaction}
          count={post.reactionCount}
          onChange={(my, delta) => onReact(post.id, my, delta)}
        />
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-gray hover:bg-light"
        >
          💬 Comentar
        </button>
      </div>

      {showComments && (
        <div className="mt-3">
          <CommentList postId={post.id} onCountChange={(d) => setCommentCount((c) => c + d)} />
        </div>
      )}
    </article>
  );
}

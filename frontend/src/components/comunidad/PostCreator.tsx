import { useState } from 'react';
import { Avatar } from './Avatar';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useGroups } from '@/hooks/useGroups';
import { useToast } from '@/components/shared/Toast';
import { cld } from '@/lib/cloudinary';
import type { FeedPost } from '@shared/types';

interface PostCreatorProps {
  onCreated: (post: FeedPost) => void;
  /** Fija el grupo (en la página de un grupo). */
  fixedGroupId?: string;
}

export function PostCreator({ onCreated, fixedGroupId }: PostCreatorProps) {
  const { member } = useAuth();
  const { toast } = useToast();
  const { data: groups } = useGroups();
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [groupId, setGroupId] = useState(fixedGroupId ?? '');
  const [sending, setSending] = useState(false);

  if (!member) return null;
  const myGroups = (groups ?? []).filter((g) => g.isMember);

  function addImage() {
    const url = imageInput.trim();
    if (!url) return;
    if (images.length >= 4) {
      toast('Máximo 4 imágenes', 'info');
      return;
    }
    setImages((a) => [...a, url]);
    setImageInput('');
  }

  async function publish() {
    if (!content.trim()) return;
    setSending(true);
    try {
      const post = await api.post<FeedPost>('/community/posts', {
        content,
        images,
        linkUrl: linkUrl || null,
        groupId: groupId || null,
      });
      onCreated(post);
      setContent(''); setImages([]); setLinkUrl(''); setExpanded(false);
      toast('¡Publicado!', 'success');
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center gap-3">
        <Avatar name={member.fullName} avatarUrl={member.avatarUrl} />
        {!expanded ? (
          <button
            onClick={() => setExpanded(true)}
            className="flex-1 rounded-full bg-light px-4 py-2.5 text-left text-sm text-brand-gray hover:bg-light/70"
          >
            ¿Qué estás pensando, {member.fullName.split(' ')[0]}?
          </button>
        ) : (
          <span className="font-semibold text-primary">Crear publicación</span>
        )}
      </div>

      {expanded && (
        <div className="mt-3 space-y-3">
          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Comparte algo con la comunidad…"
            className="min-h-24 w-full rounded-xl border border-black/15 px-4 py-3 text-sm focus:border-secondary focus:outline-none"
          />

          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img src={cld(img, { width: 160 })} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  <button onClick={() => setImages((a) => a.filter((_, j) => j !== i))} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white">×</button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input value={imageInput} onChange={(e) => setImageInput(e.target.value)} placeholder="URL de imagen (opcional)" className="flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm" />
            <Button size="sm" variant="outline" onClick={addImage}>+ Imagen</Button>
          </div>
          <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="Pegar un enlace (opcional)" className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            {!fixedGroupId && (
              <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="rounded-lg border border-black/15 px-3 py-2 text-sm">
                <option value="">Sin grupo (feed general)</option>
                {myGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            )}
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setExpanded(false)}>Cancelar</Button>
              <Button size="sm" onClick={publish} disabled={sending || !content.trim()}>
                {sending ? 'Publicando…' : 'Publicar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

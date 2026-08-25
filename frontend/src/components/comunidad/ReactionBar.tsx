import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/shared/Toast';
import type { ReactionType } from '@shared/types';

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'like', emoji: '👍', label: 'Me gusta' },
  { type: 'love', emoji: '❤️', label: 'Me encanta' },
  { type: 'useful', emoji: '💡', label: 'Útil' },
  { type: 'interesting', emoji: '🤔', label: 'Interesante' },
  { type: 'celebrate', emoji: '🎉', label: 'Celebrar' },
];

interface ReactionBarProps {
  postId: string;
  myReaction: ReactionType | null;
  count: number;
  onChange: (myReaction: ReactionType | null, delta: number) => void;
}

export function ReactionBar({ postId, myReaction, count, onChange }: ReactionBarProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  async function react(type: ReactionType) {
    if (!isAuthenticated) {
      toast('Inicia sesión como miembro para reaccionar', 'info');
      return;
    }
    setOpen(false);
    const wasMine = myReaction;
    // Optimista: el botón cambia al instante (toggle si repites la misma
    // reacción) y solo se revierte si el servidor falla — la espera de red
    // ya no se siente al tocar.
    const optimistic = wasMine === type ? null : type;
    const optimisticDelta = (optimistic ? 1 : 0) - (wasMine ? 1 : 0);
    onChange(optimistic, optimisticDelta);
    try {
      const res = await api.post<{ myReaction: ReactionType | null }>(`/community/posts/${postId}/react`, { type });
      if (res.myReaction !== optimistic) {
        // El servidor no coincidió con lo previsto: corregir sin doble-contar.
        onChange(res.myReaction, (res.myReaction ? 1 : 0) - (optimistic ? 1 : 0));
      }
    } catch (err) {
      onChange(wasMine, -optimisticDelta);
      toast((err as Error).message, 'error');
    }
  }

  const active = REACTIONS.find((r) => r.type === myReaction);

  return (
    <div className="relative">
      <button
        onClick={() => (myReaction ? react(myReaction) : setOpen((v) => !v))}
        onMouseEnter={() => isAuthenticated && setOpen(true)}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-light ${
          myReaction ? 'text-accent' : 'text-brand-gray'
        }`}
      >
        <span>{active ? active.emoji : '👍'}</span>
        {active ? active.label : 'Reaccionar'}
        {count > 0 && <span className="text-xs">· {count}</span>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            onMouseLeave={() => setOpen(false)}
            className="absolute bottom-full left-0 z-20 mb-1 flex gap-1 rounded-full bg-white p-1.5 shadow-lg ring-1 ring-black/5"
          >
            {REACTIONS.map((r) => (
              <button
                key={r.type}
                onClick={() => react(r.type)}
                title={r.label}
                className="rounded-full p-1.5 text-xl transition hover:scale-125 hover:bg-light"
              >
                {r.emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

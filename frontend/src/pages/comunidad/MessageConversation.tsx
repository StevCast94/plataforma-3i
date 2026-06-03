import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Seo } from '@/components/shared/Seo';
import { Avatar } from '@/components/comunidad/Avatar';
import { MessageBubble } from '@/components/comunidad/MessageBubble';
import { useConversation } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';

export default function MessageConversation() {
  const { code } = useParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { messages, user, loading, send } = useConversation(code);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!authLoading && !isAuthenticated) return <Navigate to="/oficina/login" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const content = text;
    setText('');
    await send(content);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-130px)] max-w-2xl flex-col px-4 py-4 sm:px-6">
      <Seo title={`Chat con ${user?.fullName ?? ''} — Comunidad`} />

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-black/5 pb-3">
        <Link to="/comunidad/mensajes" className="text-brand-gray hover:text-primary">←</Link>
        <Avatar name={user?.fullName ?? '?'} avatarUrl={user?.avatarUrl} size="sm" />
        {user ? (
          <Link to={`/comunidad/perfil/${user.referralCode}`} className="font-semibold text-primary hover:underline">
            {user.fullName}
          </Link>
        ) : (
          <span className="font-semibold text-primary">Conversación</span>
        )}
      </div>

      {/* Mensajes */}
      <div className="flex-1 space-y-2 overflow-y-auto py-4">
        {loading && <p className="text-center text-sm text-brand-gray">Cargando…</p>}
        {!loading && messages.length === 0 && (
          <p className="text-center text-sm text-brand-gray">Envía el primer mensaje 👋</p>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={submit} className="flex gap-2 border-t border-black/5 pt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje…"
          className="flex-1 rounded-full border border-black/15 px-4 py-2 text-sm focus:border-secondary focus:outline-none"
        />
        <button type="submit" className="rounded-full bg-primary px-5 text-sm font-medium text-white">Enviar</button>
      </form>
    </div>
  );
}

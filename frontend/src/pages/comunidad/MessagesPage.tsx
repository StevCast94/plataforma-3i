import { Link, Navigate } from 'react-router-dom';
import { Seo } from '@/components/shared/Seo';
import { Avatar } from '@/components/comunidad/Avatar';
import { useConversations } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { timeAgo } from '@/lib/utils';

export default function MessagesPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data, loading } = useConversations();

  if (!authLoading && !isAuthenticated) return <Navigate to="/oficina/login" replace />;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <Seo title="Mensajes — Comunidad" />
      <h1 className="mb-5 text-2xl font-bold text-primary">Mensajes</h1>

      {loading && <p className="text-brand-gray">Cargando…</p>}
      {!loading && data.length === 0 && (
        <p className="rounded-2xl bg-white p-8 text-center text-brand-gray ring-1 ring-black/5">
          No tienes conversaciones todavía. Visita un perfil y envía un mensaje.
        </p>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        {data.map((c) => (
          <Link
            key={c.user?.referralCode ?? c.lastAt}
            to={`/comunidad/mensajes/${c.user?.referralCode}`}
            className="flex items-center gap-3 border-b border-black/5 px-4 py-3 last:border-0 hover:bg-light"
          >
            <Avatar name={c.user?.fullName ?? '?'} avatarUrl={c.user?.avatarUrl} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-primary">{c.user?.fullName ?? 'Usuario'}</span>
                <span className="text-xs text-brand-gray">{timeAgo(c.lastAt)}</span>
              </div>
              <p className="truncate text-sm text-brand-gray">{c.lastMessage}</p>
            </div>
            {c.unread > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-xs font-bold text-primary">
                {c.unread}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

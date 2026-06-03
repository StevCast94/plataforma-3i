import { useNavigate, useParams } from 'react-router-dom';
import { Seo } from '@/components/shared/Seo';
import { Avatar } from '@/components/comunidad/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/shared/EmptyState';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { cld } from '@/lib/cloudinary';
import { timeAgo } from '@/lib/utils';
import type { CommunityMember } from '@shared/types';

interface ProfilePost {
  id: string;
  content: string;
  images: string[];
  createdAt: string;
}

export default function ProfilePage() {
  const { code } = useParams();
  const { member } = useAuth();
  const navigate = useNavigate();
  const { data: profile, loading } = useFetch<CommunityMember>(
    () => api.get<CommunityMember>(`/community/members/${code}`),
    [code],
  );
  const { data: posts } = useFetch<ProfilePost[]>(
    () => api.get<ProfilePost[]>(`/community/members/${code}/posts`),
    [code],
  );

  if (loading) return <p className="py-16 text-center text-brand-gray">Cargando perfil…</p>;
  if (!profile)
    return <EmptyState title="Perfil no encontrado" ctaText="Ver miembros" ctaTo="/comunidad/miembros" icon="👤" />;

  const isElite = profile.status === 'ELITE';
  const isMe = member?.referralCode === profile.referralCode;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Seo title={`${profile.fullName} — Comunidad`} description={profile.bio ?? undefined} />

      {/* Header */}
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
        <Avatar name={profile.fullName} avatarUrl={profile.avatarUrl} size="lg" className="mx-auto" />
        <h1 className="mt-3 text-2xl font-bold text-primary">{profile.fullName}</h1>
        <div className="mt-1 flex items-center justify-center gap-2">
          <Badge variant={isElite ? 'gold' : 'light'}>{isElite ? 'Miembro Elite' : 'Premiere'}</Badge>
          {isElite && profile.eliteBy === 'REFERRALS' && (
            <span className="text-xs text-accent">5+ referidos exitosos</span>
          )}
        </div>
        {profile.bio && <p className="mx-auto mt-3 max-w-md text-sm text-brand-gray">{profile.bio}</p>}
        {profile.location && <p className="mt-2 text-sm text-brand-gray">📍 {profile.location}</p>}
        {profile.interests.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-1">
            {profile.interests.map((t) => (
              <span key={t} className="rounded-full bg-light px-3 py-1 text-xs text-brand-gray">{t}</span>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-brand-gray">
          Miembro desde {new Date(profile.createdAt).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}
        </p>

        {member && !isMe && (
          <Button className="mt-4" onClick={() => navigate(`/comunidad/mensajes/${profile.referralCode}`)}>
            Enviar mensaje
          </Button>
        )}
      </div>

      {/* Estadísticas */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <Stat label="Posts" value={profile.stats?.posts ?? 0} />
        <Stat label="Grupos" value={profile.stats?.groups ?? 0} />
        <Stat label="Referidos" value={profile.stats?.referrals ?? 0} />
      </div>

      {/* Feed del perfil */}
      <h2 className="mt-6 mb-3 text-lg font-semibold text-primary">Publicaciones</h2>
      <div className="space-y-4">
        {(posts ?? []).length === 0 && (
          <p className="rounded-2xl bg-white p-6 text-center text-brand-gray ring-1 ring-black/5">Sin publicaciones aún.</p>
        )}
        {(posts ?? []).map((p) => (
          <div key={p.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <p className="whitespace-pre-wrap text-primary/90">{p.content}</p>
            {p.images.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-1 overflow-hidden rounded-xl">
                {p.images.slice(0, 4).map((img, i) => (
                  <img key={i} src={cld(img, { width: 600 })} alt="" className="max-h-72 w-full object-cover" />
                ))}
              </div>
            )}
            <span className="mt-2 block text-xs text-brand-gray">{timeAgo(p.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-black/5">
      <p className="font-serif text-2xl font-bold text-primary">{value}</p>
      <p className="text-xs uppercase tracking-wider text-brand-gray">{label}</p>
    </div>
  );
}

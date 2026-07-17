import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from './Avatar';
import { Badge } from '@/components/ui/Badge';
import type { CommunityMember } from '@shared/types';

export function MemberCard({ member }: { member: CommunityMember }) {
  const isElite = member.status === 'ELITE';
  return (
    <div className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
      <Avatar name={member.fullName} avatarUrl={member.avatarUrl} size="lg" className="mx-auto" />
      <h3 className="mt-3 font-semibold text-primary">{member.fullName}</h3>
      <Badge variant={isElite ? 'gold' : 'light'} className="mt-1">{isElite ? 'Elite' : 'Premiere'}</Badge>
      {member.location && <p className="mt-2 flex items-center justify-center gap-1 text-xs text-brand-gray"><MapPin className="h-3 w-3" strokeWidth={1.8} /> {member.location}</p>}
      {member.bio && <p className="mt-2 line-clamp-2 text-sm text-brand-gray">{member.bio}</p>}
      {member.interests.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1">
          {member.interests.slice(0, 3).map((t) => (
            <span key={t} className="rounded-full bg-light px-2 py-0.5 text-xs text-brand-gray">{t}</span>
          ))}
        </div>
      )}
      <Link
        to={`/comunidad/perfil/${member.referralCode}`}
        className="mt-4 inline-block rounded-full bg-light px-4 py-2 text-sm font-medium text-primary hover:bg-secondary"
      >
        Ver perfil
      </Link>
    </div>
  );
}

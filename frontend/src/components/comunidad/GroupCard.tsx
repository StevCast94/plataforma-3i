import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { cld } from '@/lib/cloudinary';
import type { CommunityGroup } from '@shared/types';

export function GroupCard({ group }: { group: CommunityGroup }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <div className="h-28 bg-gradient-to-br from-primary to-accent">
        {group.coverImage && <img src={cld(group.coverImage, { width: 600 })} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-primary">{group.name}</h3>
          <Badge variant="light">{group.privacy === 'private' ? 'Privado' : 'Público'}</Badge>
        </div>
        {group.description && <p className="mt-1 line-clamp-2 text-sm text-brand-gray">{group.description}</p>}
        <p className="mt-2 text-xs text-brand-gray">{group.memberCount} miembros · {group.postCount} posts</p>
        <Link
          to={`/comunidad/grupos/${group.slug}`}
          className="mt-4 inline-block rounded-full bg-light px-4 py-2 text-sm font-medium text-primary hover:bg-secondary"
        >
          {group.isMember ? 'Ver grupo' : 'Explorar'}
        </Link>
      </div>
    </div>
  );
}

import { initials, cn } from '@/lib/utils';
import { cld } from '@/lib/cloudinary';
import type { SocialAuthor } from '@shared/types';

const SIZES = { sm: 'h-8 w-8 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-24 w-24 text-2xl' };

// Color de fondo determinístico a partir del nombre.
const COLORS = ['bg-amber-700', 'bg-emerald-700', 'bg-sky-700', 'bg-rose-700', 'bg-violet-700', 'bg-primary'];
function colorFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % COLORS.length;
  return COLORS[h];
}

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}

export function Avatar({ name, avatarUrl, size = 'md', className }: AvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={cld(avatarUrl, { width: 200 })}
        alt={name}
        className={cn('flex-none rounded-full object-cover', SIZES[size], className)}
      />
    );
  }
  return (
    <div
      className={cn(
        'flex flex-none items-center justify-center rounded-full font-semibold text-white',
        SIZES[size],
        colorFor(name),
        className,
      )}
    >
      {initials(name) || '?'}
    </div>
  );
}

/** Avatar a partir de un SocialAuthor (con badge opcional de estatus). */
export function AuthorAvatar({ author, size }: { author: SocialAuthor | null; size?: keyof typeof SIZES }) {
  return <Avatar name={author?.fullName ?? '?'} avatarUrl={author?.avatarUrl} size={size} />;
}

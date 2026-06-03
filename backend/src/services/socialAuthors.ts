import { prisma } from '../prisma';

export interface Author {
  id: string;
  fullName: string;
  referralCode: string;
  status: string;
  avatarUrl: string | null;
  eliteBy: string | null;
}

/** Resuelve la info pública de autores (miembros) por sus ids, en un solo query. */
export async function getAuthors(userIds: string[]): Promise<Map<string, Author>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const members = await prisma.referralMember.findMany({
    where: { id: { in: unique } },
    select: {
      id: true,
      fullName: true,
      referralCode: true,
      status: true,
      avatarUrl: true,
      eliteBy: true,
    },
  });

  return new Map(members.map((m) => [m.id, m as Author]));
}

/** Conveniencia: autor de un solo id. */
export async function getAuthor(userId: string): Promise<Author | null> {
  const map = await getAuthors([userId]);
  return map.get(userId) ?? null;
}

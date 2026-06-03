import { Router } from 'express';
import { prisma } from '../prisma';

export const communityMemberRoutes = Router();

// GET /api/community/members?q=&status=&interest=
communityMemberRoutes.get('/', async (req, res) => {
  const { q, status, interest } = req.query;
  const members = await prisma.referralMember.findMany({
    where: {
      status: status ? (status as never) : { not: 'SUSPENDED' },
      ...(q
        ? {
            OR: [
              { fullName: { contains: String(q), mode: 'insensitive' as const } },
              { location: { contains: String(q), mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(interest ? { interests: { has: String(interest) } } : {}),
    },
    select: {
      fullName: true,
      referralCode: true,
      status: true,
      bio: true,
      avatarUrl: true,
      location: true,
      interests: true,
      eliteBy: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(members);
});

// GET /api/community/members/:code — perfil público + estadísticas + posts
communityMemberRoutes.get('/:code', async (req, res) => {
  const member = await prisma.referralMember.findUnique({
    where: { referralCode: req.params.code },
    select: {
      id: true,
      fullName: true,
      referralCode: true,
      status: true,
      bio: true,
      avatarUrl: true,
      location: true,
      interests: true,
      eliteBy: true,
      totalReferrals: true,
      createdAt: true,
    },
  });
  if (!member) {
    res.status(404).json({ error: 'Miembro no encontrado' });
    return;
  }

  const [postCount, groupCount] = await Promise.all([
    prisma.socialPost.count({ where: { userId: member.id } }),
    prisma.socialGroupMember.count({ where: { userId: member.id } }),
  ]);

  const { id: _id, ...publicProfile } = member;
  res.json({
    ...publicProfile,
    stats: { posts: postCount, groups: groupCount, referrals: member.totalReferrals },
  });
});

// GET /api/community/members/:code/posts — feed del perfil
communityMemberRoutes.get('/:code/posts', async (req, res) => {
  const member = await prisma.referralMember.findUnique({
    where: { referralCode: req.params.code },
    select: { id: true },
  });
  if (!member) {
    res.status(404).json({ error: 'Miembro no encontrado' });
    return;
  }
  const posts = await prisma.socialPost.findMany({
    where: { userId: member.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  res.json(posts);
});

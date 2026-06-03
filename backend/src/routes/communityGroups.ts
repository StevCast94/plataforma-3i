import { Router } from 'express';
import { prisma } from '../prisma';
import { authMember, optionalMember, type MemberRequest } from '../middleware/authMember';
import { asyncHandler } from '../lib/asyncHandler';

export const communityGroupRoutes = Router();

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// GET /api/community/groups
communityGroupRoutes.get('/', optionalMember, asyncHandler(async (req: MemberRequest, res) => {
  const groups = await prisma.socialGroup.findMany({
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { members: true, posts: true } } },
  });
  const myGroups = req.memberId
    ? new Set(
        (await prisma.socialGroupMember.findMany({
          where: { userId: req.memberId },
          select: { groupId: true },
        })).map((m) => m.groupId),
      )
    : new Set<string>();

  res.json(
    groups.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      description: g.description,
      coverImage: g.coverImage,
      privacy: g.privacy,
      memberCount: g._count.members,
      postCount: g._count.posts,
      isMember: myGroups.has(g.id),
    })),
  );
}));

// GET /api/community/groups/:slug
communityGroupRoutes.get('/:slug', optionalMember, asyncHandler(async (req: MemberRequest, res) => {
  const group = await prisma.socialGroup.findUnique({
    where: { slug: req.params.slug },
    include: { _count: { select: { members: true, posts: true } } },
  });
  if (!group) {
    res.status(404).json({ error: 'Grupo no encontrado' });
    return;
  }
  const isMember = req.memberId
    ? !!(await prisma.socialGroupMember.findUnique({
        where: { groupId_userId: { groupId: group.id, userId: req.memberId } },
      }))
    : false;

  res.json({
    id: group.id,
    name: group.name,
    slug: group.slug,
    description: group.description,
    coverImage: group.coverImage,
    privacy: group.privacy,
    createdBy: group.createdBy,
    memberCount: group._count.members,
    postCount: group._count.posts,
    isMember,
  });
}));

// POST /api/community/groups (🔒)
communityGroupRoutes.post('/', authMember, async (req: MemberRequest, res) => {
  try {
    const { name, description, privacy, coverImage } = req.body ?? {};
    if (!name || !String(name).trim()) {
      res.status(400).json({ error: 'El nombre es requerido' });
      return;
    }
    const base = slugify(String(name));
    const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const group = await prisma.socialGroup.create({
      data: {
        name: String(name).trim(),
        slug,
        description: description ? String(description) : null,
        privacy: privacy === 'private' ? 'private' : 'public',
        coverImage: coverImage ? String(coverImage) : null,
        createdBy: req.memberId!,
        members: { create: { userId: req.memberId!, role: 'admin' } },
      },
    });
    res.status(201).json(group);
  } catch (err) {
    console.error('POST groups', err);
    res.status(400).json({ error: 'Error al crear grupo' });
  }
});

// POST /api/community/groups/:id/join (🔒)
communityGroupRoutes.post('/:id/join', authMember, async (req: MemberRequest, res) => {
  try {
    await prisma.socialGroupMember.upsert({
      where: { groupId_userId: { groupId: req.params.id, userId: req.memberId! } },
      create: { groupId: req.params.id, userId: req.memberId! },
      update: {},
    });
    res.json({ ok: true, isMember: true });
  } catch (err) {
    console.error('POST join', err);
    res.status(400).json({ error: 'Error al unirse' });
  }
});

// DELETE /api/community/groups/:id/leave (🔒)
communityGroupRoutes.delete('/:id/leave', authMember, asyncHandler(async (req: MemberRequest, res) => {
  await prisma.socialGroupMember.deleteMany({
    where: { groupId: req.params.id, userId: req.memberId! },
  });
  res.json({ ok: true, isMember: false });
}));

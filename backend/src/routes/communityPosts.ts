import { Router } from 'express';
import { prisma } from '../prisma';
import { authMember, optionalMember, type MemberRequest } from '../middleware/authMember';
import { getAuthors } from '../services/socialAuthors';
import { asyncHandler } from '../lib/asyncHandler';

export const communityPostRoutes = Router();

const REACTIONS = ['like', 'love', 'useful', 'interesting', 'celebrate'];
const MAX_IMAGES = 4;

/** Da forma a una lista de posts incluyendo autor, conteos y la reacción propia. */
async function shapePosts(
  posts: Awaited<ReturnType<typeof prisma.socialPost.findMany>>,
  viewerId?: string,
) {
  const authors = await getAuthors(posts.map((p) => p.userId));
  const ids = posts.map((p) => p.id);

  const [reactions, comments, mine] = await Promise.all([
    prisma.socialReaction.groupBy({
      by: ['postId', 'type'],
      where: { postId: { in: ids } },
      _count: true,
    }),
    prisma.socialComment.groupBy({
      by: ['postId'],
      where: { postId: { in: ids } },
      _count: true,
    }),
    viewerId
      ? prisma.socialReaction.findMany({
          where: { postId: { in: ids }, userId: viewerId },
          select: { postId: true, type: true },
        })
      : Promise.resolve([]),
  ]);

  const reactionMap: Record<string, Record<string, number>> = {};
  for (const r of reactions) {
    reactionMap[r.postId] ??= {};
    reactionMap[r.postId][r.type] = r._count;
  }
  const commentMap = new Map(comments.map((c) => [c.postId, c._count]));
  const mineMap = new Map(mine.map((m) => [m.postId, m.type]));

  return posts.map((p) => {
    const byType = reactionMap[p.id] ?? {};
    return {
      id: p.id,
      content: p.content,
      images: p.images,
      linkUrl: p.linkUrl,
      linkPreview: p.linkPreview,
      groupId: p.groupId,
      pinned: p.pinned,
      createdAt: p.createdAt,
      author: authors.get(p.userId) ?? null,
      reactionsByType: byType,
      reactionCount: Object.values(byType).reduce((a, b) => a + b, 0),
      commentCount: commentMap.get(p.id) ?? 0,
      myReaction: mineMap.get(p.id) ?? null,
    };
  });
}

// GET /api/community/posts?tab=recent|trending|mine&groupId=&page=
communityPostRoutes.get('/', optionalMember, async (req: MemberRequest, res) => {
  try {
    const tab = String(req.query.tab ?? 'recent');
    const groupId = req.query.groupId ? String(req.query.groupId) : undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = 10;

    // "mine" = posts de los grupos del miembro
    let where: Record<string, unknown> = { ...(groupId ? { groupId } : {}) };
    if (tab === 'mine' && req.memberId) {
      const memberships = await prisma.socialGroupMember.findMany({
        where: { userId: req.memberId },
        select: { groupId: true },
      });
      where = { groupId: { in: memberships.map((m) => m.groupId) } };
    }

    if (tab === 'trending') {
      // Más reaccionados en los últimos 7 días.
      const weekAgo = new Date(Date.now() - 7 * 86400000);
      const top = await prisma.socialReaction.groupBy({
        by: ['postId'],
        where: { createdAt: { gte: weekAgo } },
        _count: true,
        orderBy: { _count: { postId: 'desc' } },
        take: pageSize,
        skip: (page - 1) * pageSize,
      });
      const posts = await prisma.socialPost.findMany({
        where: { id: { in: top.map((t) => t.postId) }, ...where },
      });
      // Mantener el orden por reacciones.
      const order = new Map(top.map((t, i) => [t.postId, i]));
      posts.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
      res.json({ posts: await shapePosts(posts, req.memberId), page, hasMore: top.length === pageSize });
      return;
    }

    const posts = await prisma.socialPost.findMany({
      where,
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    res.json({
      posts: await shapePosts(posts, req.memberId),
      page,
      hasMore: posts.length === pageSize,
    });
  } catch (err) {
    console.error('GET /api/community/posts', err);
    res.status(500).json({ error: 'Error al cargar el feed' });
  }
});

// GET /api/community/posts/:id — detalle con comentarios
communityPostRoutes.get('/:id', optionalMember, asyncHandler(async (req: MemberRequest, res) => {
  const post = await prisma.socialPost.findUnique({ where: { id: req.params.id } });
  if (!post) {
    res.status(404).json({ error: 'Post no encontrado' });
    return;
  }
  const [shaped] = await shapePosts([post], req.memberId);
  res.json(shaped);
}));

// POST /api/community/posts — crear (🔒)
communityPostRoutes.post('/', authMember, async (req: MemberRequest, res) => {
  try {
    const { content, images, linkUrl, linkPreview, groupId } = req.body ?? {};
    if (!content || !String(content).trim()) {
      res.status(400).json({ error: 'El contenido es requerido' });
      return;
    }
    const post = await prisma.socialPost.create({
      data: {
        userId: req.memberId!,
        content: String(content).trim(),
        images: Array.isArray(images) ? images.slice(0, MAX_IMAGES) : [],
        linkUrl: linkUrl ? String(linkUrl) : null,
        linkPreview: linkPreview ?? undefined,
        groupId: groupId ? String(groupId) : null,
      },
    });
    const [shaped] = await shapePosts([post], req.memberId);
    res.status(201).json(shaped);
  } catch (err) {
    console.error('POST /api/community/posts', err);
    res.status(400).json({ error: 'Error al publicar' });
  }
});

// DELETE /api/community/posts/:id — propio (🔒)
communityPostRoutes.delete('/:id', authMember, asyncHandler(async (req: MemberRequest, res) => {
  const post = await prisma.socialPost.findUnique({ where: { id: req.params.id }, select: { userId: true } });
  if (!post) {
    res.status(404).json({ error: 'Post no encontrado' });
    return;
  }
  if (post.userId !== req.memberId) {
    res.status(403).json({ error: 'No puedes eliminar este post' });
    return;
  }
  await prisma.socialPost.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
}));

// GET /api/community/posts/:id/comments
communityPostRoutes.get('/:id/comments', asyncHandler(async (req, res) => {
  const comments = await prisma.socialComment.findMany({
    where: { postId: req.params.id },
    orderBy: { createdAt: 'asc' },
  });
  const authors = await getAuthors(comments.map((c) => c.userId));

  // Armar árbol de 1 nivel (comentarios + replies).
  const shape = (c: (typeof comments)[number]) => ({
    id: c.id,
    content: c.content,
    parentId: c.parentId,
    createdAt: c.createdAt,
    author: authors.get(c.userId) ?? null,
  });
  const roots = comments.filter((c) => !c.parentId).map((c) => ({
    ...shape(c),
    replies: comments.filter((r) => r.parentId === c.id).map(shape),
  }));
  res.json(roots);
}));

// POST /api/community/posts/:id/comments (🔒)
communityPostRoutes.post('/:id/comments', authMember, async (req: MemberRequest, res) => {
  try {
    const { content, parentId } = req.body ?? {};
    if (!content || !String(content).trim()) {
      res.status(400).json({ error: 'El comentario no puede estar vacío' });
      return;
    }
    const comment = await prisma.socialComment.create({
      data: {
        postId: req.params.id,
        userId: req.memberId!,
        content: String(content).trim(),
        parentId: parentId ? String(parentId) : null,
      },
    });
    const authors = await getAuthors([comment.userId]);
    res.status(201).json({
      id: comment.id,
      content: comment.content,
      parentId: comment.parentId,
      createdAt: comment.createdAt,
      author: authors.get(comment.userId) ?? null,
      replies: [],
    });
  } catch (err) {
    console.error('POST comments', err);
    res.status(400).json({ error: 'Error al comentar' });
  }
});

// POST /api/community/posts/:id/react — toggle (🔒)
communityPostRoutes.post('/:id/react', authMember, async (req: MemberRequest, res) => {
  try {
    const { type } = req.body ?? {};
    if (!REACTIONS.includes(type)) {
      res.status(400).json({ error: 'Tipo de reacción inválido' });
      return;
    }
    const existing = await prisma.socialReaction.findUnique({
      where: { postId_userId: { postId: req.params.id, userId: req.memberId! } },
    });

    if (existing && existing.type === type) {
      await prisma.socialReaction.delete({ where: { id: existing.id } });
      res.json({ myReaction: null });
      return;
    }
    await prisma.socialReaction.upsert({
      where: { postId_userId: { postId: req.params.id, userId: req.memberId! } },
      create: { postId: req.params.id, userId: req.memberId!, type },
      update: { type },
    });
    res.json({ myReaction: type });
  } catch (err) {
    console.error('POST react', err);
    res.status(400).json({ error: 'Error al reaccionar' });
  }
});

// DELETE /api/community/comments/:id — propio (🔒)  [montado aparte]
export const communityCommentRoutes = Router();
communityCommentRoutes.delete('/:id', authMember, asyncHandler(async (req: MemberRequest, res) => {
  const comment = await prisma.socialComment.findUnique({
    where: { id: req.params.id },
    select: { userId: true },
  });
  if (!comment) {
    res.status(404).json({ error: 'Comentario no encontrado' });
    return;
  }
  if (comment.userId !== req.memberId) {
    res.status(403).json({ error: 'No autorizado' });
    return;
  }
  await prisma.socialComment.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
}));

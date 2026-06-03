import { Router } from 'express';
import { prisma } from '../prisma';
import { authMember, type MemberRequest } from '../middleware/authMember';
import { getAuthors } from '../services/socialAuthors';
import { asyncHandler } from '../lib/asyncHandler';

export const communityMessageRoutes = Router();
communityMessageRoutes.use(authMember);

// El parámetro de "otro usuario" es su referralCode (lo que conoce el frontend).
async function resolveMember(code: string) {
  return prisma.referralMember.findUnique({
    where: { referralCode: code },
    select: { id: true },
  });
}

// GET /api/community/messages — lista de conversaciones
communityMessageRoutes.get('/', asyncHandler(async (req: MemberRequest, res) => {
  const me = req.memberId!;
  const messages = await prisma.directMessage.findMany({
    where: { OR: [{ senderId: me }, { receiverId: me }] },
    orderBy: { createdAt: 'desc' },
  });

  // Agrupar por el otro participante.
  const convos = new Map<string, { lastMessage: string; lastAt: Date; unread: number }>();
  for (const m of messages) {
    const other = m.senderId === me ? m.receiverId : m.senderId;
    if (!convos.has(other)) {
      convos.set(other, { lastMessage: m.content, lastAt: m.createdAt, unread: 0 });
    }
    if (m.receiverId === me && !m.read) {
      convos.get(other)!.unread++;
    }
  }

  const authors = await getAuthors([...convos.keys()]);
  res.json(
    [...convos.entries()].map(([userId, c]) => ({
      user: authors.get(userId) ?? null,
      lastMessage: c.lastMessage,
      lastAt: c.lastAt,
      unread: c.unread,
    })),
  );
}));

// GET /api/community/messages/:code — mensajes con un usuario (marca leídos)
communityMessageRoutes.get('/:code', asyncHandler(async (req: MemberRequest, res) => {
  const me = req.memberId!;
  const other = await resolveMember(req.params.code);
  if (!other) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: me, receiverId: other.id },
        { senderId: other.id, receiverId: me },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: 200,
  });

  // Marcar como leídos los recibidos.
  await prisma.directMessage.updateMany({
    where: { senderId: other.id, receiverId: me, read: false },
    data: { read: true },
  });

  const authors = await getAuthors([other.id]);
  res.json({
    user: authors.get(other.id) ?? null,
    messages: messages.map((m) => ({
      id: m.id,
      content: m.content,
      mine: m.senderId === me,
      createdAt: m.createdAt,
    })),
  });
}));

// POST /api/community/messages/:code — enviar
communityMessageRoutes.post('/:code', async (req: MemberRequest, res) => {
  try {
    const me = req.memberId!;
    const other = await resolveMember(req.params.code);
    if (!other) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    if (other.id === me) {
      res.status(400).json({ error: 'No puedes enviarte mensajes a ti mismo' });
      return;
    }
    const { content } = req.body ?? {};
    if (!content || !String(content).trim()) {
      res.status(400).json({ error: 'El mensaje no puede estar vacío' });
      return;
    }
    const message = await prisma.directMessage.create({
      data: { senderId: me, receiverId: other.id, content: String(content).trim() },
    });
    res.status(201).json({ id: message.id, content: message.content, mine: true, createdAt: message.createdAt });
  } catch (err) {
    console.error('POST messages', err);
    res.status(400).json({ error: 'Error al enviar el mensaje' });
  }
});

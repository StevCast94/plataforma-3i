import { Router } from 'express';
import { prisma } from '../prisma';
import { authMember, optionalMember, type MemberRequest } from '../middleware/authMember';
import { getAuthors } from '../services/socialAuthors';
import { asyncHandler } from '../lib/asyncHandler';

export const communityEventRoutes = Router();

function eventPhase(start: Date, end: Date | null): 'upcoming' | 'ongoing' | 'past' {
  const now = Date.now();
  const s = start.getTime();
  const e = end ? end.getTime() : s + 3 * 3600000;
  if (now < s) return 'upcoming';
  if (now > e) return 'past';
  return 'ongoing';
}

// GET /api/community/events
communityEventRoutes.get('/', optionalMember, asyncHandler(async (req: MemberRequest, res) => {
  const events = await prisma.socialEvent.findMany({
    orderBy: { startDate: 'asc' },
    include: {
      group: { select: { name: true, slug: true } },
      _count: { select: { attendees: true } },
    },
  });
  const myRsvp = req.memberId
    ? new Map(
        (await prisma.socialEventAttendee.findMany({
          where: { userId: req.memberId },
          select: { eventId: true, status: true },
        })).map((a) => [a.eventId, a.status]),
      )
    : new Map<string, string>();

  res.json(
    events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
      coverImage: e.coverImage,
      group: e.group,
      attendeeCount: e._count.attendees,
      phase: eventPhase(e.startDate, e.endDate),
      myStatus: myRsvp.get(e.id) ?? null,
    })),
  );
}));

// GET /api/community/events/:id
communityEventRoutes.get('/:id', optionalMember, asyncHandler(async (req: MemberRequest, res) => {
  const event = await prisma.socialEvent.findUnique({
    where: { id: req.params.id },
    include: {
      group: { select: { name: true, slug: true } },
      attendees: true,
    },
  });
  if (!event) {
    res.status(404).json({ error: 'Evento no encontrado' });
    return;
  }
  const going = event.attendees.filter((a) => a.status === 'going');
  const authors = await getAuthors(going.map((a) => a.userId));
  const counts = { going: 0, maybe: 0, not_going: 0 } as Record<string, number>;
  for (const a of event.attendees) counts[a.status] = (counts[a.status] ?? 0) + 1;

  res.json({
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    startDate: event.startDate,
    endDate: event.endDate,
    coverImage: event.coverImage,
    group: event.group,
    phase: eventPhase(event.startDate, event.endDate),
    counts,
    attendees: going.map((a) => authors.get(a.userId)).filter(Boolean),
    myStatus: req.memberId
      ? event.attendees.find((a) => a.userId === req.memberId)?.status ?? null
      : null,
  });
}));

// POST /api/community/events (🔒 admin del grupo)
communityEventRoutes.post('/', authMember, async (req: MemberRequest, res) => {
  try {
    const { groupId, title, description, location, startDate, endDate, coverImage } = req.body ?? {};
    if (!groupId || !title || !description || !startDate) {
      res.status(400).json({ error: 'groupId, título, descripción y fecha requeridos' });
      return;
    }
    // Solo admin/moderador del grupo puede crear eventos.
    const membership = await prisma.socialGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId: req.memberId! } },
    });
    if (!membership || !['admin', 'moderator'].includes(membership.role)) {
      res.status(403).json({ error: 'Solo administradores del grupo pueden crear eventos' });
      return;
    }
    const event = await prisma.socialEvent.create({
      data: {
        groupId,
        title: String(title).trim(),
        description: String(description).trim(),
        location: location ? String(location) : null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        coverImage: coverImage ? String(coverImage) : null,
        createdBy: req.memberId!,
      },
    });
    res.status(201).json(event);
  } catch (err) {
    console.error('POST events', err);
    res.status(400).json({ error: 'Error al crear evento' });
  }
});

// POST /api/community/events/:id/rsvp (🔒)
communityEventRoutes.post('/:id/rsvp', authMember, async (req: MemberRequest, res) => {
  try {
    const { status } = req.body ?? {};
    if (!['going', 'maybe', 'not_going'].includes(status)) {
      res.status(400).json({ error: 'Estado de RSVP inválido' });
      return;
    }
    await prisma.socialEventAttendee.upsert({
      where: { eventId_userId: { eventId: req.params.id, userId: req.memberId! } },
      create: { eventId: req.params.id, userId: req.memberId!, status },
      update: { status },
    });
    res.json({ myStatus: status });
  } catch (err) {
    console.error('POST rsvp', err);
    res.status(400).json({ error: 'Error al confirmar asistencia' });
  }
});

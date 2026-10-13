import crypto from 'crypto';
import { prisma } from '../prisma';
import { templateById } from '../lib/serviceCatalog';
import { publicBaseUrl } from '../lib/publicUrl';
import { sendEmail } from '../travel/email';

// Expedientes de servicios integrales: se abren desde una plantilla de trámite,
// avanzan etapa por etapa y el cliente los sigue por un enlace privado.

export const newToken = () => crypto.randomBytes(18).toString('base64url');
const DAY = 86_400_000;

export const caseLink = (token: string, lang = 'es') => `${publicBaseUrl()}${lang === 'en' ? '/en' : ''}/seguimiento/${token}`;
export const quoteLink = (token: string, lang = 'es') => `${publicBaseUrl()}${lang === 'en' ? '/en' : ''}/propuesta-servicios/${token}`;

/** Enlace de WhatsApp con un mensaje listo para el cliente (lo envía el equipo). */
export function waLink(phone: string | null | undefined, text: string): string | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : null;
}

export async function logEvent(caseId: string, kind: string, text: string, by?: string | null, isPublic = false) {
  await prisma.caseEvent.create({ data: { caseId, kind, text, by: by ?? null, public: isPublic } });
}

export interface NewCase {
  templateId: string;
  title?: string;
  clientName: string;
  clientPhone?: string | null;
  clientEmail?: string | null;
  lang?: string;
  requestId?: string | null;
  quoteId?: string | null;
  projectId?: string | null;
  ownerId?: string | null;
  /** Plan de cobros: [{ label, pct }] sobre `total`. */
  milestones?: { label: string; pct: number }[] | null;
  total?: number | null;
  by?: string | null;
}

export async function createCase(input: NewCase) {
  const tpl = templateById(input.templateId);
  const now = Date.now();
  const first = tpl.steps[0];
  const c = await prisma.serviceCase.create({
    data: {
      token: newToken(),
      templateId: tpl.id,
      title: input.title?.trim() || tpl.name,
      clientName: input.clientName,
      clientPhone: input.clientPhone ?? null,
      clientEmail: input.clientEmail ?? null,
      lang: input.lang === 'en' ? 'en' : 'es',
      requestId: input.requestId ?? null,
      quoteId: input.quoteId ?? null,
      projectId: input.projectId ?? null,
      ownerId: input.ownerId ?? null,
      dueDate: new Date(now + tpl.steps.reduce((s, x) => s + (x.dueDays ?? 0), 0) * DAY),
      steps: {
        create: tpl.steps.map((st, i) => ({
          order: i + 1,
          title: input.lang === 'en' ? st.titleEn : st.title,
          party: st.party,
          institution: st.institution ?? null,
          requirements: st.requirements ?? [],
          dueDays: st.dueDays ?? null,
          status: i === 0 ? 'ACTIVE' : 'PENDING',
          startedAt: i === 0 ? new Date(now) : null,
          dueDate: i === 0 && first.dueDays ? new Date(now + first.dueDays * DAY) : null,
        })),
      },
      payments:
        input.milestones?.length && input.total
          ? { create: input.milestones.map((m) => ({ label: m.label, amount: Math.round(input.total! * m.pct) / 100 })) }
          : undefined,
    },
  });
  await logEvent(c.id, 'created', `Expediente abierto: ${c.title}`, input.by, true);
  return c;
}

/** Cambia el estado de una etapa. Al cerrarla, activa la siguiente pendiente y avisa al cliente. */
export async function setStepStatus(stepId: string, status: string, by?: string | null) {
  const step = await prisma.caseStep.findUnique({ where: { id: stepId }, include: { case: true } });
  if (!step) throw new Error('Etapa no encontrada');
  const now = new Date();
  await prisma.caseStep.update({
    where: { id: stepId },
    data: {
      status,
      ...(status === 'ACTIVE' && !step.startedAt ? { startedAt: now, dueDate: step.dueDate ?? (step.dueDays ? new Date(now.getTime() + step.dueDays * DAY) : null) } : {}),
      ...(status === 'DONE' || status === 'SKIPPED' ? { doneAt: now } : { doneAt: null }),
    },
  });
  if (status === 'DONE' || status === 'SKIPPED') {
    await logEvent(step.caseId, 'step', `${status === 'DONE' ? 'Etapa cumplida' : 'Etapa omitida'}: ${step.title}`, by, true);
    const active = await prisma.caseStep.count({ where: { caseId: step.caseId, status: 'ACTIVE' } });
    if (!active) {
      const next = await prisma.caseStep.findFirst({ where: { caseId: step.caseId, status: 'PENDING' }, orderBy: { order: 'asc' } });
      if (next) {
        await prisma.caseStep.update({
          where: { id: next.id },
          data: { status: 'ACTIVE', startedAt: now, dueDate: next.dueDate ?? (next.dueDays ? new Date(now.getTime() + next.dueDays * DAY) : null) },
        });
        await logEvent(step.caseId, 'step', `En curso: ${next.title}`, by, true);
        await notifyClient(step.caseId, next.title);
      } else {
        await prisma.serviceCase.update({ where: { id: step.caseId }, data: { status: 'DONE' } });
        await logEvent(step.caseId, 'status', 'Expediente terminado', by, true);
        await notifyClient(step.caseId, null);
      }
    }
  } else if (status === 'ACTIVE') {
    await logEvent(step.caseId, 'step', `En curso: ${step.title}`, by, true);
  }
}

/** Aviso por correo al cliente (si hay correo y Resend configurado). WhatsApp lo envía el equipo con un clic. */
export async function notifyClient(caseId: string, stepTitle: string | null) {
  const c = await prisma.serviceCase.findUnique({ where: { id: caseId } });
  if (!c?.clientEmail) return;
  const en = c.lang === 'en';
  const link = caseLink(c.token, c.lang);
  const subject = en ? `Update on your case: ${c.title}` : `Novedades de tu trámite: ${c.title}`;
  const line = stepTitle
    ? en ? `Your case moved to a new stage: <b>${stepTitle}</b>.` : `Tu trámite pasó a una nueva etapa: <b>${stepTitle}</b>.`
    : en ? 'Your case is complete.' : 'Tu trámite está terminado.';
  await sendEmail({
    to: c.clientEmail,
    subject,
    html: `<p>${en ? 'Hi' : 'Hola'} ${c.clientName},</p><p>${line}</p><p><a href="${link}">${en ? 'See the details' : 'Ver el detalle'}</a></p><p>Grupo 3i</p>`,
  }).catch((e) => console.error('notifyClient', e));
}

/** Mensaje de WhatsApp para avisar al cliente del estado actual. */
export async function clientWhatsapp(caseId: string) {
  const c = await prisma.serviceCase.findUnique({ where: { id: caseId }, include: { steps: { where: { status: 'ACTIVE' }, orderBy: { order: 'asc' }, take: 1 } } });
  if (!c) return null;
  const en = c.lang === 'en';
  const step = c.steps[0]?.title;
  const text = en
    ? `Hi ${c.clientName}, here’s an update on «${c.title}»${step ? `: we’re now on «${step}»` : ''}. You can follow every step here: ${caseLink(c.token, 'en')}`
    : `Hola ${c.clientName}, te cuento cómo va «${c.title}»${step ? `: ahora estamos en «${step}»` : ''}. Puedes seguir cada etapa aquí: ${caseLink(c.token)}`;
  return waLink(c.clientPhone, text);
}

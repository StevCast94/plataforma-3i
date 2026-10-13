import { Router } from 'express';
import { prisma } from '../prisma';
import { refFromRequest } from './referral';
import { cleanUtm } from '../services/projectLeads';
import { cleanServices, SERVICE_NAMES, type ServiceId } from '../lib/serviceCatalog';
import { createCase, logEvent } from '../services/serviceCases';
import { sendPushToStaff } from '../services/push';
import { signedDocUrl, uploadCaseDocument } from '../lib/projectDocs';

// Servicios integrales — rutas públicas: solicitud de propuesta, propuesta privada
// (ver y aceptar) y seguimiento del expediente por enlace privado.

export const serviceRoutes = Router();

const str = (v: unknown, max = 200) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

// POST /api/services/request — formulario «Solicita una propuesta»
serviceRoutes.post('/request', async (req, res) => {
  const b = req.body ?? {};
  const en = b.lang === 'en';
  if (b.website) {
    res.json({ ok: true }); // trampa para bots
    return;
  }
  const name = str(b.name, 120);
  const phone = str(b.phone, 40);
  const services = cleanServices(b.services);
  if (!name || !phone || phone.replace(/\D/g, '').length < 7) {
    res.status(400).json({ error: en ? 'Please enter your name and WhatsApp.' : 'Escribe tu nombre y tu WhatsApp.' });
    return;
  }
  if (!services.length) {
    res.status(400).json({ error: en ? 'Pick at least one service.' : 'Elige al menos un servicio.' });
    return;
  }
  try {
    const r = await prisma.serviceRequest.create({
      data: {
        name,
        phone,
        services,
        email: str(b.email, 160),
        company: str(b.company, 160),
        location: str(b.location, 160),
        message: str(b.message, 4000),
        lang: en ? 'en' : 'es',
        utm: (cleanUtm(b.utm) as object | null) ?? undefined,
        referralCode: refFromRequest(req) ?? null,
      },
    });
    await sendPushToStaff({
      title: 'Nueva solicitud de servicios',
      body: `${name}: ${services.map((s) => SERVICE_NAMES[s as ServiceId]).join(', ')}`,
      link: '/admin/servicios',
    }).catch(() => {});
    res.status(201).json({ ok: true, id: r.id });
  } catch (err) {
    console.error('POST /api/services/request', err);
    res.status(500).json({ error: en ? 'Something went wrong. Please try again.' : 'No se pudo enviar. Inténtalo de nuevo.' });
  }
});

// GET /api/services/quote/:token — propuesta privada (marca «vista»)
serviceRoutes.get('/quote/:token', async (req, res) => {
  const q = await prisma.serviceQuote.findUnique({ where: { token: req.params.token }, include: { cases: { select: { token: true } } } });
  if (!q || q.status === 'DRAFT') {
    res.status(404).json({ error: 'Propuesta no encontrada' });
    return;
  }
  if (q.status === 'SENT') {
    await prisma.serviceQuote.update({ where: { id: q.id }, data: { status: 'VIEWED', viewedAt: new Date() } });
    await sendPushToStaff({ title: 'Propuesta abierta', body: `${q.clientName} abrió «${q.title}»`, link: '/admin/servicios' }).catch(() => {});
  }
  const expired = Boolean(q.validUntil && q.validUntil.getTime() < Date.now() && q.status !== 'ACCEPTED');
  res.json({
    number: q.number,
    title: q.title,
    clientName: q.clientName,
    lang: q.lang,
    items: q.items,
    taxRate: q.taxRate,
    subtotal: q.subtotal,
    total: q.total,
    milestones: q.milestones,
    terms: q.terms,
    validUntil: q.validUntil,
    status: expired ? 'EXPIRED' : q.status === 'SENT' ? 'VIEWED' : q.status,
    acceptedAt: q.acceptedAt,
    acceptedBy: q.acceptedBy,
    caseToken: q.cases[0]?.token ?? null,
    createdAt: q.createdAt,
  });
});

// POST /api/services/quote/:token/accept { name } — el cliente acepta y se abre el expediente
serviceRoutes.post('/quote/:token/accept', async (req, res) => {
  const q = await prisma.serviceQuote.findUnique({ where: { token: req.params.token } });
  const name = str(req.body?.name, 120);
  if (!q || !['SENT', 'VIEWED'].includes(q.status)) {
    res.status(400).json({ error: 'Esta propuesta ya no se puede aceptar' });
    return;
  }
  const en = q.lang === 'en';
  if (q.validUntil && q.validUntil.getTime() < Date.now()) {
    res.status(400).json({ error: en ? 'This proposal has expired.' : 'Esta propuesta venció.' });
    return;
  }
  if (!name) {
    res.status(400).json({ error: en ? 'Type your full name to accept.' : 'Escribe tu nombre completo para aceptar.' });
    return;
  }
  // Solo una aceptación aunque lleguen dos clics a la vez.
  const claimed = await prisma.serviceQuote.updateMany({
    where: { id: q.id, status: { in: ['SENT', 'VIEWED'] } },
    data: { status: 'ACCEPTED', acceptedAt: new Date(), acceptedBy: name },
  });
  if (!claimed.count) {
    res.status(400).json({ error: 'Esta propuesta ya fue aceptada' });
    return;
  }
  if (q.requestId) await prisma.serviceRequest.update({ where: { id: q.requestId }, data: { status: 'WON' } }).catch(() => {});
  const c = await createCase({
    templateId: q.templateId ?? 'generico',
    title: q.title,
    clientName: q.clientName,
    clientPhone: q.clientPhone,
    clientEmail: q.clientEmail,
    lang: q.lang,
    requestId: q.requestId,
    quoteId: q.id,
    milestones: (q.milestones as { label: string; pct: number }[] | null) ?? null,
    total: q.total,
    by: name,
  });
  await sendPushToStaff({ title: '¡Propuesta aceptada!', body: `${name} aceptó «${q.title}». Se abrió el expediente.`, link: `/admin/servicios/expedientes/${c.id}` }).catch(() => {});
  res.json({ ok: true, caseToken: c.token });
});

// GET /api/services/case/:token — seguimiento del cliente
serviceRoutes.get('/case/:token', async (req, res) => {
  const c = await prisma.serviceCase.findUnique({
    where: { token: req.params.token },
    include: {
      steps: { orderBy: { order: 'asc' } },
      documents: { where: { visible: true }, orderBy: { createdAt: 'desc' } },
      events: { where: { public: true }, orderBy: { createdAt: 'desc' }, take: 30 },
      payments: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!c) {
    res.status(404).json({ error: 'Expediente no encontrado' });
    return;
  }
  res.json({
    number: c.number,
    title: c.title,
    clientName: c.clientName,
    lang: c.lang,
    status: c.status,
    dueDate: c.dueDate,
    createdAt: c.createdAt,
    steps: c.steps.map((s) => ({
      id: s.id, order: s.order, title: s.title, description: s.description, party: s.party, institution: s.institution,
      requirements: s.requirements, status: s.status, dueDate: s.dueDate, startedAt: s.startedAt, doneAt: s.doneAt,
    })),
    documents: c.documents.map((d) => ({ id: d.id, name: d.name, uploadedBy: d.uploadedBy, createdAt: d.createdAt })),
    events: c.events.map((e) => ({ text: e.text, createdAt: e.createdAt })),
    payments: c.payments.map((p) => ({ label: p.label, amount: p.amount, dueDate: p.dueDate, paidAt: p.paidAt })),
  });
});

// GET /api/services/case/:token/documents/:id — descarga (URL firmada de corta vida)
serviceRoutes.get('/case/:token/documents/:id', async (req, res) => {
  const d = await prisma.caseDocument.findFirst({ where: { id: req.params.id, visible: true, case: { token: req.params.token } } });
  if (!d) {
    res.status(404).json({ error: 'Documento no encontrado' });
    return;
  }
  res.redirect(signedDocUrl(d.publicId, d.format));
});

// POST /api/services/case/:token/documents { dataUri, name, stepId? } — el cliente sube un documento
serviceRoutes.post('/case/:token/documents', async (req, res) => {
  const c = await prisma.serviceCase.findUnique({ where: { token: req.params.token } });
  const dataUri = String(req.body?.dataUri ?? '');
  if (!c || c.status === 'CANCELLED') {
    res.status(404).json({ error: 'Expediente no encontrado' });
    return;
  }
  const en = c.lang === 'en';
  if (!/^data:(image\/(png|jpe?g|webp)|application\/pdf);base64,/.test(dataUri)) {
    res.status(400).json({ error: en ? 'Upload a PDF or a photo.' : 'Sube un PDF o una foto.' });
    return;
  }
  const recent = await prisma.caseDocument.count({ where: { caseId: c.id, uploadedBy: 'client', createdAt: { gt: new Date(Date.now() - 3_600_000) } } });
  if (recent >= 20) {
    res.status(429).json({ error: en ? 'Too many files in a short time. Try again later.' : 'Demasiados archivos en poco tiempo. Intenta más tarde.' });
    return;
  }
  try {
    const up = await uploadCaseDocument(dataUri, c.id);
    const stepId = str(req.body?.stepId, 60);
    const step = stepId ? await prisma.caseStep.findFirst({ where: { id: stepId, caseId: c.id } }) : null;
    const name = str(req.body?.name, 160) ?? 'Documento';
    await prisma.caseDocument.create({ data: { caseId: c.id, stepId: step?.id ?? null, name, publicId: up.publicId, format: up.format, uploadedBy: 'client' } });
    await logEvent(c.id, 'document', `El cliente subió «${name}»${step ? ` (${step.title})` : ''}`, 'Cliente', true);
    await sendPushToStaff({ title: 'Documento del cliente', body: `${c.clientName} subió «${name}» en «${c.title}»`, link: `/admin/servicios/expedientes/${c.id}` }).catch(() => {});
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('POST /api/services/case/:token/documents', err);
    res.status(500).json({ error: en ? 'The file could not be uploaded.' : 'No se pudo subir el archivo.' });
  }
});

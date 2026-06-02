import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';

export const contactRoutes = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/contact  (público) -> guardar formulario de contacto
contactRoutes.post('/', async (req, res) => {
  try {
    const { name, email, phone, message, source, referralCode } = req.body ?? {};

    if (!name || !email || !message) {
      res.status(400).json({ error: 'name, email y message son requeridos' });
      return;
    }
    if (!EMAIL_RE.test(email)) {
      res.status(400).json({ error: 'Email inválido' });
      return;
    }

    const submission = await prisma.contactSubmission.create({
      data: {
        name: String(name).trim(),
        email: String(email).trim(),
        phone: phone ? String(phone).trim() : null,
        message: String(message).trim(),
        source: source ? String(source) : 'landing',
        referralCode: referralCode ? String(referralCode).trim() : null,
      },
    });

    res.status(201).json({ ok: true, id: submission.id });
  } catch (err) {
    console.error('POST /api/contact', err);
    res.status(500).json({ error: 'Error al enviar el formulario' });
  }
});

// GET /api/contact  (admin) -> listar submissions
contactRoutes.get('/', requireAdmin, async (_req, res) => {
  try {
    const rows = await prisma.contactSubmission.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(rows);
  } catch (err) {
    console.error('GET /api/contact', err);
    res.status(500).json({ error: 'Error al listar contactos' });
  }
});

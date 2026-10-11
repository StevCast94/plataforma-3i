import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '../prisma';
import { requireAdmin, requireSuperadmin, type AuthedRequest } from '../middleware/auth';
import crypto from 'node:crypto';
import type { LeadStatus } from '@prisma/client';
import { STAFF_ROLES, syncStaffCrmUser } from '../services/internalTeam';
import { audit } from '../services/audit';

export const adminSettingsRoutes = Router();
adminSettingsRoutes.use(requireAdmin);

// Cloudinary se configura vía CLOUDINARY_URL (env). cloud_name dos8bzljc.
if (process.env.CLOUDINARY_URL) cloudinary.config({ secure: true });

// ---------- AUDIT LOGS ----------
// GET /api/admin/audit-logs
adminSettingsRoutes.get('/audit-logs', async (_req, res) => {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { staff: { select: { username: true } } },
  });
  res.json(logs);
});

// ---------- IMAGE UPLOAD (Cloudinary) ----------
// POST /api/admin/seed-images  body: { dataUri, folder? }
adminSettingsRoutes.post('/seed-images', async (req, res) => {
  try {
    if (!process.env.CLOUDINARY_URL) {
      res.status(500).json({ error: 'CLOUDINARY_URL no configurado' });
      return;
    }
    const { dataUri, folder } = req.body ?? {};
    if (!dataUri || typeof dataUri !== 'string') {
      res.status(400).json({ error: 'dataUri requerido (base64 data URL)' });
      return;
    }
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: folder ? String(folder) : 'grupo3i',
      resource_type: 'image',
      transformation: [{ width: 2400, height: 2400, crop: 'limit', quality: 'auto:good' }],
    });
    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error('POST /api/admin/seed-images', err);
    res.status(500).json({ error: 'Error al subir la imagen' });
  }
});

// ---------- STAFF USERS (solo superadmin) ----------
// ---------- EQUIPO (usuarios del admin) ----------
const STAFF_SELECT = {
  id: true, username: true, fullName: true, whatsapp: true, role: true, active: true, lastLoginAt: true, createdAt: true,
  crmUser: { select: { _count: { select: { leads: { where: { status: { notIn: ['WON', 'LOST'] as LeadStatus[] } } } } } } },
  _count: { select: { pushSubs: true } },
} as const;
const cleanPhone = (v: unknown) => {
  const t = String(v ?? '').trim();
  return t.replace(/\D/g, '').length >= 8 ? t.slice(0, 30) : null;
};
const tempPassword = () => crypto.randomBytes(9).toString('base64url');

// GET /api/admin/staff
adminSettingsRoutes.get('/staff', requireSuperadmin, async (_req, res) => {
  const staff = await prisma.staffUser.findMany({ select: STAFF_SELECT, orderBy: { createdAt: 'asc' } });
  res.json(staff.map(({ crmUser, _count, ...s }) => ({ ...s, openLeads: crmUser?._count.leads ?? 0, pushEnabled: _count.pushSubs > 0 })));
});

// POST /api/admin/staff {username, fullName?, whatsapp?, role} — la contraseña temporal se muestra una vez
adminSettingsRoutes.post('/staff', requireSuperadmin, async (req: AuthedRequest, res) => {
  try {
    const { username, fullName, whatsapp, role } = req.body ?? {};
    const user = String(username ?? '').trim().toLowerCase();
    if (!/^[a-z0-9._@-]{3,60}$/.test(user)) {
      res.status(400).json({ error: 'Usuario inválido (letras, números, punto o guion; mínimo 3)' });
      return;
    }
    const password = tempPassword();
    const staff = await prisma.staffUser.create({
      data: {
        username: user,
        fullName: fullName ? String(fullName).trim().slice(0, 80) : null,
        whatsapp: cleanPhone(whatsapp),
        password: await bcrypt.hash(password, 10),
        role: STAFF_ROLES.includes(role) ? role : 'advisor',
      },
      select: { id: true, username: true },
    });
    await syncStaffCrmUser(staff.id);
    await audit(req.staff?.staffId, 'create', 'staff', staff.id, { username: staff.username });
    res.status(201).json({ ...staff, password });
  } catch (err) {
    console.error('POST /api/admin/staff', err);
    res.status(400).json({ error: 'No se pudo crear (¿usuario duplicado?)' });
  }
});

// PUT /api/admin/staff/:id {fullName?, whatsapp?, role?, active?}
adminSettingsRoutes.put('/staff/:id', requireSuperadmin, async (req: AuthedRequest, res) => {
  try {
    const { active, role, fullName, whatsapp } = req.body ?? {};
    const self = req.params.id === req.staff?.staffId;
    if (self && (active === false || (role && role !== 'superadmin'))) {
      res.status(400).json({ error: 'No puedes desactivarte ni quitarte el rol de superadmin' });
      return;
    }
    await prisma.staffUser.update({
      where: { id: req.params.id },
      data: {
        ...(active !== undefined ? { active: !!active } : {}),
        ...(role && STAFF_ROLES.includes(role) ? { role: String(role) } : {}),
        ...(fullName !== undefined ? { fullName: String(fullName).trim().slice(0, 80) || null } : {}),
        ...(whatsapp !== undefined ? { whatsapp: cleanPhone(whatsapp) } : {}),
      },
    });
    await syncStaffCrmUser(req.params.id);
    await audit(req.staff?.staffId, 'update', 'staff', req.params.id, { active, role });
    res.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/admin/staff/:id', err);
    res.status(400).json({ error: 'Error al actualizar el usuario' });
  }
});

// POST /api/admin/staff/:id/password — nueva contraseña temporal (se muestra una vez)
adminSettingsRoutes.post('/staff/:id/password', requireSuperadmin, async (req: AuthedRequest, res) => {
  const password = tempPassword();
  const r = await prisma.staffUser.updateMany({ where: { id: req.params.id }, data: { password: await bcrypt.hash(password, 10) } });
  if (!r.count) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }
  await audit(req.staff?.staffId, 'reset-password', 'staff', req.params.id);
  res.json({ password });
});

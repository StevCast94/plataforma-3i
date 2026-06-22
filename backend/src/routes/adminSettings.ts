import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '../prisma';
import { requireAdmin, requireSuperadmin, type AuthedRequest } from '../middleware/auth';
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
    });
    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error('POST /api/admin/seed-images', err);
    res.status(500).json({ error: 'Error al subir la imagen' });
  }
});

// ---------- STAFF USERS (solo superadmin) ----------
// GET /api/admin/staff
adminSettingsRoutes.get('/staff', requireSuperadmin, async (_req, res) => {
  const staff = await prisma.staffUser.findMany({
    select: { id: true, username: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json(staff);
});

// POST /api/admin/staff — crear
adminSettingsRoutes.post('/staff', requireSuperadmin, async (req: AuthedRequest, res) => {
  try {
    const { username, password, role } = req.body ?? {};
    if (!username || !password) {
      res.status(400).json({ error: 'Usuario y contraseña requeridos' });
      return;
    }
    const hash = await bcrypt.hash(String(password), 10);
    const staff = await prisma.staffUser.create({
      data: {
        username: String(username).trim(),
        password: hash,
        role: role && ['superadmin', 'admin', 'content', 'advisor'].includes(role) ? role : 'admin',
      },
      select: { id: true, username: true, role: true, active: true },
    });
    await audit(req.staff?.staffId, 'create', 'staff', staff.id, { username: staff.username });
    res.status(201).json(staff);
  } catch (err) {
    console.error('POST /api/admin/staff', err);
    res.status(400).json({ error: 'Error al crear staff (¿usuario duplicado?)' });
  }
});

// PUT /api/admin/staff/:id — activar/desactivar o cambiar rol
adminSettingsRoutes.put('/staff/:id', requireSuperadmin, async (req: AuthedRequest, res) => {
  try {
    const { active, role } = req.body ?? {};
    const staff = await prisma.staffUser.update({
      where: { id: req.params.id },
      data: {
        ...(active !== undefined ? { active: !!active } : {}),
        ...(role ? { role: String(role) } : {}),
      },
      select: { id: true, username: true, role: true, active: true },
    });
    await audit(req.staff?.staffId, 'update', 'staff', staff.id);
    res.json(staff);
  } catch (err) {
    console.error('PUT /api/admin/staff/:id', err);
    res.status(400).json({ error: 'Error al actualizar staff' });
  }
});

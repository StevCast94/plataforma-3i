import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { requireAdmin, signStaffToken, type AuthedRequest } from '../middleware/auth';
import { audit } from '../services/audit';

export const adminAuthRoutes = Router();

// POST /api/admin/login
adminAuthRoutes.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body ?? {};
    if (!username || !password) {
      res.status(400).json({ error: 'Usuario y contraseña requeridos' });
      return;
    }
    const staff = await prisma.staffUser.findUnique({
      where: { username: String(username).trim() },
    });
    if (!staff || !staff.active || !(await bcrypt.compare(String(password), staff.password))) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }
    const token = signStaffToken({ staffId: staff.id, username: staff.username, role: staff.role });
    await audit(staff.id, 'login', 'staff', staff.id);
    res.json({
      token,
      staff: { id: staff.id, username: staff.username, role: staff.role },
    });
  } catch (err) {
    console.error('POST /api/admin/login', err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// GET /api/admin/me
adminAuthRoutes.get('/me', requireAdmin, (req: AuthedRequest, res) => {
  res.json(req.staff);
});

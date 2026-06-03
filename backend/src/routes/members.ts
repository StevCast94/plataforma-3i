import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { authMember, signMemberToken, type MemberRequest } from '../middleware/authMember';
import { generateReferralCode, PAYOUT_METHODS } from '../lib/referralRules';
import { attributeReferral } from '../services/referralTracking';
import { ascendByPurchase, checkReferralAscension } from '../services/ascendService';

export const memberRoutes = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicBase(): string {
  return (
    process.env.PUBLIC_BASE_URL ?? 'https://plataforma-3i-production.up.railway.app'
  );
}

// Campos seguros para devolver (sin passwordHash).
const memberSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  docType: true,
  docId: true,
  status: true,
  referralCode: true,
  referrerId: true,
  walletBalance: true,
  totalEarned: true,
  totalReferrals: true,
  lastReferralAt: true,
  inactiveSince: true,
  eliteSince: true,
  eliteBy: true,
  referralsCountToElite: true,
  membershipAwarded: true,
  payoutMethod: true,
  payoutEmail: true,
  bankInfo: true,
  kycVerified: true,
  bio: true,
  avatarUrl: true,
  location: true,
  interests: true,
  createdAt: true,
} as const;

// POST /api/members/register
memberRoutes.post('/register', async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      docType,
      docId,
      payoutMethod,
      payoutEmail,
      bankInfo,
      ref,
      cookieId,
    } = req.body ?? {};

    if (!fullName || !email || !password || !docId) {
      res.status(400).json({ error: 'Nombre, email, contraseña y documento son requeridos' });
      return;
    }
    if (!EMAIL_RE.test(email)) {
      res.status(400).json({ error: 'Email inválido' });
      return;
    }
    if (String(password).length < 8) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
      return;
    }

    // Unicidad (email / documento)
    const dup = await prisma.referralMember.findFirst({
      where: { OR: [{ email: String(email).toLowerCase() }, { docId: String(docId) }] },
      select: { email: true, docId: true },
    });
    if (dup) {
      const field = dup.email === String(email).toLowerCase() ? 'email' : 'documento';
      res.status(409).json({ error: `Ya existe una cuenta con ese ${field}` });
      return;
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    // Código único (reintento ante colisión improbable).
    let referralCode = generateReferralCode('PREMIERE');
    for (let i = 0; i < 5; i++) {
      const exists = await prisma.referralMember.findUnique({
        where: { referralCode },
        select: { id: true },
      });
      if (!exists) break;
      referralCode = generateReferralCode('PREMIERE');
    }

    const code = referralCode;
    const fullUrl = `${publicBase()}/#/oficina/registro?ref=${code}`;

    // Transacción atómica: miembro + link + atribución.
    const member = await prisma.$transaction(async (tx) => {
      const created = await tx.referralMember.create({
        data: {
          fullName: String(fullName).trim(),
          email: String(email).toLowerCase().trim(),
          phone: phone ? String(phone).trim() : null,
          passwordHash,
          docType: docType ? String(docType) : 'cedula',
          docId: String(docId).trim(),
          referralCode: code,
          payoutMethod: payoutMethod && PAYOUT_METHODS[payoutMethod] ? String(payoutMethod) : null,
          payoutEmail: payoutEmail ? String(payoutEmail).trim() : null,
          bankInfo: bankInfo ?? undefined,
        },
        select: memberSelect,
      });

      await tx.referralLink.create({
        data: { memberId: created.id, code, fullUrl },
      });

      if (ref) {
        await attributeReferral(
          {
            newMemberId: created.id,
            referrerCode: String(ref),
            attributionMethod: 'link',
            cookieId: cookieId ?? null,
          },
          tx,
        );
      }

      return created;
    });

    const token = signMemberToken(member.id, member.email);
    res.status(201).json({ token, member });
  } catch (err) {
    console.error('POST /api/members/register', err);
    res.status(500).json({ error: 'Error al registrar' });
  }
});

// POST /api/members/login
memberRoutes.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña requeridos' });
      return;
    }
    const member = await prisma.referralMember.findUnique({
      where: { email: String(email).toLowerCase().trim() },
    });
    if (!member || !(await bcrypt.compare(String(password), member.passwordHash))) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }
    if (member.status === 'SUSPENDED') {
      res.status(403).json({ error: 'Cuenta suspendida' });
      return;
    }
    const token = signMemberToken(member.id, member.email);
    const { passwordHash: _ph, ...safe } = member;
    res.json({ token, member: safe });
  } catch (err) {
    console.error('POST /api/members/login', err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// GET /api/members/me
memberRoutes.get('/me', authMember, async (req: MemberRequest, res) => {
  const member = await prisma.referralMember.findUnique({
    where: { id: req.memberId },
    select: memberSelect,
  });
  res.json(member);
});

// PUT /api/members/me
memberRoutes.put('/me', authMember, async (req: MemberRequest, res) => {
  try {
    const { fullName, phone, bio, avatarUrl, location, interests } = req.body ?? {};
    const member = await prisma.referralMember.update({
      where: { id: req.memberId },
      data: {
        ...(fullName ? { fullName: String(fullName).trim() } : {}),
        ...(phone !== undefined ? { phone: phone ? String(phone).trim() : null } : {}),
        ...(bio !== undefined ? { bio: bio ? String(bio) : null } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl ? String(avatarUrl) : null } : {}),
        ...(location !== undefined ? { location: location ? String(location) : null } : {}),
        ...(Array.isArray(interests) ? { interests: interests.map(String) } : {}),
      },
      select: memberSelect,
    });
    res.json(member);
  } catch (err) {
    console.error('PUT /api/members/me', err);
    res.status(400).json({ error: 'Error al actualizar perfil' });
  }
});

// PUT /api/members/payout-method
memberRoutes.put('/payout-method', authMember, async (req: MemberRequest, res) => {
  try {
    const { payoutMethod, payoutEmail, bankInfo } = req.body ?? {};
    if (!payoutMethod || !PAYOUT_METHODS[payoutMethod]) {
      res.status(400).json({ error: 'Método de pago inválido' });
      return;
    }
    const member = await prisma.referralMember.update({
      where: { id: req.memberId },
      data: {
        payoutMethod: String(payoutMethod),
        payoutEmail: payoutEmail ? String(payoutEmail).trim() : null,
        bankInfo: bankInfo ?? undefined,
      },
      select: memberSelect,
    });
    res.json(member);
  } catch (err) {
    console.error('PUT /api/members/payout-method', err);
    res.status(400).json({ error: 'Error al guardar método de pago' });
  }
});

// POST /api/members/ascend — ascenso por compra del propio miembro (verifica también por referidos)
memberRoutes.post('/ascend', authMember, async (req: MemberRequest, res) => {
  try {
    const { byPurchase } = req.body ?? {};
    const result = byPurchase
      ? await ascendByPurchase(req.memberId!)
      : await checkReferralAscension(req.memberId!);
    res.json(result);
  } catch (err) {
    console.error('POST /api/members/ascend', err);
    res.status(400).json({ error: 'Error al verificar ascenso' });
  }
});

// GET /api/members/:code — info pública mínima de un miembro por su código
memberRoutes.get('/:code', async (req, res) => {
  const member = await prisma.referralMember.findUnique({
    where: { referralCode: req.params.code },
    select: { fullName: true, referralCode: true, status: true },
  });
  if (!member) {
    res.status(404).json({ error: 'Código no encontrado' });
    return;
  }
  // Solo primer nombre por privacidad.
  res.json({
    firstName: member.fullName.split(' ')[0],
    referralCode: member.referralCode,
    status: member.status,
  });
});

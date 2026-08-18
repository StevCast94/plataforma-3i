import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { authMember, signMemberToken, type MemberRequest } from '../middleware/authMember';
import { generateReferralCode, generateReferralSlug, PAYOUT_METHODS } from '../lib/referralRules';
import { attributeReferral, reconcileClaimedPurchases } from '../services/referralTracking';
import { ascendByPurchase, checkReferralAscension } from '../services/ascendService';
import { hasTravelAccess } from '../travel/membershipAccess';
import { refFromRequest } from './referral';

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
  referralSlug: true,
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
  // Referidor real del socio (fuente de verdad para la atribución de comisiones).
  referrer: { select: { fullName: true, referralCode: true } },
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
      cookieId,
    } = req.body ?? {};
    const ref = refFromRequest(req);

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

    const emailLc = String(email).toLowerCase().trim();
    const docIdStr = String(docId).trim();

    // ¿Email ya existe? Puede ser un PRE-REGISTRO provisional reclamable.
    const existing = await prisma.referralMember.findUnique({
      where: { email: emailLc },
      select: { id: true, claimed: true, referredByCode: true },
    });
    if (existing && existing.claimed) {
      res.status(409).json({ error: 'Ya existe una cuenta con ese email. Inicia sesión.' });
      return;
    }

    // Documento ya usado por OTRO miembro.
    const docDup = await prisma.referralMember.findFirst({
      where: { docId: docIdStr, ...(existing ? { id: { not: existing.id } } : {}) },
      select: { id: true },
    });
    if (docDup) {
      res.status(409).json({ error: 'Ya existe una cuenta con ese documento' });
      return;
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    // CAMINO A — RECLAMAR un pre-registro: activa el código existente del lead.
    if (existing && !existing.claimed) {
      const refToUse = existing.referredByCode ?? (ref ?? null);
      const member = await prisma.$transaction(async (tx) => {
        const claimed = await tx.referralMember.update({
          where: { id: existing.id },
          data: {
            passwordHash,
            docId: docIdStr,
            docType: docType ? String(docType) : 'cedula',
            status: 'PREMIERE',
            claimed: true,
            fullName: String(fullName).trim(),
            phone: phone ? String(phone).trim() : undefined,
            payoutMethod: payoutMethod && PAYOUT_METHODS[payoutMethod] ? String(payoutMethod) : undefined,
            payoutEmail: payoutEmail ? String(payoutEmail).trim() : undefined,
            bankInfo: bankInfo ?? undefined,
          },
          select: memberSelect,
        });
        if (refToUse) {
          await attributeReferral(
            { newMemberId: claimed.id, referrerCode: String(refToUse), attributionMethod: 'claim', cookieId: cookieId ?? null },
            tx,
          );
        }
        // Vincular compras que ya se hayan confirmado mientras el socio estaba
        // sin reclamar (pre-registro) — mismo email, nunca se infiere de otra forma.
        await reconcileClaimedPurchases(claimed.id, claimed.email, tx);
        return claimed;
      });
      const token = signMemberToken(member.id, member.email);
      res.status(201).json({ token, member, claimed: true });
      return;
    }

    // CAMINO B — REGISTRO NUEVO (sin pre-registro previo).
    let referralCode = generateReferralCode('PREMIERE');
    for (let i = 0; i < 5; i++) {
      const exists = await prisma.referralMember.findUnique({
        where: { referralCode },
        select: { id: true },
      });
      if (!exists) break;
      referralCode = generateReferralCode('PREMIERE');
    }

    let referralSlug = generateReferralSlug(String(fullName));
    for (let i = 0; i < 5; i++) {
      const exists = await prisma.referralMember.findUnique({
        where: { referralSlug },
        select: { id: true },
      });
      if (!exists) break;
      referralSlug = generateReferralSlug(String(fullName));
    }

    const code = referralCode;
    // Enlace principal vía /r/:slug (redirección server-side): setea la cookie de
    // atribución y cuenta el click aunque el visitante cierre el navegador antes
    // de registrarse — más robusto que depender del ?ref= leído por JS.
    const fullUrl = `${publicBase()}/r/${referralSlug}`;

    // Transacción atómica: miembro + link + atribución.
    const member = await prisma.$transaction(async (tx) => {
      const created = await tx.referralMember.create({
        data: {
          fullName: String(fullName).trim(),
          email: emailLc,
          phone: phone ? String(phone).trim() : null,
          passwordHash,
          docType: docType ? String(docType) : 'cedula',
          docId: docIdStr,
          referralCode: code,
          referralSlug,
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
      // Vincular compras hechas por email antes de existir cuenta propia
      // (ej. compra manual del admin sin pre-registro previo).
      await reconcileClaimedPurchases(created.id, created.email, tx);

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
    // Pre-registro sin contraseña: invitar a activar en vez de "credenciales inválidas".
    if (member && !member.claimed && !member.passwordHash) {
      res.status(409).json({ error: 'Tienes una oficina pendiente. Crea tu contraseña para activar tu código.', needsActivation: true });
      return;
    }
    if (!member || !member.passwordHash || !(await bcrypt.compare(String(password), member.passwordHash))) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }
    if (member.status === 'SUSPENDED') {
      res.status(403).json({ error: 'Cuenta suspendida' });
      return;
    }
    const token = signMemberToken(member.id, member.email);
    const { passwordHash: _ph, ...safe } = member;
    const travelAccess = await hasTravelAccess(member.id);
    res.json({ token, member: { ...safe, travelAccess } });
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
  const travelAccess = await hasTravelAccess(req.memberId);
  res.json(member ? { ...member, travelAccess } : member);
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

// POST /api/members/support-request — recuperar contraseña / soporte general.
// Sin email: queda registrado para que el staff lo vea en Admin > Soporte y
// resetee la contraseña manualmente. El frontend abre WhatsApp en paralelo.
memberRoutes.post('/support-request', async (req, res) => {
  try {
    const { type, name, email, phone, message } = req.body ?? {};
    if (!email || !EMAIL_RE.test(String(email))) {
      res.status(400).json({ error: 'Email inválido' });
      return;
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    const member = await prisma.referralMember.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    const request = await prisma.supportRequest.create({
      data: {
        type: type === 'other' ? 'other' : 'password_reset',
        memberId: member?.id ?? null,
        name: name ? String(name).trim() : null,
        email: normalizedEmail,
        phone: phone ? String(phone).trim() : null,
        message: message ? String(message).trim() : null,
      },
    });
    res.status(201).json({ id: request.id });
  } catch (err) {
    console.error('POST /api/members/support-request', err);
    res.status(400).json({ error: 'Error al registrar la solicitud' });
  }
});

// GET /api/members/:code — info pública mínima de un miembro por su código o slug
memberRoutes.get('/:code', async (req, res) => {
  const member = await prisma.referralMember.findFirst({
    where: { OR: [{ referralCode: req.params.code }, { referralSlug: req.params.code }] },
    select: { fullName: true, referralCode: true, referralSlug: true, status: true },
  });
  if (!member) {
    res.status(404).json({ error: 'Código no encontrado' });
    return;
  }
  // Solo primer nombre por privacidad.
  res.json({
    firstName: member.fullName.split(' ')[0],
    referralCode: member.referralCode,
    referralSlug: member.referralSlug,
    status: member.status,
  });
});

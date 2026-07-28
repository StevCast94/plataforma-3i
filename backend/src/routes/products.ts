import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';
import { resolveReferrerForPurchase } from '../services/referralTracking';
import { refFromRequest } from './referral';
import { ensureProvisionalMember } from '../services/preRegister';
import { pickAdvisor } from '../services/leadAssignment';

export const productRoutes = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/products           -> lista (solo activos por defecto)
// GET /api/products?type=...  -> filtrar por ProductType
productRoutes.get('/', async (req, res) => {
  try {
    const all = req.query.all === 'true';
    const type = req.query.type as string | undefined;
    const products = await prisma.product.findMany({
      where: {
        ...(all ? {} : { active: true }),
        ...(type ? { type: type as never } : {}),
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'asc' }],
      include: { project: true },
    });
    res.json(products);
  } catch (err) {
    console.error('GET /api/products', err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// GET /api/products/:slug -> detalle por slug
productRoutes.get('/:slug', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: { project: true },
    });
    if (!product) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }
    res.json(product);
  } catch (err) {
    console.error('GET /api/products/:slug', err);
    res.status(500).json({ error: 'Error al obtener el producto' });
  }
});

// POST /api/products/:id/inquiry (público) -> solicitar info de un producto
productRoutes.post('/:id/inquiry', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body ?? {};
    if (!name || !email) {
      res.status(400).json({ error: 'name y email son requeridos' });
      return;
    }
    if (!EMAIL_RE.test(email)) {
      res.status(400).json({ error: 'Email inválido' });
      return;
    }

    const VALID_INTENTS = ['info', 'whatsapp', 'visit', 'meet', 'purchase'];
    const intent = VALID_INTENTS.includes(req.body?.intent) ? String(req.body.intent) : 'info';
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      select: { id: true, price: true, promoPrice: true },
    });
    if (!product) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }

    const code = refFromRequest(req);

    // Resolver el referidor. Si el comprador ya es socio, manda su upline real
    // (nunca el código de la cookie) — ver resolveReferrerForPurchase.
    const { referrerId, selfReferralBlocked } = await resolveReferrerForPurchase({
      customerEmail: String(email),
      code,
    });
    if (selfReferralBlocked) {
      console.warn(
        `[anti-fraude] Auto-referido bloqueado en compra: ${String(email).trim()} usó su propio código ${code}`,
      );
    }

    // Asesor asignado por round-robin (null si no hay asesores activos).
    const assignedToId = await pickAdvisor();

    // Lead + (si es intención de compra) una Purchase en estado pending, atómicamente.
    const result = await prisma.$transaction(async (tx) => {
      const inquiry = await tx.productInquiry.create({
        data: {
          productId: product.id,
          name: String(name).trim(),
          email: String(email).trim(),
          phone: phone ? String(phone).trim() : null,
          message: message ? String(message).trim() : null,
          referralCode: code,
          intent,
          assignedToId,
        },
      });

      let purchaseId: string | null = null;
      if (intent === 'purchase') {
        const purchase = await tx.purchase.create({
          data: {
            productId: product.id,
            customerName: String(name).trim(),
            customerEmail: String(email).trim(),
            customerPhone: phone ? String(phone).trim() : null,
            amount: product.promoPrice ?? product.price,
            status: 'pending',
            referralCode: code,
            referrerId,
          },
        });
        purchaseId = purchase.id;
      }

      return { inquiryId: inquiry.id, purchaseId };
    });

    // Pre-registro sin contraseña: quien pide info queda como miembro provisional
    // y puede activar su código creando su contraseña. Best-effort (no rompe el lead).
    let canActivate = false;
    try {
      const prov = await ensureProvisionalMember({
        fullName: String(name).trim(),
        email: String(email).trim(),
        phone: phone ? String(phone).trim() : null,
        referredByCode: code,
      });
      canActivate = !prov.alreadyClaimed; // si ya tiene cuenta activa, no ofrecer "activar"
    } catch (err) {
      console.error('preRegister inquiry', err);
    }

    res.status(201).json({ ok: true, ...result, canActivate });
  } catch (err) {
    console.error('POST /api/products/:id/inquiry', err);
    res.status(500).json({ error: 'Error al enviar la solicitud' });
  }
});

// POST /api/products (admin)
productRoutes.post('/', requireAdmin, async (req, res) => {
  try {
    const product = await prisma.product.create({ data: req.body });
    res.status(201).json(product);
  } catch (err) {
    console.error('POST /api/products', err);
    res.status(400).json({ error: 'Error al crear el producto' });
  }
});

// PUT /api/products/:id (admin)
productRoutes.put('/:id', requireAdmin, async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(product);
  } catch (err) {
    console.error('PUT /api/products/:id', err);
    res.status(400).json({ error: 'Error al actualizar el producto' });
  }
});

// DELETE /api/products/:id (admin)
productRoutes.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/products/:id', err);
    res.status(400).json({ error: 'Error al eliminar el producto' });
  }
});

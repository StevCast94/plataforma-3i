import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../prisma';
import { createCommission } from './commissionCalculator';
import { checkReferralAscension } from './ascendService';
import { notify } from './notifications';

type Db = PrismaClient | Prisma.TransactionClient;

/** Busca al miembro dueño de un código de referido (acepta código de miembro o de link). */
export async function resolveReferrer(
  code: string,
  db: Db = prisma,
): Promise<{ id: string; referrerId: string | null } | null> {
  const member = await db.referralMember.findUnique({
    where: { referralCode: code },
    select: { id: true, referrerId: true },
  });
  if (member) return member;

  const link = await db.referralLink.findUnique({
    where: { code },
    select: { member: { select: { id: true, referrerId: true } } },
  });
  return link?.member ?? null;
}

/**
 * Resuelve a QUIÉN se le atribuye la comisión de una compra.
 *
 * REGLA ESTRUCTURAL: un socio pertenece a UN solo referidor. Si el comprador ya
 * es socio (match por email exacto — nunca por otra vía), la comisión va SIEMPRE
 * a su upline real, ignorando cualquier código `?ref=` que traiga la cookie.
 * Esto hace imposible por diseño el auto-referido (comprar con el propio link) y
 * el robo de referido (comprar con el link de otro). Solo los compradores que aún
 * no son socios se atribuyen por el código de la cookie.
 *
 * Devuelve además `selfReferralBlocked` para que el admin pueda auditar el intento.
 */
export async function resolveReferrerForPurchase(
  params: { customerEmail: string; code?: string | null },
  db: Db = prisma,
): Promise<{ referrerId: string | null; selfReferralBlocked: boolean }> {
  const { customerEmail, code } = params;

  const buyer = await db.referralMember.findUnique({
    where: { email: customerEmail.toLowerCase().trim() },
    select: { id: true, referrerId: true },
  });

  if (buyer) {
    // El comprador YA es socio: su upline real manda, venga el código que venga.
    const codeOwner = code ? await resolveReferrer(code, db) : null;
    const selfReferralBlocked = codeOwner?.id === buyer.id;
    return { referrerId: buyer.referrerId, selfReferralBlocked };
  }

  // Comprador aún no socio: se atribuye por el código de la cookie.
  const referrer = code ? await resolveReferrer(code, db) : null;
  return { referrerId: referrer?.id ?? null, selfReferralBlocked: false };
}

/**
 * Crea la atribución de un nuevo miembro a su referidor (y al de 2do nivel si existe).
 * Reglas: no auto-referido, un referido pertenece a UN solo referidor (1er registro gana).
 * Actualiza contadores del referidor y conversiones del link.
 */
export async function attributeReferral(
  params: {
    newMemberId: string;
    referrerCode: string;
    attributionMethod?: string;
    cookieId?: string | null;
  },
  db: Db = prisma,
): Promise<{ attributed: boolean; reason?: string }> {
  const { newMemberId, referrerCode, attributionMethod = 'link', cookieId } = params;

  const referrer = await resolveReferrer(referrerCode, db);
  if (!referrer) return { attributed: false, reason: 'Código de referido inválido' };
  if (referrer.id === newMemberId)
    return { attributed: false, reason: 'No se permite auto-referido' };

  // Un referido solo puede atribuirse a un miembro (first-click gana).
  const existing = await db.referral.findFirst({
    where: { referredId: newMemberId, level: 1 },
    select: { id: true },
  });
  if (existing) return { attributed: false, reason: 'El referido ya está atribuido' };

  // Nivel 1
  await db.referral.create({
    data: {
      referrerId: referrer.id,
      referredId: newMemberId,
      level: 1,
      attributionMethod,
      cookieId: cookieId ?? null,
      status: 'active',
    },
  });

  // Persistir el FK referrerId en el socio nuevo. Es la fuente de verdad que usa
  // `confirmPurchase` para resolver el 2do nivel (referidor del referidor) y que
  // habilita la creación de la fila Referral de nivel 2 en cadenas más profundas.
  await db.referralMember.update({
    where: { id: newMemberId },
    data: { referrerId: referrer.id },
  });

  // Nivel 2 (el referidor del referidor)
  if (referrer.referrerId) {
    await db.referral.create({
      data: {
        referrerId: referrer.referrerId,
        referredId: newMemberId,
        level: 2,
        attributionMethod,
        cookieId: cookieId ?? null,
        status: 'active',
      },
    });
  }

  // Actualizar contadores del referidor directo + reactivar.
  await db.referralMember.update({
    where: { id: referrer.id },
    data: {
      totalReferrals: { increment: 1 },
      lastReferralAt: new Date(),
      inactiveSince: null,
    },
  });

  // Sumar conversión al link si el código corresponde a uno.
  await db.referralLink.updateMany({
    where: { code: referrerCode },
    data: { conversions: { increment: 1 } },
  });

  await notify(
    referrer.id,
    'new_referral',
    'Nuevo referido registrado 🎯',
    'Una persona se registró con tu enlace. ¡Sigue compartiendo!',
    db,
  );

  return { attributed: true };
}

/** Registra un click en un enlace de referido (atribución first-click vía cookie). */
export async function recordClick(code: string, db: Db = prisma): Promise<boolean> {
  const result = await db.referralLink.updateMany({
    where: { code },
    data: { clicks: { increment: 1 } },
  });
  return result.count > 0;
}

/**
 * Procesa la primera compra de un miembro referido:
 * marca firstPurchaseAt, genera comisiones a sus referidores (nivel 1 y 2)
 * según sus respectivos estatus, y verifica el ascenso del referidor de nivel 1.
 * Pensado para invocarse desde el flujo de checkout (Fase futura) o desde el seed/tests.
 */
export async function processReferredPurchase(
  params: {
    referredMemberId: string;
    productId?: string | null;
    productType:
      | 'TRAVEL_MEMBERSHIP'
      | 'FRACTIONAL_PROPERTY'
      | 'TRADITIONAL_PROPERTY'
      | 'LAND';
    netPrice: number;
    transactionId?: string | null;
  },
  db: Db = prisma,
): Promise<{ commissionsCreated: number }> {
  const { referredMemberId, productId, productType, netPrice, transactionId } = params;

  // Config de comisión del producto (override por producto).
  const product = productId
    ? await db.product.findUnique({
        where: { id: productId },
        select: { commissionType: true, commissionFixedPremiere: true, commissionFixedElite: true },
      })
    : null;

  // Referrals (niveles 1 y 2) donde este miembro es el referido.
  const referrals = await db.referral.findMany({
    where: { referredId: referredMemberId },
    select: { id: true, referrerId: true, level: true, firstPurchaseAt: true },
  });

  const isRealEstate = productType !== 'TRAVEL_MEMBERSHIP';
  let created = 0;
  for (const r of referrals) {
    const now = new Date();
    await db.referral.update({
      where: { id: r.id },
      data: {
        status: 'active',
        ...(r.firstPurchaseAt ? {} : { firstPurchaseAt: now }),
        ...(isRealEstate ? { firstRealEstateAt: now } : {}),
      },
    });

    const referrer = await db.referralMember.findUnique({
      where: { id: r.referrerId },
      select: { status: true },
    });
    if (!referrer || referrer.status === 'SUSPENDED') continue;

    const commission = await createCommission(
      {
        memberId: r.referrerId,
        memberStatus: referrer.status === 'ELITE' ? 'ELITE' : 'PREMIERE',
        referralId: r.id,
        level: r.level === 2 ? 2 : 1,
        productType,
        netPrice,
        productId,
        transactionId,
        commissionType: product?.commissionType,
        commissionFixedPremiere: product?.commissionFixedPremiere,
        commissionFixedElite: product?.commissionFixedElite,
      },
      db,
    );
    if (commission) {
      created++;
      await notify(
        r.referrerId,
        'first_purchase',
        'Tu referido realizó una compra 💰',
        'Generaste una comisión. Quedará disponible tras el período de espera.',
        db,
      );
    }

    // Solo el referidor de nivel 1 acumula para el ascenso por referidos.
    if (r.level === 1) {
      await checkReferralAscension(r.referrerId, db);
    }
  }

  return { commissionsCreated: created };
}

/**
 * Reconcilia compras YA CONFIRMADAS antes de que el socio existiera o reclamara
 * su cuenta (caso típico: alguien pide info/compra como invitado → queda
 * pre-registrado sin contraseña → el staff confirma la venta antes de que la
 * persona reclame su cuenta). `confirmPurchase` solo intenta vincular la
 * comisión a una fila `Referral` UNA vez, al confirmar; si esa fila todavía no
 * existía, la comisión queda huérfana (referralId null) para siempre.
 *
 * Se invoca justo después de `attributeReferral` (mismo email = mismo socio,
 * el vínculo NUNCA se infiere por otra vía). Para cada comisión huérfana de una
 * compra confirmada con este email, busca la fila Referral que `attributeReferral`
 * acaba de crear (mismo referrerId + nivel) y, si coincide, la vincula y marca
 * `firstPurchaseAt`/`firstRealEstateAt` con la fecha real de la compra. Si el
 * código usado en la compra no coincide con la cadena real del socio, no fuerza
 * ningún vínculo (evita atribuciones incorrectas).
 */
export async function reconcileClaimedPurchases(
  newMemberId: string,
  email: string,
  db: Db = prisma,
): Promise<{ linked: number }> {
  const purchases = await db.purchase.findMany({
    where: {
      customerEmail: email.toLowerCase().trim(),
      status: { in: ['confirmed', 'completed'] },
    },
    select: {
      id: true,
      confirmedAt: true,
      createdAt: true,
      product: { select: { type: true } },
    },
  });
  if (purchases.length === 0) return { linked: 0 };

  let linked = 0;
  const ascensionCandidates = new Set<string>();

  for (const purchase of purchases) {
    const orphans = await db.commission.findMany({
      where: { purchaseId: purchase.id, referralId: null },
      select: { id: true, memberId: true, level: true },
    });
    if (orphans.length === 0) continue;

    const isRealEstate = purchase.product.type !== 'TRAVEL_MEMBERSHIP';
    const purchaseDate = purchase.confirmedAt ?? purchase.createdAt;

    for (const c of orphans) {
      const referral = await db.referral.findFirst({
        where: { referrerId: c.memberId, referredId: newMemberId, level: c.level },
        select: { id: true, firstPurchaseAt: true, firstRealEstateAt: true },
      });
      if (!referral) continue; // el código usado en la compra no coincide con la cadena real: no forzar

      await db.commission.update({ where: { id: c.id }, data: { referralId: referral.id } });
      await db.referral.update({
        where: { id: referral.id },
        data: {
          status: 'active',
          ...(referral.firstPurchaseAt ? {} : { firstPurchaseAt: purchaseDate }),
          ...(isRealEstate && !referral.firstRealEstateAt ? { firstRealEstateAt: purchaseDate } : {}),
        },
      });
      linked++;
      if (c.level === 1) ascensionCandidates.add(c.memberId);
    }
  }

  // Re-evaluar ascenso de los referidores de nivel 1 afectados (idempotente).
  for (const referrerId of ascensionCandidates) {
    await checkReferralAscension(referrerId, db);
  }

  return { linked };
}

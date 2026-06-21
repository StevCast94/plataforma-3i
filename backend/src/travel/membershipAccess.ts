import { prisma } from '../prisma';

// ============================================================
// FASE 5 — ¿El socio tiene acceso al club de viajes (precio de socio)?
// Acceso = existe una TravelMembership activa y no vencida. La membresía puede
// venir de COMPRA, de PREMIO/INCENTIVO (gratis) o de ser PROPIETARIO FRACCIONADO
// — todas dan el mismo acceso.
// Robusto: si no hay memberId o falla la BD, devuelve false (precio público).
// ============================================================

export async function hasTravelAccess(memberId?: string | null): Promise<boolean> {
  if (!memberId) return false;
  try {
    const now = new Date();
    const membership = await prisma.travelMembership.findFirst({
      where: {
        memberId,
        active: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { id: true },
    });
    return !!membership;
  } catch (err) {
    console.error('hasTravelAccess', err);
    return false; // ante cualquier error, tratar como visitante (precio público)
  }
}

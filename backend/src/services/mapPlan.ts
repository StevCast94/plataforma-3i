import { prisma } from '../prisma';
import { sendPushToDeveloperUsers, sendPushToStaff } from './push';

// Plan mensual del mapa con marca propia (Fase 3): $49 hasta 150 lotes, $99 con más.
// El pago se registra a mano en el admin (mapPaidUntil). Cada día:
//  - avisa 7, 3 y 1 día antes del vencimiento (al dueño del desarrollador y al equipo);
//  - al vencer, apaga el mapa insertable (embedEnabled = false).
// Los mapas activados sin fecha (proyectos propios, cortesías) no se tocan.

export const MAP_PLAN_LOT_LIMIT = 150;
export const mapPlanPrice = (lots: number) => (lots <= MAP_PLAN_LOT_LIMIT ? 49 : 99);

const DAY = 86400_000;

async function ownersOf(developerId: string | null) {
  if (!developerId) return [];
  const users = await prisma.developerUser.findMany({ where: { developerId, role: 'OWNER', active: true }, select: { id: true } });
  return users.map((u) => u.id);
}

export async function checkMapPlans(now = new Date()): Promise<{ reminded: number; disabled: number }> {
  const projects = await prisma.project.findMany({
    where: { embedEnabled: true, mapPaidUntil: { not: null } },
    select: { id: true, name: true, developerId: true, mapPaidUntil: true, mapRemindedAt: true },
  });
  let reminded = 0;
  let disabled = 0;
  for (const p of projects) {
    const daysLeft = Math.ceil((p.mapPaidUntil!.getTime() - now.getTime()) / DAY);
    if (daysLeft <= 0) {
      await prisma.project.update({ where: { id: p.id }, data: { embedEnabled: false } });
      const msg = { title: '🗺️ Mapa desactivado', body: `El plan del mapa de ${p.name} venció. Renuévalo para volver a mostrarlo en tu web.` };
      await sendPushToDeveloperUsers(await ownersOf(p.developerId), { ...msg, link: '/desarrollador' });
      await sendPushToStaff({ ...msg, link: '/admin/proyectos' });
      disabled++;
    } else if ([7, 3, 1].includes(daysLeft) && (!p.mapRemindedAt || now.getTime() - p.mapRemindedAt.getTime() > 20 * 3600_000)) {
      await prisma.project.update({ where: { id: p.id }, data: { mapRemindedAt: now } });
      const msg = {
        title: '🗺️ Tu mapa vence pronto',
        body: `El plan del mapa de ${p.name} vence en ${daysLeft} día${daysLeft === 1 ? '' : 's'}.`,
      };
      await sendPushToDeveloperUsers(await ownersOf(p.developerId), { ...msg, link: '/desarrollador' });
      await sendPushToStaff({ ...msg, link: '/admin/proyectos' });
      reminded++;
    }
  }
  return { reminded, disabled };
}

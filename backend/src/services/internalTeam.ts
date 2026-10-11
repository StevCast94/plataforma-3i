import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';

// Equipo de Grupo 3i dentro del CRM. El CRM reparte contactos entre usuarios de
// una desarrolladora (DeveloperUser); para los proyectos propios usamos una
// desarrolladora interna y cada usuario del admin (StaffUser) tiene ahí su
// cuenta enlazada. Así el reparto automático, el WhatsApp por asesor, las
// tareas y los reportes por vendedor funcionan igual que en el portal.
//
//  - asesor            → vendedor (recibe contactos en el reparto automático)
//  - admin/superadmin  → dueño (ve todo, no entra al reparto)
//  - contenido/bosque  → sin cuenta activa en el CRM

export const INTERNAL_DEV_ID = 'grupo3i-interno';

export const STAFF_ROLES = ['superadmin', 'admin', 'advisor', 'content', 'bosque'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

const crmRoleFor = (role: string) => (role === 'advisor' ? 'SELLER' : role === 'admin' || role === 'superadmin' ? 'OWNER' : null);

/** Crea o actualiza la cuenta CRM enlazada a un usuario del admin. Devuelve su id. */
export async function syncStaffCrmUser(staffId: string): Promise<string | null> {
  const s = await prisma.staffUser.findUnique({ where: { id: staffId } });
  if (!s) return null;
  const crmRole = crmRoleFor(s.role);
  const data = {
    name: s.fullName || s.username,
    whatsapp: s.whatsapp,
    role: crmRole ?? 'SELLER',
    active: s.active && crmRole !== null,
  };
  if (s.crmUserId) {
    await prisma.developerUser.update({ where: { id: s.crmUserId }, data });
    // Si deja de estar activo en el CRM, sus contactos abiertos quedan sin asignar (los ve el admin).
    if (!data.active) {
      await prisma.projectLead.updateMany({
        where: { assignedToId: s.crmUserId, status: { notIn: ['WON', 'LOST'] } },
        data: { assignedToId: null },
      });
    }
    return s.crmUserId;
  }
  if (!data.active) return null;
  // Cuenta sin contraseña utilizable: el acceso es siempre por el admin.
  const user = await prisma.developerUser.create({
    data: {
      ...data,
      developerId: INTERNAL_DEV_ID,
      email: `staff-${s.id}@interno.grupo3i.com`,
      password: await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10),
    },
  });
  await prisma.staffUser.update({ where: { id: s.id }, data: { crmUserId: user.id } });
  return user.id;
}

/** Sincroniza todos (al arrancar): cubre usuarios creados antes de este módulo. */
export async function syncAllStaffCrmUsers() {
  const staff = await prisma.staffUser.findMany({ select: { id: true } });
  for (const s of staff) await syncStaffCrmUser(s.id).catch((e) => console.error('syncStaffCrmUser', e));
}

/** Usuarios del admin enlazados a estas cuentas CRM (para avisos push). */
export async function staffIdsForCrmUsers(crmUserIds: string[]): Promise<string[]> {
  if (!crmUserIds.length) return [];
  const rows = await prisma.staffUser.findMany({ where: { crmUserId: { in: crmUserIds }, active: true }, select: { id: true } });
  return rows.map((r) => r.id);
}

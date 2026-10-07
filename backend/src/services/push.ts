import webpush from 'web-push';
import { prisma } from '../prisma';

// ============================================================
// NOTIFICACIONES PUSH (Web Push / VAPID)
// Cada notificación del sistema (notify) se envía también como push a los
// dispositivos donde el socio la activó. Sin VAPID configurado, no hace nada.
// ============================================================

const PUBLIC = process.env.VAPID_PUBLIC_KEY ?? '';
const PRIVATE = process.env.VAPID_PRIVATE_KEY ?? '';
const enabled = Boolean(PUBLIC && PRIVATE);
if (enabled) webpush.setVapidDetails('mailto:soporte@grupo3i.com', PUBLIC, PRIVATE);

export const vapidPublicKey = (): string => PUBLIC;

export async function sendPushToMember(
  memberId: string,
  payload: { title: string; body: string; link?: string | null },
): Promise<void> {
  if (!enabled) return;
  const subs = await prisma.pushSubscription.findMany({ where: { memberId } });
  const data = JSON.stringify({ title: payload.title, body: payload.body, url: payload.link || '/oficina/dashboard' });
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, data, { TTL: 86400 });
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        // 404/410: el navegador anuló la suscripción (desinstaló, revocó el permiso).
        if (code === 404 || code === 410) await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        else console.error('push', code ?? err);
      }
    }),
  );
}

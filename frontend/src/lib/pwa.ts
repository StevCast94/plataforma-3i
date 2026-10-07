// ============================================================
// Instalación de la app (PWA), notificaciones push y ubicación.
// El evento beforeinstallprompt llega una sola vez y muy temprano: se captura
// aquí al cargar (importado desde main.tsx) y lo usan el banner y los pasos
// de la oficina.
// ============================================================
import { api } from '@/lib/api';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((f) => f());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    emit();
  });
}

/** Avisa cuando cambia la disponibilidad del instalador. Devuelve la función para desuscribirse. */
export function onInstallChange(f: () => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}

export const canPromptInstall = () => deferred !== null;

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

/** Abre el instalador nativo (Android, Chrome, Edge). */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const ev = deferred;
  await ev.prompt();
  const { outcome } = await ev.userChoice;
  deferred = null;
  emit();
  return outcome === 'accepted';
}

export const pushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** ¿Este dispositivo ya está suscrito a las notificaciones? */
export async function pushEnabled(): Promise<boolean> {
  if (!pushSupported() || Notification.permission !== 'granted') return false;
  const reg = await navigator.serviceWorker.getRegistration();
  return Boolean(await reg?.pushManager.getSubscription());
}

/** Pide permiso y suscribe este dispositivo. Devuelve el resultado para mostrarlo. */
export async function enablePush(): Promise<'ok' | 'denied' | 'unsupported' | 'error'> {
  if (!pushSupported()) return 'unsupported';
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return 'denied';
    const { key } = await api.get<{ key: string | null }>('/members/push/key');
    if (!key) return 'error';
    const reg = await navigator.serviceWorker.ready;
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) as BufferSource }));
    await api.post('/members/push/subscribe', sub.toJSON());
    return 'ok';
  } catch {
    return 'error';
  }
}

/** Estado del permiso de ubicación sin preguntar ('prompt' = aún no se ha pedido). */
export async function locationPermission(): Promise<PermissionState | 'unsupported'> {
  if (!('geolocation' in navigator)) return 'unsupported';
  try {
    const st = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return st.state;
  } catch {
    return 'prompt'; // Safari antiguo no expone el estado
  }
}

/** Pide la ubicación una vez para que el navegador muestre el permiso. */
export function requestLocation(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(false);
    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false),
      { timeout: 15000, maximumAge: 600000 },
    );
  });
}

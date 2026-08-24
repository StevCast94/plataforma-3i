import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Isotipo } from '@/components/brand/Isotipo';

// Evento no tipado por lib.dom (Chrome/Edge/Android). Se castea localmente.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'g3i_pwa_install_dismissed_until';
const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 14 días — no ser insistente

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

/**
 * Aviso para instalar la PWA. En Android/Chrome/Edge dispara el prompt nativo
 * (beforeinstallprompt); iOS Safari no soporta ese evento, así que muestra
 * instrucciones (no hay forma programática de disparar "Agregar a inicio" ahí).
 * Se posiciona a la izquierda para no chocar con el burbuja de WhatsApp ni con
 * el bottom-nav de la Oficina (ambos viven a la derecha / full-width abajo).
 */
export function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    if (Date.now() < dismissedUntil) return;

    if (isIos()) {
      setIosHint(true);
      setVisible(true);
      return;
    }

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + COOLDOWN_MS));
    setVisible(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Instalar la app de Grupo 3i"
      className="fixed bottom-24 left-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-2xl bg-primary p-4 text-white shadow-2xl ring-1 ring-white/10 md:bottom-6 md:left-6 md:right-auto"
    >
      <Isotipo className="h-9 w-9 flex-none" tone="light" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Instala la app de Grupo 3i</p>
        <p className="mt-0.5 text-xs text-white/70">
          {iosHint
            ? 'Toca Compartir y luego "Agregar a inicio" para acceso directo a tu oficina.'
            : 'Acceso directo a tus enlaces, comisiones y red desde tu pantalla de inicio.'}
        </p>
        {!iosHint && (
          <Button size="sm" className="mt-3" onClick={install}>
            <Download className="h-3.5 w-3.5" strokeWidth={2} /> Descargar app
          </Button>
        )}
        {iosHint && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-white/50">
            <Share className="h-3.5 w-3.5" strokeWidth={1.8} /> Safari → Compartir → Agregar a inicio
          </p>
        )}
      </div>
      <button
        onClick={dismiss}
        aria-label="Cerrar"
        className="flex-none cursor-pointer rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white"
      >
        <X className="h-4 w-4" strokeWidth={1.8} />
      </button>
    </div>
  );
}

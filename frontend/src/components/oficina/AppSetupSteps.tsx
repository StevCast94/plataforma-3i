import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Bell, Check, Download, MapPin, Share, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/shared/Toast';
import {
  canPromptInstall,
  enablePush,
  isIos,
  isStandalone,
  locationPermission,
  onInstallChange,
  promptInstall,
  pushEnabled,
  pushSupported,
  requestLocation,
} from '@/lib/pwa';

// ============================================================
// "Prepara tu app": instalar la app, activar notificaciones y ubicación.
// Va arriba en el dashboard hasta completar los tres pasos y, mientras falte
// alguno, aparece además como ventana una vez al día para insistir.
// ============================================================

const NUDGE_KEY = 'g3i_setup_nudge_at';
const DAY = 24 * 60 * 60 * 1000;

interface State {
  installed: boolean;
  canInstall: boolean;
  push: boolean;
  pushBlocked: boolean;
  location: boolean;
  locationBlocked: boolean;
}

function useSetupState() {
  const [s, setS] = useState<State | null>(null);
  const refresh = useCallback(async () => {
    const [push, loc] = await Promise.all([pushEnabled(), locationPermission()]);
    setS({
      installed: isStandalone(),
      canInstall: canPromptInstall(),
      push,
      pushBlocked: pushSupported() && Notification.permission === 'denied',
      location: loc === 'granted',
      locationBlocked: loc === 'denied',
    });
  }, []);
  useEffect(() => {
    refresh();
    const off = onInstallChange(refresh);
    const onVis = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      off();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [refresh]);
  return { s, refresh };
}

export function AppSetupSteps() {
  const { s, refresh } = useSetupState();
  const { toast } = useToast();
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState('');

  const done = s ? [s.installed, s.push, s.location].filter(Boolean).length : 0;
  const complete = done === 3;

  // Recordatorio diario mientras falte algún paso.
  useEffect(() => {
    if (!s || complete) return;
    let last = 0;
    try {
      last = Number(localStorage.getItem(NUDGE_KEY) ?? 0);
    } catch {
      /* sin almacenamiento */
    }
    if (Date.now() - last > DAY) {
      const id = setTimeout(() => setModal(true), 1500);
      return () => clearTimeout(id);
    }
  }, [s, complete]);

  const closeModal = () => {
    try {
      localStorage.setItem(NUDGE_KEY, String(Date.now()));
    } catch {
      /* sin almacenamiento */
    }
    setModal(false);
  };

  if (!s || complete) return null;

  async function install() {
    setBusy('install');
    await promptInstall();
    setBusy('');
    refresh();
  }

  async function notifications() {
    setBusy('push');
    const r = await enablePush();
    setBusy('');
    if (r === 'ok') toast('Notificaciones activadas ✅', 'success');
    else if (r === 'denied') toast('Las bloqueaste. Actívalas en los ajustes del navegador para este sitio.', 'error');
    else if (r === 'unsupported')
      toast(
        isIos()
          ? 'En iPhone primero instala la app y ábrela desde tu pantalla de inicio.'
          : 'Este navegador no admite notificaciones.',
        'error',
      );
    else toast('No pudimos activarlas. Inténtalo de nuevo.', 'error');
    refresh();
  }

  async function location() {
    setBusy('loc');
    const ok = await requestLocation();
    setBusy('');
    toast(
      ok ? 'Ubicación activada ✅' : 'Permite la ubicación en los ajustes del navegador para este sitio.',
      ok ? 'success' : 'error',
    );
    refresh();
  }

  const installText = s.installed
    ? 'Listo: ya la usas como app.'
    : isIos()
      ? 'En Safari toca Compartir y luego "Agregar a inicio". Después abre la app desde tu pantalla.'
      : s.canInstall
        ? 'Acceso directo a tu oficina, más rápido y con notificaciones.'
        : 'Abre el menú del navegador (⋮) y elige "Instalar app" o "Agregar a pantalla de inicio".';

  const steps = (
    <ol className="mt-4 space-y-3">
      <Step
        icon={Smartphone}
        done={s.installed}
        title="Instala la app"
        text={installText}
        action={
          !isIos() && s.canInstall ? (
            <Button size="sm" onClick={install} disabled={busy === 'install'}>
              <Download className="h-3.5 w-3.5" /> Instalar
            </Button>
          ) : isIos() ? (
            <Share className="h-5 w-5 text-accent" />
          ) : null
        }
      />
      <Step
        icon={Bell}
        done={s.push}
        title="Activa las notificaciones"
        text={
          s.pushBlocked
            ? 'Están bloqueadas: actívalas en los ajustes del navegador para grupo3i.com.'
            : 'Te avisamos al instante cuando alguien se inscribe con tu enlace o ganas una comisión.'
        }
        action={
          !s.pushBlocked ? (
            <Button size="sm" onClick={notifications} disabled={busy === 'push'}>
              Activar
            </Button>
          ) : null
        }
      />
      <Step
        icon={MapPin}
        done={s.location}
        title="Permite tu ubicación"
        text={
          s.locationBlocked
            ? 'Está bloqueada: actívala en los ajustes del navegador para grupo3i.com.'
            : 'Para verte en el mapa de los solares cuando visites los proyectos con tus clientes.'
        }
        action={
          !s.locationBlocked ? (
            <Button size="sm" variant="outline" onClick={location} disabled={busy === 'loc'}>
              Permitir
            </Button>
          ) : null
        }
      />
    </ol>
  );

  const header = (
    <div className="flex items-center justify-between gap-3 pr-6">
      <div>
        <p className="text-lg font-semibold text-primary">Prepara tu app</p>
        <p className="text-sm text-brand-gray">{done} de 3 pasos · no te pierdas ningún referido ni comisión</p>
      </div>
      <div className="h-2 w-20 flex-none overflow-hidden rounded-full bg-black/10">
        <div className="h-full bg-secondary transition-all" style={{ width: `${(done / 3) * 100}%` }} />
      </div>
    </div>
  );

  return (
    <>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-2 ring-secondary/60">
        {header}
        {steps}
      </div>
      {modal && (
        <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-black/50 p-4 sm:items-center" role="dialog">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={closeModal}
              aria-label="Cerrar"
              className="absolute right-3 top-3 rounded-full p-1 text-brand-gray hover:bg-light"
            >
              <X className="h-5 w-5" />
            </button>
            {header}
            {steps}
            <button onClick={closeModal} className="mt-4 w-full text-center text-sm text-brand-gray underline">
              Recordármelo mañana
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Step({
  icon: Icon,
  done,
  title,
  text,
  action,
}: {
  icon: typeof Bell;
  done: boolean;
  title: string;
  text: string;
  action: ReactNode;
}) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${
          done ? 'bg-green-100 text-green-700' : 'bg-secondary/20 text-primary'
        }`}
      >
        {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${done ? 'text-brand-gray line-through' : 'text-primary'}`}>{title}</p>
        <p className="text-xs text-brand-gray">{text}</p>
      </div>
      {!done && action}
    </li>
  );
}

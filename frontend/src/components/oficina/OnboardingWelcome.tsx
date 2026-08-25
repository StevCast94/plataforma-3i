import { useEffect, useState } from 'react';
import { ClipboardPen, Link2, HandCoins, type LucideIcon } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Isotipo } from '@/components/brand/Isotipo';
import type { ReferralMember } from '@shared/types';

const steps: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Link2, title: 'Comparte tu enlace', body: 'Ya está listo más abajo — cópialo o mándalo directo por WhatsApp.' },
  { icon: ClipboardPen, title: 'Tu invitado se registra', body: 'Entra por tu enlace y queda vinculado a ti automáticamente.' },
  { icon: HandCoins, title: 'Tú ganas comisión', body: 'Por cada membresía o propiedad que compre tu red.' },
];

const KEY_PREFIX = 'g3i_onboarding_seen_';

/**
 * Modal de bienvenida SOLO la primera vez que un socio entra a su dashboard.
 * Antes caía directo a un panel vacío sin ninguna explicación de qué hacer
 * primero — esto lo apunta de entrada al enlace de referido, que es la
 * acción que de verdad importa.
 */
export function OnboardingWelcome({ member }: { member: ReferralMember }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(KEY_PREFIX + member.id);
      if (!seen) setOpen(true);
    } catch {
      /* localStorage no disponible: no bloquea el dashboard, solo no se ve el modal */
    }
  }, [member.id]);

  function dismiss() {
    try {
      localStorage.setItem(KEY_PREFIX + member.id, '1');
    } catch {
      /* noop */
    }
    setOpen(false);
  }

  const firstName = member.fullName.split(' ')[0];

  return (
    <Modal open={open} onClose={dismiss}>
      <div className="flex flex-col items-center text-center">
        <Isotipo animation="ascenso" className="h-14 w-auto" title="Grupo 3i" />
        <h2 className="mt-4 text-2xl text-primary">¡Bienvenido, {firstName}!</h2>
        <p className="mt-1 text-sm text-brand-gray">
          Así funciona tu oficina virtual en 3 pasos.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {steps.map((s, i) => (
          <div key={s.title} className="flex items-start gap-3">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-light text-accent ring-1 ring-secondary/30">
              <s.icon className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-sm font-semibold text-primary">
                {i + 1}. {s.title}
              </p>
              <p className="text-sm text-brand-gray">{s.body}</p>
            </div>
          </div>
        ))}
      </div>

      <Button
        className="mt-7 w-full"
        onClick={() => {
          dismiss();
          document.getElementById('mi-enlace')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      >
        Ver mi enlace
      </Button>
    </Modal>
  );
}

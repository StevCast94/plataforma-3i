import { Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ReferralMember } from '@shared/types';
import { useDismissed } from '@/lib/dismiss';

// Temporada de lanzamiento (misma fecha que backend/src/lib/launchPromo.ts).
export const LAUNCH_PROMO_END = new Date('2027-03-01T05:00:00Z');
export const isLaunchPromoActive = () => Date.now() < LAUNCH_PROMO_END.getTime();

/**
 * Promoción de lanzamiento: al Premiere le invita a inscribir su primer
 * referido; a quien ya lo hizo le muestra la nota de regalo con la condición
 * para conservar el nivel Elite al cerrar la temporada.
 */
export function LaunchPromoCard({ member }: { member: Pick<ReferralMember, 'id' | 'status' | 'eliteBy'> }) {
  const gifted = member.eliteBy === 'LAUNCH_PROMO';
  // El aviso de «ya eres Elite» se cierra con «Entendido»; la invitación a
  // inscribir el primer referido no, porque es el objetivo de la promoción.
  const [seen, dismiss] = useDismissed(`launch_gift_feb2027_${member.id}`);
  if (gifted && seen) return null;
  if (!gifted && (!isLaunchPromoActive() || member.status !== 'PREMIERE')) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/85 p-6 text-white shadow-lg">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-secondary text-primary">
          <Gift className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary">Regalo de lanzamiento</p>
          {gifted ? (
            <>
              <p className="mt-1 font-serif text-2xl font-bold">¡Ya eres Elite! 🎉</p>
              <p className="mt-2 text-sm text-white/80">
                Por inscribir a tu primer referido te regalamos el ascenso: desde ahora ganas{' '}
                <strong className="text-white">4% y 2%</strong> en comisiones inmobiliarias (antes 2% y 1%).
              </p>
              <p className="mt-2 text-sm text-white/80">
                Para conservarlo después del <strong className="text-white">28 de febrero de 2027</strong>, consigue
                que al menos uno de tus referidos compra. Si no, vuelves a Premiere y lo que ya ganaste como Elite se
                mantiene.
              </p>
              <button
                type="button"
                onClick={dismiss}
                className="mt-4 rounded-full bg-secondary px-5 py-2 text-sm font-semibold text-primary"
              >
                Entendido
              </button>
            </>
          ) : (
            <>
              <p className="mt-1 font-serif text-2xl font-bold">Completa tu primer referido y sube a Elite</p>
              <p className="mt-2 text-sm text-white/80">
                Cuando alguien se registre con tu enlace, subes a Elite: comisiones de{' '}
                <strong className="text-white">4% y 2%</strong> en vez de 2% y 1%.
              </p>
              <Link
                to="/oficina/herramientas"
                className="mt-4 inline-block rounded-full bg-secondary px-5 py-2 text-sm font-semibold text-primary"
              >
                Compartir mi enlace
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

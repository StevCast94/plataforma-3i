import { Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ReferralMember } from '@shared/types';

// Temporada de lanzamiento (misma fecha que backend/src/lib/launchPromo.ts).
export const LAUNCH_PROMO_END = new Date('2026-11-08T05:00:00Z');
export const isLaunchPromoActive = () => Date.now() < LAUNCH_PROMO_END.getTime();

/**
 * Promoción de lanzamiento: al Premiere le invita a inscribir su primer
 * referido; a quien ya lo hizo le muestra la nota de regalo con la condición
 * para conservar el nivel Elite al cerrar la temporada.
 */
export function LaunchPromoCard({ member }: { member: Pick<ReferralMember, 'status' | 'eliteBy'> }) {
  const gifted = member.eliteBy === 'LAUNCH_PROMO';
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
                Para conservarlo después del <strong className="text-white">7 de noviembre</strong>, consigue al
                menos 1 venta en la temporada, tuya o de uno de tus referidos. Si no, vuelves a Premiere y lo que
                ya ganaste como Elite se mantiene.
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 font-serif text-2xl font-bold">Inscribe a tu primer referido y sube a Elite</p>
              <p className="mt-2 text-sm text-white/80">
                Hasta el 7 de noviembre, cuando alguien se registre con tu enlace te regalamos el ascenso a Elite:
                comisiones de <strong className="text-white">4% y 2%</strong> en vez de 2% y 1%.
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

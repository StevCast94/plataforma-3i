import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import {
  ELITE_REFERRALS_REQUIRED,
  ELITE_REFERRALS_WINDOW_DAYS,
  daysRemaining,
} from '@/lib/referral';
import type { ReferralMember } from '@shared/types';

/** Barra de progreso a Elite (solo para Premiere). */
export function ProgressToElite({ member }: { member: ReferralMember }) {
  if (member.status !== 'PREMIERE') return null;

  const count = Math.min(member.referralsCountToElite, ELITE_REFERRALS_REQUIRED);
  const pct = (count / ELITE_REFERRALS_REQUIRED) * 100;
  const remaining = daysRemaining(member.eliteSince ?? member.createdAt, ELITE_REFERRALS_WINDOW_DAYS);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary">Tu camino a Elite</h3>
        <span className="text-sm text-brand-gray">
          {count} de {ELITE_REFERRALS_REQUIRED} referidos
        </span>
      </div>

      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-light">
        <div
          className="h-full rounded-full bg-gradient-to-r from-secondary to-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-3 text-sm text-brand-gray">
        Te quedan <strong className="text-primary">{remaining} días</strong> de tu ventana de{' '}
        {ELITE_REFERRALS_WINDOW_DAYS} días. Al llegar a {ELITE_REFERRALS_REQUIRED} referidos exitosos
        asciendes a Elite y obtienes tu membresía de viajes <strong>GRATIS</strong>.
      </p>

      <Link to="/oficina/calculadora" className="mt-4 inline-block">
        <Button variant="outline" size="sm">
          Ver cómo llegar a Elite
        </Button>
      </Link>
    </div>
  );
}

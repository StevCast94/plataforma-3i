import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const DISMISS_KEY = 'g3i_ref_banner_dismissed';

/**
 * Banner global "Te invitó X" — visible en CUALQUIER página mientras haya un
 * referido activo (cookie/localStorage) y el visitante aún no sea socio.
 * El endpoint /referral/current ya existía para esto pero nunca se consumía;
 * antes el nombre del referidor solo se mostraba en Registro y Checkout.
 */
export function ReferralBanner() {
  const { isAuthenticated } = useAuth();
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === '1',
  );

  useEffect(() => {
    if (isAuthenticated || dismissed) return;
    api
      .get<{ code: string | null; firstName?: string }>('/referral/current')
      .then((r) => {
        if (r?.code && r.firstName) setReferrerName(r.firstName);
      })
      .catch(() => {});
  }, [isAuthenticated, dismissed]);

  if (isAuthenticated || dismissed || !referrerName) return null;

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }

  return (
    <div className="flex items-center justify-center gap-3 bg-secondary/20 px-4 py-2.5 text-center text-sm text-primary print:hidden">
      <span>
        Te invitó <strong>{referrerName}</strong> al Club 3i —{' '}
        <Link to="/oficina/registro" className="font-semibold underline hover:text-accent">
          crea tu cuenta gratis
        </Link>
      </span>
      <button
        onClick={dismiss}
        aria-label="Cerrar"
        className="cursor-pointer rounded-full p-1 text-brand-gray hover:bg-black/5 hover:text-primary"
      >
        <X className="h-4 w-4" strokeWidth={1.8} />
      </button>
    </div>
  );
}

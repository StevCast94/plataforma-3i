import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';

const KEY = 'grupo3i_ref';

/**
 * Atribución de referido persistente:
 * 1. Si llega `?ref=CÓDIGO`, lo guarda en localStorage (90d de facto) y avisa al
 *    backend (`/referral/track`) para fijar la cookie httpOnly first-touch.
 * 2. Si no hay ?ref ni código local, consulta `/referral/current`: si el
 *    visitante entró por un enlace /r/CÓDIGO (cookie ya seteada), recupera el
 *    código para mostrar el banner "te refiere X" y atribuir sus leads.
 * Devuelve el código activo.
 */
export function useReferral(): string | null {
  const [params] = useSearchParams();

  useEffect(() => {
    const ref = params.get('ref');
    if (ref) {
      const code = ref.trim();
      try {
        localStorage.setItem(KEY, code);
      } catch {
        /* almacenamiento no disponible */
      }
      api.post('/referral/track', { code }).catch(() => {});
      return;
    }
    // Sin ?ref: si tampoco hay código local, intentar recuperarlo de la cookie.
    if (!getReferralCode()) {
      api
        .get<{ code: string | null }>('/referral/current')
        .then((r) => {
          if (r?.code) {
            try {
              localStorage.setItem(KEY, r.code);
            } catch {
              /* noop */
            }
          }
        })
        .catch(() => {});
    }
  }, [params]);

  return getReferralCode();
}

/** Lectura puntual del código de referido guardado (sin hook). */
export function getReferralCode(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

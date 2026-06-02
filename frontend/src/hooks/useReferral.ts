import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const KEY = 'grupo3i_ref';

/**
 * Lee el código de referido de `?ref=3IP-XXXXXX` y lo persiste en sessionStorage
 * para que sobreviva a la navegación entre páginas. Devuelve el código activo.
 */
export function useReferral(): string | null {
  const [params] = useSearchParams();

  useEffect(() => {
    const ref = params.get('ref');
    if (ref) {
      sessionStorage.setItem(KEY, ref.trim());
    }
  }, [params]);

  return getReferralCode();
}

/** Lectura puntual del código de referido guardado (sin hook). */
export function getReferralCode(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

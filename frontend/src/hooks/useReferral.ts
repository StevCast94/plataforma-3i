import { useEffect, useState } from 'react';
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
  // El código vive en estado, no solo en localStorage: quien llega por /r/:slug
  // lo recibe de forma asíncrona desde la cookie, y sin estado el componente
  // nunca volvía a renderizar (por eso el badge "Te invitó X" no aparecía).
  const [code, setCode] = useState<string | null>(() => getReferralCode());

  useEffect(() => {
    const ref = params.get('ref');
    if (ref) {
      const fromUrl = ref.trim();
      try {
        localStorage.setItem(KEY, fromUrl);
      } catch {
        /* almacenamiento no disponible */
      }
      setCode(fromUrl);
      api.post('/referral/track', { code: fromUrl }).catch(() => {});
      return;
    }
    // Sin ?ref: si tampoco hay código local, intentar recuperarlo de la cookie.
    if (getReferralCode()) return;

    let cancelled = false;
    api
      .get<{ code: string | null }>('/referral/current')
      .then((r) => {
        if (cancelled || !r?.code) return;
        try {
          localStorage.setItem(KEY, r.code);
        } catch {
          /* noop */
        }
        setCode(r.code);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [params]);

  return code;
}

/** Lectura puntual del código de referido guardado (sin hook). */
export function getReferralCode(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/**
 * Fija el código a mano (form "¿Alguien te invitó?" del registro, para quien
 * llegó SIN pasar por un enlace /r/:slug — ej. alguien que le dio su código
 * de palabra en persona). No pisa una cookie de link ya existente: el
 * registro solo muestra este campo cuando useReferral() todavía es null.
 */
export function setManualReferralCode(code: string): void {
  try {
    localStorage.setItem(KEY, code);
  } catch {
    /* almacenamiento no disponible */
  }
}

/** Quita el código guardado a mano (si el visitante lo borra del campo). */
export function clearManualReferralCode(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

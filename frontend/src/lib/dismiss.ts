import { useCallback, useState } from 'react';

// Avisos que el socio puede cerrar con «Entendido». Se recuerda en este
// dispositivo; la clave incluye el socio y la versión del aviso, así un aviso
// nuevo (otra clave) vuelve a mostrarse.
export function useDismissed(key: string): [boolean, () => void] {
  const full = `g3i_dismiss_${key}`;
  const [dismissed, set] = useState(() => {
    try { return localStorage.getItem(full) === '1'; } catch { return false; }
  });
  const dismiss = useCallback(() => {
    try { localStorage.setItem(full, '1'); } catch { /* sin almacenamiento: se oculta solo en esta vista */ }
    set(true);
  }, [full]);
  return [dismissed, dismiss];
}

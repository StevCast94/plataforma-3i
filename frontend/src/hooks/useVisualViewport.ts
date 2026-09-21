import { useEffect, useState } from 'react';

/**
 * Tamaño y desplazamiento del área realmente visible del navegador.
 *
 * En el teléfono, el teclado no encoge `window.innerHeight`: un elemento
 * `position: fixed` sigue midiendo la pantalla entera y la mitad inferior
 * queda debajo del teclado. `visualViewport` sí reporta lo que se ve, así que
 * un diálogo que se dimensione con estos valores mantiene a la vista el campo
 * que se está escribiendo.
 */
export function useVisualViewport() {
  const read = () => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    return {
      height: vv?.height ?? (typeof window !== 'undefined' ? window.innerHeight : 0),
      offsetTop: vv?.offsetTop ?? 0,
    };
  };

  const [size, setSize] = useState(read);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onChange = () => setSize(read());
    vv.addEventListener('resize', onChange);
    vv.addEventListener('scroll', onChange);
    onChange();
    return () => {
      vv.removeEventListener('resize', onChange);
      vv.removeEventListener('scroll', onChange);
    };
  }, []);

  return size;
}

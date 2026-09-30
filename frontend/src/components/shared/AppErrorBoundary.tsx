import { Component, type ReactNode } from 'react';

const RELOAD_KEY = 'g3i_chunk_reload';

/** ¿El error es por un archivo de una versión anterior que ya no existe tras un despliegue? */
export function isChunkError(err: unknown): boolean {
  const msg = String((err as Error)?.message ?? err ?? '');
  return /dynamically imported module|Importing a module script failed|Failed to fetch|error loading dynamically|MIME type/i.test(msg);
}

/**
 * Recarga la página una sola vez (por minuto) para traer la versión nueva.
 * El límite evita un bucle si el problema fuera otro.
 */
export function reloadForNewVersion(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < 60_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    /* sin almacenamiento: se recarga igual */
  }
  window.location.reload();
  return true;
}

// Vite avisa cuando no pudo cargar un archivo de la app (típico tras publicar una versión nueva).
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (e) => {
    e.preventDefault();
    reloadForNewVersion();
  });
}

interface State {
  error: unknown;
}

/** Nunca deja la pantalla en blanco: recarga si hay versión nueva, o muestra un aviso con salida. */
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error };
  }

  componentDidCatch(error: unknown) {
    if (isChunkError(error)) reloadForNewVersion();
    else console.error(error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-light px-6 text-center">
        <p className="font-serif text-2xl font-bold text-primary">Estamos actualizando la página</p>
        <p className="max-w-sm text-sm text-brand-gray">
          Publicamos una versión nueva mientras navegabas. Recarga para continuar donde estabas.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white"
        >
          Recargar
        </button>
      </div>
    );
  }
}

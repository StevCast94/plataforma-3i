// Fetch wrapper para el backend Express.
// En producción el frontend es servido por el mismo backend (mismo origen),
// así que basta con rutas relativas /api/...

const BASE = import.meta.env.VITE_API_URL ?? '';
const TOKEN_KEY = 'g3i_member_token';

// localStorage (no sessionStorage): la sesión debe sobrevivir a cerrar el
// navegador/app — es la app de un socio en SU celular, no una sesión compartida.
// El JWT ya vive 10 años (ver backend/authMember.ts), así que esto es lo que
// realmente lo mantiene 'logueado para siempre' en el dispositivo.
export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${BASE}/api${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* respuesta sin JSON */
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

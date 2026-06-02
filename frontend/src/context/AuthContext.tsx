import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api, setAuthToken, getAuthToken } from '@/lib/api';
import { getReferralCode } from '@/hooks/useReferral';
import type { AuthResponse, ReferralMember } from '@shared/types';

export interface RegisterData {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  docType: string;
  docId: string;
  payoutMethod?: string;
  payoutEmail?: string;
  bankInfo?: Record<string, unknown>;
}

interface AuthContextValue {
  member: ReferralMember | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<ReferralMember | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehidratar sesión si hay token guardado.
  useEffect(() => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }
    api
      .get<ReferralMember>('/members/me')
      .then(setMember)
      .catch(() => {
        setAuthToken(null);
        setMember(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<AuthResponse>('/members/login', { email, password });
    setAuthToken(res.token);
    setMember(res.member);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const ref = getReferralCode();
    const res = await api.post<AuthResponse>('/members/register', {
      ...data,
      ...(ref ? { ref } : {}),
    });
    setAuthToken(res.token);
    setMember(res.member);
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setMember(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!getAuthToken()) return;
    const me = await api.get<ReferralMember>('/members/me');
    setMember(me);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        member,
        loading,
        isAuthenticated: !!member,
        login,
        register,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

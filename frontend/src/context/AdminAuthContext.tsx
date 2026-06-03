import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { adminApi, setStaffToken, getStaffToken } from '@/lib/adminApi';

export interface StaffUser {
  staffId?: string;
  id?: string;
  username: string;
  role: string;
}

interface AdminAuthValue {
  staff: StaffUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isSuperadmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getStaffToken()) {
      setLoading(false);
      return;
    }
    adminApi
      .get<StaffUser>('/admin/me')
      .then(setStaff)
      .catch(() => {
        setStaffToken(null);
        setStaff(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await adminApi.post<{ token: string; staff: StaffUser }>('/admin/login', {
      username,
      password,
    });
    setStaffToken(res.token);
    setStaff(res.staff);
  }, []);

  const logout = useCallback(() => {
    setStaffToken(null);
    setStaff(null);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        staff,
        loading,
        isAuthenticated: !!staff,
        isSuperadmin: staff?.role === 'superadmin',
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

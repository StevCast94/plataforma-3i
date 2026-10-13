import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLang } from '@/hooks/useLang';
import { BrandLoader } from '@/components/brand/Isotipo';

/** Contenido solo para socios registrados (p. ej. el reglamento): sin sesión, lleva a la página del programa. */
export function MembersOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const { lang, t } = useLang();
  if (loading) return <BrandLoader className="min-h-[60vh]" label={t('Cargando…')} />;
  if (!isAuthenticated) return <Navigate to={lang === 'en' ? '/en/oficina/login' : '/oficina/login'} replace />;
  return <>{children}</>;
}

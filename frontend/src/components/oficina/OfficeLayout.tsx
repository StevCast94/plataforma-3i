import { Suspense } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { OfficeSidebar, OfficeBottomNav } from './OfficeSidebar';
import { OfficeHeader } from './OfficeHeader';
import { BrandLoader } from '@/components/brand/Isotipo';

export function OfficeLayout() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <BrandLoader className="min-h-screen" label="Cargando tu oficina…" />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/oficina/login" replace state={{ from: location.pathname }} />
    );
  }

  return (
    <div className="flex min-h-screen bg-light">
      <OfficeSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <OfficeHeader />
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 md:pb-8 lg:px-8">
          <Suspense fallback={<BrandLoader className="min-h-[50vh]" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <OfficeBottomNav />
    </div>
  );
}

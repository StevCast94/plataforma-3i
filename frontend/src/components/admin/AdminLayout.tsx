import { Suspense } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { BrandLoader } from '@/components/brand/Isotipo';
import { canOpen, homeFor } from '@/lib/adminNav';

export function AdminLayout() {
  const { isAuthenticated, loading, staff } = useAdminAuth();
  const { pathname } = useLocation();

  if (loading) {
    return <BrandLoader className="min-h-screen" label="Cargando panel…" />;
  }
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  // Cada rol solo abre sus secciones (el servidor también lo exige).
  if (!canOpen(pathname, staff?.role)) return <Navigate to={homeFor(staff?.role)} replace />;

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6">
          <Suspense fallback={<BrandLoader className="min-h-[50vh]" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

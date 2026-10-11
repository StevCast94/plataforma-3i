import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { getDevToken, setDevToken } from '@/lib/developerApi';
import { PanelClientContext, developerClient } from '@/lib/panelClient';
import { Shell } from './DeveloperPortalPage';

// Pantallas de lotes y vistas 360° del admin, servidas dentro del portal con el
// cliente del desarrollador (el backend solo le deja tocar sus proyectos).
const AdminLotsPage = lazy(() => import('@/pages/admin/AdminLotsPage'));
const AdminPanoramasPage = lazy(() => import('@/pages/admin/AdminPanoramasPage'));
const ProjectMetricsPage = lazy(() => import('@/pages/admin/ProjectMetricsPage'));

export default function DeveloperPanelPage({ view }: { view: 'lots' | 'panoramas' | 'metrics' }) {
  if (!getDevToken()) return <Navigate to="/desarrollador" replace />;
  return (
    <PanelClientContext.Provider value={developerClient}>
      <Shell
        onLogout={() => {
          setDevToken(null);
          location.href = '/desarrollador';
        }}
      >
        <Suspense fallback={<p className="text-sm text-brand-gray">Cargando…</p>}>
          {view === 'lots' ? <AdminLotsPage /> : view === 'metrics' ? <ProjectMetricsPage /> : <AdminPanoramasPage />}
        </Suspense>
      </Shell>
    </PanelClientContext.Provider>
  );
}

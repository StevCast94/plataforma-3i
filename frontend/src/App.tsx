import { lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Layout } from '@/components/layout/Layout';
import { OfficeLayout } from '@/components/oficina/OfficeLayout';
import { ToastProvider } from '@/components/shared/Toast';
import { AuthProvider } from '@/context/AuthContext';

// Sitio público
const HomePage = lazy(() => import('@/pages/landing/HomePage'));
const ProjectsPage = lazy(() => import('@/pages/landing/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('@/pages/landing/ProjectDetailPage'));
const AboutPage = lazy(() => import('@/pages/landing/AboutPage'));
const ContactPage = lazy(() => import('@/pages/landing/ContactPage'));
const ShopPage = lazy(() => import('@/pages/tienda/ShopPage'));
const ProductDetailPage = lazy(() => import('@/pages/tienda/ProductDetailPage'));
const ClubPage = lazy(() => import('@/pages/club/ClubPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Oficina virtual (programa de referidos)
const OfficeLanding = lazy(() => import('@/pages/oficina/OfficeLanding'));
const LoginPage = lazy(() => import('@/pages/oficina/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/oficina/RegisterPage'));
const DashboardPage = lazy(() => import('@/pages/oficina/DashboardPage'));
const NetworkPage = lazy(() => import('@/pages/oficina/NetworkPage'));
const CommissionsPage = lazy(() => import('@/pages/oficina/CommissionsPage'));
const PaymentsPage = lazy(() => import('@/pages/oficina/PaymentsPage'));
const ToolsPage = lazy(() => import('@/pages/oficina/ToolsPage'));
const CalculatorPage = lazy(() => import('@/pages/oficina/CalculatorPage'));

export default function App() {
  return (
    <HelmetProvider>
      <ToastProvider>
        <AuthProvider>
          <HashRouter>
            <Routes>
              {/* Sitio público con navbar/footer */}
              <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="proyectos" element={<ProjectsPage />} />
                <Route path="proyectos/:slug" element={<ProjectDetailPage />} />
                <Route path="tienda" element={<ShopPage />} />
                <Route path="tienda/:slug" element={<ProductDetailPage />} />
                <Route path="club" element={<ClubPage />} />
                <Route path="sobre-nosotros" element={<AboutPage />} />
                <Route path="contacto" element={<ContactPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* Oficina — páginas públicas (standalone, sin layout de oficina) */}
              <Route path="oficina" element={<OfficeLanding />} />
              <Route path="oficina/login" element={<LoginPage />} />
              <Route path="oficina/registro" element={<RegisterPage />} />

              {/* Oficina — páginas protegidas (con sidebar + header) */}
              <Route path="oficina" element={<OfficeLayout />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="mi-red" element={<NetworkPage />} />
                <Route path="comisiones" element={<CommissionsPage />} />
                <Route path="pagos" element={<PaymentsPage />} />
                <Route path="herramientas" element={<ToolsPage />} />
                <Route path="calculadora" element={<CalculatorPage />} />
              </Route>
            </Routes>
          </HashRouter>
        </AuthProvider>
      </ToastProvider>
    </HelmetProvider>
  );
}

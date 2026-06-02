import { lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Layout } from '@/components/layout/Layout';
import { ToastProvider } from '@/components/shared/Toast';

// Lazy loading de todas las páginas.
const HomePage = lazy(() => import('@/pages/landing/HomePage'));
const ProjectsPage = lazy(() => import('@/pages/landing/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('@/pages/landing/ProjectDetailPage'));
const AboutPage = lazy(() => import('@/pages/landing/AboutPage'));
const ContactPage = lazy(() => import('@/pages/landing/ContactPage'));
const ShopPage = lazy(() => import('@/pages/tienda/ShopPage'));
const ProductDetailPage = lazy(() => import('@/pages/tienda/ProductDetailPage'));
const ClubPage = lazy(() => import('@/pages/club/ClubPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export default function App() {
  return (
    <HelmetProvider>
      <ToastProvider>
        <HashRouter>
          <Routes>
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
          </Routes>
        </HashRouter>
      </ToastProvider>
    </HelmetProvider>
  );
}

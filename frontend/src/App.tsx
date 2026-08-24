import { lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Layout } from '@/components/layout/Layout';
import { OfficeLayout } from '@/components/oficina/OfficeLayout';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { CommunityLayout } from '@/components/comunidad/CommunityLayout';
import { ToastProvider } from '@/components/shared/Toast';
import { AuthProvider } from '@/context/AuthContext';
import { AdminAuthProvider } from '@/context/AdminAuthContext';
import { InstallAppBanner } from '@/components/shared/InstallAppBanner';

// Sitio público
const HomePage = lazy(() => import('@/pages/landing/HomePage'));
const ProjectsPage = lazy(() => import('@/pages/landing/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('@/pages/landing/ProjectDetailPage'));
const AboutPage = lazy(() => import('@/pages/landing/AboutPage'));
const ContactPage = lazy(() => import('@/pages/landing/ContactPage'));
const ShopPage = lazy(() => import('@/pages/tienda/ShopPage'));
const ProductDetailPage = lazy(() => import('@/pages/tienda/ProductDetailPage'));
const ClubPage = lazy(() => import('@/pages/club/ClubPage'));
const ViajesPage = lazy(() => import('@/pages/club/ViajesPage'));
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
const TravelBookingsPage = lazy(() => import('@/pages/oficina/TravelBookingsPage'));
const ReglamentoPage = lazy(() => import('@/pages/legal/ReglamentoPage'));
const PurchaseConfirmationPage = lazy(() => import('@/pages/legal/PurchaseConfirmationPage'));

// Panel de administración (staff)
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage'));
const AdminProjectsPage = lazy(() => import('@/pages/admin/AdminProjectsPage'));
const AdminMembersPage = lazy(() => import('@/pages/admin/AdminMembersPage'));
const AdminCommissionsPage = lazy(() => import('@/pages/admin/AdminCommissionsPage'));
const AdminLeadsPage = lazy(() => import('@/pages/admin/AdminLeadsPage'));
const AdminMarketingPage = lazy(() => import('@/pages/admin/AdminMarketingPage'));
const AdminPayoutsPage = lazy(() => import('@/pages/admin/AdminPayoutsPage'));
const AdminPurchasesPage = lazy(() => import('@/pages/admin/AdminPurchasesPage'));
const AdminReportsPage = lazy(() => import('@/pages/admin/AdminReportsPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'));
const AdminTravelClaimsPage = lazy(() => import('@/pages/admin/AdminTravelClaimsPage'));
const AdminSupportPage = lazy(() => import('@/pages/admin/AdminSupportPage'));

// Comunidad (red social)
const CommunityFeedPage = lazy(() => import('@/pages/comunidad/CommunityFeedPage'));
const PostDetailPage = lazy(() => import('@/pages/comunidad/PostDetailPage'));
const ProfilePage = lazy(() => import('@/pages/comunidad/ProfilePage'));
const GroupsPage = lazy(() => import('@/pages/comunidad/GroupsPage'));
const GroupDetailPage = lazy(() => import('@/pages/comunidad/GroupDetailPage'));
const EventsPage = lazy(() => import('@/pages/comunidad/EventsPage'));
const EventDetailPage = lazy(() => import('@/pages/comunidad/EventDetailPage'));
const MembersPage = lazy(() => import('@/pages/comunidad/MembersPage'));
const MessagesPage = lazy(() => import('@/pages/comunidad/MessagesPage'));
const MessageConversation = lazy(() => import('@/pages/comunidad/MessageConversation'));

export default function App() {
  return (
    <HelmetProvider>
      <ToastProvider>
        <AuthProvider>
          <AdminAuthProvider>
          <InstallAppBanner />
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
                <Route path="club/viajes" element={<ViajesPage />} />
                <Route path="sobre-nosotros" element={<AboutPage />} />
                <Route path="contacto" element={<ContactPage />} />
                <Route path="reglamento" element={<ReglamentoPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* Comprobante de compra — público, standalone, imprimible (se comparte por WhatsApp) */}
              <Route path="confirmacion/:id" element={<PurchaseConfirmationPage />} />

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
                <Route path="viajes" element={<TravelBookingsPage />} />
              </Route>

              {/* Admin — login standalone */}
              <Route path="admin/login" element={<AdminLoginPage />} />

              {/* Admin — protegido (sidebar + header) */}
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="productos" element={<AdminProductsPage />} />
                <Route path="proyectos" element={<AdminProjectsPage />} />
                <Route path="miembros" element={<AdminMembersPage />} />
                <Route path="leads" element={<AdminLeadsPage />} />
                <Route path="marketing" element={<AdminMarketingPage />} />
                <Route path="comisiones" element={<AdminCommissionsPage />} />
                <Route path="retiros" element={<AdminPayoutsPage />} />
                <Route path="compras" element={<AdminPurchasesPage />} />
                <Route path="reportes" element={<AdminReportsPage />} />
                <Route path="garantias" element={<AdminTravelClaimsPage />} />
                <Route path="soporte" element={<AdminSupportPage />} />
                <Route path="configuracion" element={<AdminSettingsPage />} />
              </Route>

              {/* Comunidad (red social) — layout con navbar + sub-nav */}
              <Route path="comunidad" element={<CommunityLayout />}>
                <Route index element={<CommunityFeedPage />} />
                <Route path="post/:id" element={<PostDetailPage />} />
                <Route path="perfil/:code" element={<ProfilePage />} />
                <Route path="grupos" element={<GroupsPage />} />
                <Route path="grupos/:slug" element={<GroupDetailPage />} />
                <Route path="eventos" element={<EventsPage />} />
                <Route path="eventos/:id" element={<EventDetailPage />} />
                <Route path="miembros" element={<MembersPage />} />
                <Route path="mensajes" element={<MessagesPage />} />
                <Route path="mensajes/:code" element={<MessageConversation />} />
              </Route>
            </Routes>
          </HashRouter>
          </AdminAuthProvider>
        </AuthProvider>
      </ToastProvider>
    </HelmetProvider>
  );
}

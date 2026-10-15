import { lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TRAVEL_ENABLED } from '@/lib/features';
import { MembersOnly } from '@/components/oficina/MembersOnly';
import { HelmetProvider } from 'react-helmet-async';
import { Layout } from '@/components/layout/Layout';
import { OfficeLayout } from '@/components/oficina/OfficeLayout';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { isBosqueHost } from '@/lib/bosque';
import { isCustomMapHost } from '@/lib/mapHost';
import { CommunityLayout } from '@/components/comunidad/CommunityLayout';
import { ToastProvider } from '@/components/shared/Toast';
import { AuthProvider } from '@/context/AuthContext';
import { AdminAuthProvider } from '@/context/AdminAuthContext';
import { InstallAppBanner } from '@/components/shared/InstallAppBanner';
import { RefSessionNotice } from '@/components/shared/RefSessionNotice';
import { Tracking } from '@/components/shared/Tracking';

// Sitio público
const HomePage = lazy(() => import('@/pages/landing/HomePage'));
const ProjectsPage = lazy(() => import('@/pages/landing/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('@/pages/landing/ProjectDetailPage'));
const IbizaPage = lazy(() => import('@/pages/landing/IbizaPage'));
const PropuestaMontanitaPage = lazy(() => import('@/pages/landing/PropuestaMontanitaPage'));
const AboutPage = lazy(() => import('@/pages/landing/AboutPage'));
const ContactPage = lazy(() => import('@/pages/landing/ContactPage'));
const PublishProjectPage = lazy(() => import('@/pages/landing/PublishProjectPage'));
const DeveloperManualPage = lazy(() => import('@/pages/landing/DeveloperManualPage'));
const DeveloperGalleryPage = lazy(() => import('@/pages/landing/DeveloperGalleryPage'));
const ProposalPage = lazy(() => import('@/pages/landing/ProposalPage'));
const ServicesPage = lazy(() => import('@/pages/landing/ServicesPage'));
const ServiceQuotePage = lazy(() => import('@/pages/landing/ServiceQuotePage'));
const CaseTrackingPage = lazy(() => import('@/pages/landing/CaseTrackingPage'));
const AdminServicesPage = lazy(() => import('@/pages/admin/services/AdminServicesPage'));
const AdminCasePage = lazy(() => import('@/pages/admin/services/AdminCasePage'));
const EmbedMapPage = lazy(() => import('@/pages/landing/EmbedMapPage'));
const CustomDomainMap = lazy(() => import('@/pages/landing/CustomDomainMap'));
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
const PrivacyPage = lazy(() => import('@/pages/legal/PrivacyPage'));
const TermsPage = lazy(() => import('@/pages/legal/TermsPage'));
const PurchaseConfirmationPage = lazy(() => import('@/pages/legal/PurchaseConfirmationPage'));

// Panel de administración (staff)
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage'));
const AdminProjectsPage = lazy(() => import('@/pages/admin/AdminProjectsPage'));
const AdminLotsPage = lazy(() => import('@/pages/admin/AdminLotsPage'));
const AdminPanoramasPage = lazy(() => import('@/pages/admin/AdminPanoramasPage'));
const AdminFiestaPage = lazy(() => import('@/pages/admin/AdminFiestaPage'));
const AdminDeveloperSalesPage = lazy(() => import('@/pages/admin/AdminDeveloperSales'));
const AdminTeamPage = lazy(() => import('@/pages/admin/AdminTeamPage'));
const AdminCampaignsPage = lazy(() => import('@/pages/admin/AdminCampaignsPage'));
const AdminDevelopersPage = lazy(() => import('@/pages/admin/AdminDevelopersPage'));
const ProjectMetricsPage = lazy(() => import('@/pages/admin/ProjectMetricsPage'));
const AdminCrmPage = lazy(() => import('@/pages/admin/AdminCrmPage'));
const DeveloperPortalPage = lazy(() => import('@/pages/desarrollador/DeveloperPortalPage'));
const DeveloperPanelPage = lazy(() => import('@/pages/desarrollador/DeveloperPanelPage'));
const AdminPropuestaPage = lazy(() => import('@/pages/admin/AdminPropuestaPage'));
const AdminMembersPage = lazy(() => import('@/pages/admin/AdminMembersPage'));
const AdminCommissionsPage = lazy(() => import('@/pages/admin/AdminCommissionsPage'));
const AdminMarketingPage = lazy(() => import('@/pages/admin/AdminMarketingPage'));
const AdminPayoutsPage = lazy(() => import('@/pages/admin/AdminPayoutsPage'));
const AdminPurchasesPage = lazy(() => import('@/pages/admin/AdminPurchasesPage'));
const AdminReportsPage = lazy(() => import('@/pages/admin/AdminReportsPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'));
const AdminTravelClaimsPage = lazy(() => import('@/pages/admin/AdminTravelClaimsPage'));
const AdminSupportPage = lazy(() => import('@/pages/admin/AdminSupportPage'));
const LotPage = lazy(() => import('@/pages/landing/LotPage'));
const CampaignLandingPage = lazy(() => import('@/pages/landing/CampaignLandingPage'));
const FiestaPage = lazy(() => import('@/pages/landing/FiestaPage'));
const AdminBosquePage = lazy(() => import('@/pages/admin/AdminBosquePage'));

// Bosque (adopta un árbol): landing con marca propia, vinculada a Grupo 3i
const BosqueLayout = lazy(() => import('@/pages/bosque/BosqueLayout'));
const BosqueHome = lazy(() => import('@/pages/bosque/BosqueHome'));
const BosqueTreePage = lazy(() => import('@/pages/bosque/BosqueTreePage'));
const BosqueCertificatePage = lazy(() => import('@/pages/bosque/BosqueCertificatePage'));
const BosqueTransparencyPage = lazy(() => import('@/pages/bosque/BosqueTransparencyPage'));
const BosqueTermsPage = lazy(() => import('@/pages/bosque/BosqueTermsPage'));

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

/**
 * Las rutas públicas, montadas dos veces: bajo "/" en español y bajo "/en" en
 * inglés. El idioma lo deduce cada página de la URL (ver hooks/useLang), así
 * que el mismo componente sirve para los dos.
 */
const publicRoutes = () => (
  <>
    <Route index element={<HomePage />} />
    <Route path="proyectos" element={<ProjectsPage />} />
    <Route path="ibiza" element={<IbizaPage />} />
    <Route path="proyectos/:slug" element={<ProjectDetailPage />} />
    <Route path="proyectos/:slug/lote/:code" element={<LotPage />} />
    <Route path="proyectos/:slug/solar/:code" element={<LotPage />} />
    <Route path="propuesta/montanita-view" element={<PropuestaMontanitaPage />} />
    <Route path="tienda" element={<Navigate to=".." replace />} />
    <Route path="tienda/:slug" element={<ProductDetailPage />} />
    <Route path="club" element={TRAVEL_ENABLED ? <ClubPage /> : <Navigate to="/oficina" replace />} />
    <Route path="club/viajes" element={TRAVEL_ENABLED ? <ViajesPage /> : <Navigate to="/oficina" replace />} />
    <Route path="sobre-nosotros" element={<AboutPage />} />
    <Route path="contacto" element={<ContactPage />} />
    <Route path="publica-tu-proyecto" element={<PublishProjectPage />} />
    <Route path="servicios" element={<ServicesPage />} />
    <Route path="propuesta-servicios/:token" element={<ServiceQuotePage />} />
    <Route path="seguimiento/:token" element={<CaseTrackingPage />} />
    <Route path="publica-tu-proyecto/manual" element={<DeveloperManualPage />} />
    <Route path="publica-tu-proyecto/galeria" element={<DeveloperGalleryPage />} />
    <Route path="reglamento" element={<MembersOnly><ReglamentoPage /></MembersOnly>} />
    <Route path="privacidad" element={<PrivacyPage />} />
    <Route path="terminos" element={<TermsPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </>
);

export default function App() {
  return (
    <HelmetProvider>
      <ToastProvider>
        <AuthProvider>
          <AdminAuthProvider>
          <BrowserRouter>
            {/* Dentro del Router: el banner lee el idioma de la URL. */}
            <div className="print:hidden"><InstallAppBanner /></div>
            <Tracking />
            <RefSessionNotice />
            {isCustomMapHost() ? (
              // Dominio propio de un mapa de lotes (Fase 3): solo el mapa.
              <Routes>
                <Route path="*" element={<CustomDomainMap />} />
              </Routes>
            ) : isBosqueHost() ? (
              // Dominio propio del Bosque: la landing vive en la raíz.
              <Routes>
                <Route element={<BosqueLayout />}>
                  <Route index element={<BosqueHome />} />
                  <Route path="arbol/:code" element={<BosqueTreePage />} />
                  <Route path="certificado/:code" element={<BosqueCertificatePage />} />
                  <Route path="transparencia" element={<BosqueTransparencyPage />} />
                  <Route path="terminos" element={<BosqueTermsPage />} />
                  <Route path="*" element={<BosqueHome />} />
                </Route>
              </Routes>
            ) : (
            <Routes>
              {/* Sitio público con navbar/footer, en español (/) y en inglés (/en). */}
              {/* Activación de eventos: pantalla completa, sin menú */}
              <Route path="fiesta" element={<FiestaPage />} />
              <Route path="embed/:slug" element={<EmbedMapPage />} />
              {/* Página de aterrizaje para anuncios: sin menú */}
              <Route path="l/:slug" element={<CampaignLandingPage />} />
              <Route path="en/l/:slug" element={<CampaignLandingPage />} />
              <Route path="publica-tu-proyecto/propuesta" element={<ProposalPage />} />
              <Route path="en/publica-tu-proyecto/propuesta" element={<ProposalPage />} />
              <Route path="desarrollador" element={<DeveloperPortalPage />} />
              <Route path="desarrollador/proyectos/:projectId/lotes" element={<DeveloperPanelPage view="lots" />} />
              <Route path="desarrollador/proyectos/:projectId/vistas-360" element={<DeveloperPanelPage view="panoramas" />} />
              <Route path="desarrollador/proyectos/:projectId/metricas" element={<DeveloperPanelPage view="metrics" />} />
              <Route element={<Layout />}>{publicRoutes()}</Route>
              <Route path="en" element={<Layout />}>{publicRoutes()}</Route>

              {/* Bosque: en grupo3i.com vive bajo /bosque (en su dominio propio, en la raíz). */}
              <Route path="bosque" element={<BosqueLayout />}>
                <Route index element={<BosqueHome />} />
                <Route path="arbol/:code" element={<BosqueTreePage />} />
                <Route path="certificado/:code" element={<BosqueCertificatePage />} />
                  <Route path="transparencia" element={<BosqueTransparencyPage />} />
                  <Route path="terminos" element={<BosqueTermsPage />} />
              </Route>

              {/* Comprobante de compra — público, standalone, imprimible (se comparte por WhatsApp) */}
              <Route path="confirmacion/:id" element={<PurchaseConfirmationPage />} />

              {/* Oficina — páginas públicas (standalone, sin layout de oficina) */}
              <Route path="oficina" element={<OfficeLanding />} />
              <Route path="oficina/login" element={<LoginPage />} />
              <Route path="oficina/registro" element={<RegisterPage />} />
              <Route path="en/oficina" element={<OfficeLanding />} />
              <Route path="en/oficina/login" element={<LoginPage />} />
              <Route path="en/oficina/registro" element={<RegisterPage />} />

              {/* Oficina — páginas protegidas (con sidebar + header) */}
              <Route path="oficina" element={<OfficeLayout />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="mi-red" element={<NetworkPage />} />
                <Route path="comisiones" element={<CommissionsPage />} />
                <Route path="pagos" element={<PaymentsPage />} />
                <Route path="herramientas" element={<ToolsPage />} />
                <Route path="calculadora" element={<CalculatorPage />} />
                <Route path="viajes" element={TRAVEL_ENABLED ? <TravelBookingsPage /> : <Navigate to="/oficina/dashboard" replace />} />
              </Route>

              {/* Admin — login standalone */}
              <Route path="admin/login" element={<AdminLoginPage />} />

              {/* Admin — protegido (sidebar + header) */}
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="productos" element={<AdminProductsPage />} />
                <Route path="proyectos" element={<AdminProjectsPage />} />
                <Route path="proyectos/:projectId/lotes" element={<AdminLotsPage />} />
                <Route path="proyectos/:projectId/vistas-360" element={<AdminPanoramasPage />} />
                <Route path="proyectos/:projectId/metricas" element={<ProjectMetricsPage />} />
                <Route path="fiesta" element={<AdminFiestaPage />} />
                <Route path="desarrolladores" element={<AdminDevelopersPage />} />
                <Route path="servicios" element={<AdminServicesPage />} />
                <Route path="servicios/expedientes/:caseId" element={<AdminCasePage />} />
                <Route path="crm" element={<AdminCrmPage />} />
                <Route path="propuesta" element={<AdminPropuestaPage />} />
                <Route path="miembros" element={<AdminMembersPage />} />
                {/* Leads se unificó en el CRM */}
                <Route path="leads" element={<Navigate to="/admin/crm" replace />} />
                <Route path="ventas-terceros" element={<AdminDeveloperSalesPage />} />
                <Route path="equipo" element={<AdminTeamPage />} />
                <Route path="campanas" element={<AdminCampaignsPage />} />
                <Route path="marketing" element={<AdminMarketingPage />} />
                <Route path="comisiones" element={<AdminCommissionsPage />} />
                <Route path="retiros" element={<AdminPayoutsPage />} />
                <Route path="compras" element={<AdminPurchasesPage />} />
                <Route path="reportes" element={<AdminReportsPage />} />
                <Route path="garantias" element={<AdminTravelClaimsPage />} />
                <Route path="soporte" element={<AdminSupportPage />} />
                <Route path="bosque" element={<AdminBosquePage />} />
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
            )}
          </BrowserRouter>
          </AdminAuthProvider>
        </AuthProvider>
      </ToastProvider>
    </HelmetProvider>
  );
}

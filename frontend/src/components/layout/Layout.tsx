import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { WhatsAppFloat } from '@/components/shared/WhatsAppFloat';
import { ReferralBanner } from '@/components/shared/ReferralBanner';
import { useReferral } from '@/hooks/useReferral';
import { BrandLoader } from '@/components/brand/Isotipo';

/** Hace scroll al inicio en cada cambio de ruta. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function Layout() {
  // Captura y persiste ?ref=3IP-XXXXXX desde cualquier ruta de entrada.
  useReferral();

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <ReferralBanner />
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<BrandLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}

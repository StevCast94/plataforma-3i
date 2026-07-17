import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CommunitySubNav } from './CommunitySubNav';
import { WhatsAppFloat } from '@/components/shared/WhatsAppFloat';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function CommunityLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-light/40">
      <ScrollToTop />
      <Navbar />
      <CommunitySubNav />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex min-h-[50vh] items-center justify-center text-brand-gray">Cargando…</div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}

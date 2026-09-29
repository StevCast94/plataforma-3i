import { Suspense } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { TreeDeciduous } from 'lucide-react';
import { BOSQUE_NAME, bosquePath } from '@/lib/bosque';
import { BrandLoader } from '@/components/brand/Isotipo';

/** Marco propio del Bosque: su marca, su navegación y su pie, sin el navbar de Grupo 3i. */
export default function BosqueLayout() {
  return (
    <div className="min-h-screen bg-savia font-sans text-bosque-dark">
      <Helmet>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap"
        />
        <meta name="theme-color" content="#1f4d34" />
      </Helmet>

      <header className="sticky top-0 z-40 border-b border-bosque/10 bg-savia/90 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to={bosquePath()} className="flex items-center gap-2 text-bosque">
            <TreeDeciduous className="h-6 w-6 text-guayacan" strokeWidth={1.8} />
            <span className="whitespace-nowrap font-bosque text-lg font-semibold sm:text-xl">{BOSQUE_NAME}</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium sm:gap-5">
            <a href={`${bosquePath()}#especies`} className="hidden px-2 py-1 hover:text-bosque sm:inline">
              Especies
            </a>
            <a href={`${bosquePath()}#como-funciona`} className="hidden px-2 py-1 hover:text-bosque sm:inline">
              Cómo funciona
            </a>
            <a href={`${bosquePath()}#mapa`} className="hidden px-2 py-1 hover:text-bosque md:inline">
              Mapa
            </a>
            <Link to={bosquePath('/transparencia')} className="hidden px-2 py-1 hover:text-bosque lg:inline">
              Cuentas claras
            </Link>
            <a
              href={`${bosquePath()}#especies`}
              className="whitespace-nowrap rounded-full bg-bosque px-4 py-2 text-white transition hover:bg-bosque-dark"
            >
              Adopta un árbol
            </a>
          </nav>
        </div>
      </header>

      <Suspense fallback={<BrandLoader className="min-h-[60vh]" />}>
        <Outlet />
      </Suspense>

      <footer className="border-t border-bosque/10 bg-bosque-dark text-white/75 print:hidden">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
          <div>
            <p className="font-bosque text-lg font-semibold text-white">{BOSQUE_NAME}</p>
            <p className="mt-2 text-sm leading-relaxed">
              Bosque de conservación permanente en Manglaralto, Santa Elena. Ningún árbol adoptado se tala.
            </p>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-white">Un proyecto vinculado a</p>
            <a href="https://grupo3i.com/proyectos/montanita-view" className="mt-2 block hover:text-guayacan">
              Montañita View
            </a>
            <a href="https://grupo3i.com" className="mt-1 block hover:text-guayacan">
              Grupo 3i
            </a>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-white">Gestión técnica</p>
            <p className="mt-2">Ing. Génesis Baquerizo, ingeniera agropecuaria</p>
            <Link to={bosquePath('/transparencia')} className="mt-3 block hover:text-guayacan">
              Cuentas claras
            </Link>
            <Link to={bosquePath('/terminos')} className="mt-1 block hover:text-guayacan">
              Términos de la adopción
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

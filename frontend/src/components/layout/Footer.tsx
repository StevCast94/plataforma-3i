import { Link, useLang } from '@/hooks/useLang';
import { LangSwitch } from '@/components/shared/LangSwitch';
import { useSectionContent } from '@/hooks/useSiteContent';
import { Isotipo } from '@/components/brand/Isotipo';

export function Footer() {
  const { t } = useLang();
  const { data } = useSectionContent('footer');
  const { data: contact } = useSectionContent('contact');
  const tagline =
    t(data?.tagline ?? 'Inversión inmobiliaria inteligente en la costa ecuatoriana.');
  const copyright =
    t(data?.copyright ?? '© 2026 Grupo 3i. Todos los derechos reservados.');

  return (
    <footer className="relative overflow-hidden bg-primary text-white print:hidden">
      {/* Marca de agua: isotipo gigante recortado en el borde, monocromo y casi
          invisible. Presencia de marca sin competir con el contenido. */}
      <Isotipo
        tone="light"
        className="pointer-events-none absolute -bottom-16 -right-16 h-72 w-auto opacity-[0.04] sm:h-96"
      />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <Link to="/" className="inline-block"><img src="/images/logotipo-light.svg" alt={t('Grupo 3i — Volver al inicio')} className="h-8 w-auto" /></Link>
          <p className="mt-3 max-w-xs text-sm text-white/70">{tagline}</p>
          <LangSwitch className="mt-4 border-white/20 bg-white/5" />
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-secondary">
            {t('Navegación')}
          </h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li><Link to="/proyectos" className="hover:text-secondary">{t('Proyectos')}</Link></li>
            <li><Link to="/club" className="hover:text-secondary">Club 3i</Link></li>
            <li><Link to="/oficina" className="hover:text-secondary">{t('Refiere y gana')}</Link></li>
            <li><Link to="/sobre-nosotros" className="hover:text-secondary">{t('Nosotros')}</Link></li>
            <li><Link to="/contacto" className="hover:text-secondary">{t('Contacto')}</Link></li>
            <li><Link to="/reglamento" className="hover:text-secondary">{t('Reglamento de Referidos')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-secondary">
            {t('Contacto')}
          </h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li>{contact?.email ?? 'grupoinmobiliario3i.ec@gmail.com'}</li>
            {contact?.phone && <li>{contact.phone}</li>}
            <li>grupo3i.com · club3i.com</li>
            <li>{t('Costa Ecuatoriana')}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        {copyright}
      </div>
    </footer>
  );
}

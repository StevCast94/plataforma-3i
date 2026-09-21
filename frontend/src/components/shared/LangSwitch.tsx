import { useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { useLang } from '@/hooks/useLang';
import { LANGS } from '@/lib/i18n';

/**
 * Cambia entre español e inglés navegando a la misma página en el otro idioma
 * (/contacto ↔ /en/contacto). No guarda preferencia: el idioma es la URL, así
 * el enlace que alguien comparte abre en el idioma en que se compartió.
 */
export function LangSwitch({ className = '' }: { className?: string }) {
  const { lang, alternate } = useLang();
  const navigate = useNavigate();

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-black/10 p-0.5 ${className}`}
      role="group"
      aria-label="Idioma / Language"
    >
      <Globe className="ml-1.5 h-3.5 w-3.5 text-brand-gray" strokeWidth={1.8} aria-hidden="true" />
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => navigate(alternate(l.code))}
          aria-current={l.code === lang ? 'true' : undefined}
          lang={l.code}
          title={l.label}
          className={`rounded-full px-2 py-0.5 text-xs font-semibold transition-colors ${
            l.code === lang ? 'bg-primary text-white' : 'text-brand-gray hover:text-primary'
          }`}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}

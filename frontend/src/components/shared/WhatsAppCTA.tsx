import type { ReactNode } from 'react';
import { useSectionContent } from '@/hooks/useSiteContent';
import { useLang } from '@/hooks/useLang';
import { getReferralCode } from '@/hooks/useReferral';

// ============================================================
// Botón de WhatsApp al número oficial de la página (SiteContent contact.whatsapp).
//
// El mensaje se arma en el punto donde se toca el botón: nombra lo que la
// persona está viendo (el solar, la propuesta, el proyecto) para que el asesor
// no tenga que preguntar "¿cuál solar?". Sin emojis: WhatsApp Web los recibe
// rotos cuando vienen en el texto prellenado del enlace.
// ============================================================

export const WA_ICON = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
    <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.207zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

/**
 * Enlace wa.me listo para usar, o null si aún no hay número configurado.
 * `override` permite que una página use otro número (ej. el asesor de la propuesta).
 */
export function useWhatsAppHref(message: string, override?: string): string | null {
  const { data: contact } = useSectionContent('contact');
  const digits = (override || contact?.whatsapp || '').replace(/\D/g, '');
  if (!digits) return null;

  const ref = getReferralCode();
  const text = ref ? `${message}\n\n(Ref: ${ref})` : message;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

interface Props {
  /** Mensaje ya redactado, con la referencia de lo que se está viendo. */
  message: string;
  children?: ReactNode;
  /** Número alterno; por defecto, el oficial de la página. */
  whatsapp?: string;
  /** `solid` = verde WhatsApp (CTA principal). `outline` = borde discreto. */
  variant?: 'solid' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export function WhatsAppCTA({
  message,
  children,
  whatsapp,
  variant = 'solid',
  size = 'md',
  className = '',
}: Props) {
  const { t } = useLang();
  const href = useWhatsAppHref(message, whatsapp);
  if (!href) return null;

  const look =
    variant === 'solid'
      ? 'bg-[#25D366] text-white shadow-sm hover:bg-[#1eb855]'
      : 'border border-black/15 bg-white text-primary hover:bg-light';

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors print:hidden ${look} ${
        size === 'sm' ? 'px-3 py-2 text-sm' : 'px-4 py-2.5 text-sm'
      } ${className}`}
    >
      <span className={variant === 'solid' ? '' : 'text-[#25D366]'}>{WA_ICON}</span>
      {children ?? t('Contactar un asesor')}
    </a>
  );
}

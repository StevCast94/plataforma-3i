import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Video } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ContactForm } from './ContactForm';
import { CheckoutModal } from './CheckoutModal';
import { PriceDisplay } from './PriceDisplay';
import { useSectionContent } from '@/hooks/useSiteContent';
import { getReferralCode } from '@/hooks/useReferral';
import type { Product } from '@shared/types';

// ============================================================
// CTAs por INTENCIÓN para productos high-ticket. Orden: de menor a mayor
// compromiso (hablar → visitar → meet → comprar). La compra siempre está
// disponible pero no se impone. Cada lead guarda su `intent` y arrastra el
// código de referido (atribución por cookie/localStorage).
// ============================================================

const ICONS = {
  whatsapp: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.207zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  ),
};

export function ProductCTAs({ product }: { product: Product }) {
  const { data: contact } = useSectionContent('contact');
  const [modal, setModal] = useState<null | 'visit' | 'meet'>(null);
  const [checkout, setCheckout] = useState(false);
  const buyRef = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);

  // La barra fija solo aparece cuando el CTA principal sale del viewport.
  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setShowBar(!entry.isIntersecting));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const isMembership = product.type === 'TRAVEL_MEMBERSHIP';
  const isFractional = product.type === 'FRACTIONAL_PROPERTY';
  const buyLabel = isMembership
    ? 'Obtener mi membresía'
    : isFractional
      ? 'Obtener mi fracción'
      : 'Comprar ahora';

  const endpoint = `/products/${product.id}/inquiry`;
  const ref = getReferralCode();
  const phoneDigits = (contact?.whatsapp ?? '').replace(/\D/g, '');
  const waMsg = `Hola 👋 Me interesa *${product.name}* que vi en la web de Grupo 3i.${ref ? ` (Ref: ${ref})` : ''}`;
  const waHref = phoneDigits
    ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(waMsg)}`
    : null;

  return (
    <>
      <div className="mt-8 space-y-3">
        {/* CTA primario: la compra manda */}
        <div ref={buyRef}>
          <Button size="lg" className="w-full" onClick={() => setCheckout(true)}>
            {buyLabel}
          </Button>
        </div>

        {/* Secundario: WhatsApp con el asesor */}
        {waHref ? (
          <a href={waHref} target="_blank" rel="noreferrer" className="block">
            <Button size="lg" variant="outline" className="w-full">
              <span className="text-[#25D366]">{ICONS.whatsapp}</span>
              Hablar con un asesor
            </Button>
          </a>
        ) : (
          <Button size="lg" variant="outline" className="w-full" onClick={() => setModal('meet')}>
            Hablar con un asesor
          </Button>
        )}

        {/* Terciarios: enlaces discretos, no compiten con la compra */}
        <div className="flex items-center justify-center gap-6 pt-1">
          {!isMembership && (
            <button
              onClick={() => setModal('visit')}
              className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-brand-gray underline-offset-4 transition-colors hover:text-accent hover:underline"
            >
              <CalendarDays className="h-4 w-4" strokeWidth={1.8} />
              Reservar una visita
            </button>
          )}
          <button
            onClick={() => setModal('meet')}
            className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-brand-gray underline-offset-4 transition-colors hover:text-accent hover:underline"
          >
            <Video className="h-4 w-4" strokeWidth={1.8} />
            {isMembership ? 'Agendar una llamada' : 'Meet personalizado'}
          </button>
        </div>

        <p className="text-center text-xs text-brand-gray">
          Sin compromiso. Un asesor te acompaña en cada paso.
        </p>
      </div>

      {/* Barra fija móvil: aparece solo cuando el CTA principal sale de vista */}
      {showBar && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            <div className="min-w-0">
              <PriceDisplay price={product.price} promoPrice={product.promoPrice} compact />
            </div>
            <Button size="md" className="flex-none" onClick={() => setCheckout(true)}>
              {buyLabel}
            </Button>
          </div>
        </div>
      )}

      {/* Modales visita / meet */}
      <Modal
        open={modal === 'visit'}
        onClose={() => setModal(null)}
        title={`Reservar visita · ${product.name}`}
      >
        <p className="mb-4 text-sm text-brand-gray">
          Déjanos tus datos y tu disponibilidad (día y hora preferidos) en el mensaje. Un asesor
          confirmará tu visita.
        </p>
        <ContactForm
          endpoint={endpoint}
          extra={{ intent: 'visit' }}
          submitLabel="Solicitar visita"
          withMessage
          onSuccess={() => {}}
        />
      </Modal>

      <Modal
        open={modal === 'meet'}
        onClose={() => setModal(null)}
        title={`Meet personalizado · ${product.name}`}
      >
        <p className="mb-4 text-sm text-brand-gray">
          Agenda una reunión virtual 1 a 1. Indícanos tu disponibilidad en el mensaje.
        </p>
        <ContactForm
          endpoint={endpoint}
          extra={{ intent: 'meet' }}
          submitLabel="Solicitar meet"
          withMessage
          onSuccess={() => {}}
        />
      </Modal>

      <CheckoutModal open={checkout} product={product} onClose={() => setCheckout(false)} />
    </>
  );
}

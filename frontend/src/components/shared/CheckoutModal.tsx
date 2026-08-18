import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ContactForm } from './ContactForm';
import { PriceDisplay } from './PriceDisplay';
import { api } from '@/lib/api';
import { getReferralCode } from '@/hooks/useReferral';
import { useAuth } from '@/hooks/useAuth';
import type { Product } from '@shared/types';

interface CheckoutModalProps {
  open: boolean;
  product: Product;
  onClose: () => void;
}

/** Modal de solicitud de compra: resumen + atribución de referido + formulario. */
export function CheckoutModal({ open, product, onClose }: CheckoutModalProps) {
  const { member } = useAuth();
  const cookieCode = getReferralCode();
  const [referrerName, setReferrerName] = useState<string | null>(null);

  // Un socio ya pertenece a UN referidor: su upline real manda sobre cualquier
  // código de la cookie (así lo resuelve el backend al crear la compra).
  const isMember = !!member;
  const ownReferrer = member?.referrer ?? null;
  const lookupCode = isMember ? null : cookieCode;

  useEffect(() => {
    if (!open || !lookupCode) return;
    api
      .get<{ firstName: string }>(`/members/${lookupCode}`)
      .then((r) => setReferrerName(r.firstName))
      .catch(() => setReferrerName(null));
  }, [open, lookupCode]);

  return (
    <Modal open={open} onClose={onClose} title={`Solicitar compra: ${product.name}`}>
      <div className="space-y-5">
        {/* Resumen */}
        <div className="flex items-center justify-between rounded-xl bg-light p-4">
          <span className="font-medium text-primary">{product.name}</span>
          <PriceDisplay price={product.price} promoPrice={product.promoPrice} compact />
        </div>

        {/* Atribución de referido */}
        {isMember
          ? ownReferrer && (
              <div className="flex items-center gap-2">
                <Badge variant="gold">Tu referidor</Badge>
                <span className="text-sm text-brand-gray">
                  Esta compra se acredita a{' '}
                  <strong className="text-primary">{ownReferrer.fullName}</strong>
                </span>
              </div>
            )
          : cookieCode && (
              <div className="flex items-center gap-2">
                <Badge variant="gold">Referido</Badge>
                <span className="text-sm text-brand-gray">
                  Serás referido por{' '}
                  <strong className="text-primary">{referrerName ?? 'un socio de Grupo 3i'}</strong>
                </span>
              </div>
            )}

        <ContactForm
          endpoint={`/products/${product.id}/inquiry`}
          extra={{ intent: 'purchase' }}
          submitLabel="Enviar solicitud de compra"
          withMessage
          inlineSuccess={false}
          onSuccess={onClose}
        />

        <p className="text-xs text-brand-gray">
          Un asesor confirmará tu compra y te contactará para completar el pago.
        </p>
      </div>
    </Modal>
  );
}

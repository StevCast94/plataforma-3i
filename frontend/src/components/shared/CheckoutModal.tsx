import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ContactForm } from './ContactForm';
import { PriceDisplay } from './PriceDisplay';
import { api } from '@/lib/api';
import { getReferralCode } from '@/hooks/useReferral';
import type { Product } from '@shared/types';

interface CheckoutModalProps {
  open: boolean;
  product: Product;
  onClose: () => void;
}

/** Modal de solicitud de compra: resumen + atribución de referido + formulario. */
export function CheckoutModal({ open, product, onClose }: CheckoutModalProps) {
  const referralCode = getReferralCode();
  const [referrerName, setReferrerName] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !referralCode) return;
    api
      .get<{ firstName: string }>(`/members/${referralCode}`)
      .then((r) => setReferrerName(r.firstName))
      .catch(() => setReferrerName(null));
  }, [open, referralCode]);

  return (
    <Modal open={open} onClose={onClose} title={`Solicitar compra: ${product.name}`}>
      <div className="space-y-5">
        {/* Resumen */}
        <div className="flex items-center justify-between rounded-xl bg-light p-4">
          <span className="font-medium text-primary">{product.name}</span>
          <PriceDisplay price={product.price} promoPrice={product.promoPrice} />
        </div>

        {/* Atribución de referido */}
        {referralCode && (
          <div className="flex items-center gap-2">
            <Badge variant="gold">Referido</Badge>
            <span className="text-sm text-brand-gray">
              Serás referido por{' '}
              <strong className="text-primary">{referrerName ?? referralCode}</strong>
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

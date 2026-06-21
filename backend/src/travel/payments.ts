// ============================================================
// FASE 5 V2 — Capa de pagos (agnóstica al proveedor).
// MockProvider: auto-aprueba → permite probar TODO el flujo de reserva offline.
// PayPhoneProvider: stub estructurado para Ecuador (se activa con PAYPHONE_TOKEN).
// Montos SIEMPRE en CENTAVOS.
// ============================================================

export interface PaymentInit {
  amountCents: number;
  currency: string;
  reference: string; // id de la reserva
  description: string;
  email?: string;
  phone?: string;
}

export interface PaymentCreateResult {
  paymentRef: string;
  approved: boolean; // true si el cobro quedó aprobado al instante (mock)
  redirectUrl?: string; // para pasarelas con redirección (PayPhone real)
}

export interface PaymentConfirmResult {
  approved: boolean;
}

export interface PaymentProvider {
  readonly name: string;
  create(input: PaymentInit): Promise<PaymentCreateResult>;
  confirm(input: { paymentRef: string; transactionId?: string }): Promise<PaymentConfirmResult>;
}

/** Provider de prueba: aprueba al instante. Solo para sandbox/offline. */
class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';
  async create(input: PaymentInit): Promise<PaymentCreateResult> {
    return { paymentRef: `mockpay:${input.reference}:${Date.now()}`, approved: true };
  }
  async confirm(): Promise<PaymentConfirmResult> {
    return { approved: true };
  }
}

/**
 * PayPhone (Ecuador). Stub: la estructura está lista; la llamada real a la API
 * (Cajita/Botón de Pago + endpoint Confirm) se completa cuando exista
 * PAYPHONE_TOKEN. PayPhone trabaja en centavos, igual que nosotros.
 */
class PayPhoneProvider implements PaymentProvider {
  readonly name = 'payphone';
  constructor(private token: string) {}

  async create(input: PaymentInit): Promise<PaymentCreateResult> {
    // TODO(V2-prod): POST https://pay.payphonetodo.com/api/button/Prepare
    //   { amount: input.amountCents, currency, clientTransactionId: input.reference, ... }
    //   con Authorization: Bearer this.token. Devuelve payWithCard / payWithPayPhone URL.
    return {
      paymentRef: `payphone:pending:${input.reference}`,
      approved: false,
      redirectUrl: `https://pay.payphonetodo.com/?ref=${encodeURIComponent(input.reference)}`,
    };
  }

  async confirm(input: { paymentRef: string; transactionId?: string }): Promise<PaymentConfirmResult> {
    // TODO(V2-prod): POST .../api/button/Confirm { id: transactionId, clientTxId }
    //   y validar statusCode === 3 (Approved). Por ahora no aprueba sin integración real.
    void input;
    return { approved: false };
  }
}

/** Selecciona el proveedor de pago según el entorno. */
export function getPaymentProvider(): PaymentProvider {
  const token = process.env.PAYPHONE_TOKEN;
  if (token) return new PayPhoneProvider(token);
  return new MockPaymentProvider();
}

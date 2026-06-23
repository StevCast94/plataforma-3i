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
 * PayPhone (Ecuador) — Botón de Pago por redirección.
 * Flujo: Prepare → el cliente paga en el formulario de PayPhone → PayPhone
 * redirige a nuestra URL de respuesta con `id` y `clientTransactionId` →
 * Confirm (V2) para validar (statusCode === 3 = Approved).
 * IMPORTANTE: si no se confirma en 5 min, PayPhone reversa la transacción.
 * Montos en CENTAVOS (igual que PayPhone).
 */
const PAYPHONE_API = 'https://pay.payphonetodoesposible.com/api/button';

class PayPhoneProvider implements PaymentProvider {
  readonly name = 'payphone';
  constructor(private token: string) {}

  async create(input: PaymentInit): Promise<PaymentCreateResult> {
    const responseUrl =
      (process.env.PUBLIC_BASE_URL ?? 'https://plataforma-3i-production.up.railway.app') +
      '/api/travel/payphone/callback';
    const res = await fetch(`${PAYPHONE_API}/Prepare`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: input.amountCents, // total en centavos (incluye impuestos)
        amountWithoutTax: input.amountCents, // servicios turísticos: ajustar IVA según facturación
        tax: 0,
        service: 0,
        tip: 0,
        currency: input.currency || 'USD',
        clientTransactionId: input.reference,
        reference: input.description.slice(0, 100),
        responseUrl,
        email: input.email,
        phoneNumber: input.phone,
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`PayPhone Prepare HTTP ${res.status}: ${t.slice(0, 200)}`);
    }
    const data = (await res.json()) as { paymentId?: string | number; payWithCard?: string; payWithPayPhone?: string };
    return {
      paymentRef: `payphone:${data.paymentId ?? input.reference}`,
      approved: false, // se aprueba tras el Confirm
      redirectUrl: data.payWithCard ?? data.payWithPayPhone,
    };
  }

  async confirm(input: { paymentRef: string; transactionId?: string }): Promise<PaymentConfirmResult> {
    // transactionId = `id` que PayPhone devuelve en el callback.
    const id = input.transactionId;
    const clientTransactionId = input.paymentRef.replace(/^payphone:/, '');
    if (!id) return { approved: false };
    const res = await fetch(`${PAYPHONE_API}/V2/Confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: Number(id), clientTxId: clientTransactionId }),
    });
    if (!res.ok) return { approved: false };
    const data = (await res.json()) as { statusCode?: number; transactionStatus?: string };
    return { approved: data.statusCode === 3 || data.transactionStatus === 'Approved' };
  }
}

/** Selecciona el proveedor de pago según el entorno. */
export function getPaymentProvider(): PaymentProvider {
  const token = process.env.PAYPHONE_TOKEN;
  if (token) return new PayPhoneProvider(token);
  return new MockPaymentProvider();
}

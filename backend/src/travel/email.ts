// ============================================================
// Email transaccional (Resend). Env-gated:
//   RESEND_API_KEY  → activa el envío real (https://resend.com)
//   EMAIL_FROM      → remitente, ej. "Club 3i <reservas@grupo3i.com>"
// Sin RESEND_API_KEY: no-op que loguea (no rompe nada en desarrollo).
// ============================================================

function formatMoney(cents: number, currency = 'USD'): string {
  return `${(cents / 100).toLocaleString('es-EC', { minimumFractionDigits: 2 })} ${currency}`;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? 'Club 3i <onboarding@resend.dev>';
  if (!key) {
    console.log(`[email:noop] (sin RESEND_API_KEY) → ${opts.to} · ${opts.subject}`);
    return false;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    console.error(`[email] Resend HTTP ${res.status}: ${t.slice(0, 200)}`);
    return false;
  }
  return true;
}

export async function sendBookingVoucher(opts: {
  to: string;
  customerName: string;
  hotelName: string;
  voucher: string;
  totalCents: number;
  currency: string;
  details: unknown;
}): Promise<boolean> {
  const d = (opts.details ?? {}) as { checkIn?: string; checkOut?: string; guests?: number };
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <div style="background:#1a1a1a;padding:24px;text-align:center">
        <h1 style="color:#c9a96e;margin:0;font-size:20px">Club de Viajes 3i</h1>
      </div>
      <div style="padding:24px">
        <h2 style="font-size:18px">¡Reserva confirmada, ${opts.customerName}!</h2>
        <p>Tu reserva en <b>${opts.hotelName}</b> está confirmada.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:6px 0;color:#6b7280">Voucher</td><td style="text-align:right"><b>${opts.voucher}</b></td></tr>
          ${d.checkIn ? `<tr><td style="padding:6px 0;color:#6b7280">Check-in</td><td style="text-align:right">${d.checkIn}</td></tr>` : ''}
          ${d.checkOut ? `<tr><td style="padding:6px 0;color:#6b7280">Check-out</td><td style="text-align:right">${d.checkOut}</td></tr>` : ''}
          ${d.guests ? `<tr><td style="padding:6px 0;color:#6b7280">Huéspedes</td><td style="text-align:right">${d.guests}</td></tr>` : ''}
          <tr><td style="padding:6px 0;color:#6b7280">Total pagado</td><td style="text-align:right"><b>${formatMoney(opts.totalCents, opts.currency)}</b></td></tr>
        </table>
        <p style="color:#6b7280;font-size:13px">Presenta este voucher al llegar. Gracias por viajar con Grupo 3i.</p>
      </div>
    </div>`;
  return sendEmail({ to: opts.to, subject: `Voucher ${opts.voucher} · ${opts.hotelName}`, html });
}

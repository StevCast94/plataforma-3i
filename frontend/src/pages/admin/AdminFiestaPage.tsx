import { useEffect } from 'react';
import { useAdminGet } from '@/hooks/useAdminAPI';

interface Stats {
  guests: number;
  drinksEarned: number;
  drinksRedeemed: number;
  byChannel: Record<string, number>;
  clicks: number;
  rows: {
    name: string;
    phone: string | null;
    claimed: boolean;
    referrals: number;
    clicks: number;
    drinks: { channel: string; redeemed: boolean }[];
    createdAt: string;
  }[];
}

const LABEL: Record<string, string> = { whatsapp: 'WhatsApp', instagram: 'Instagram', facebook: 'Facebook' };

/** Panel en vivo de la activación "Comparte y te invitamos un trago" (/fiesta). */
export default function AdminFiestaPage() {
  const { data, reload } = useAdminGet<Stats>('/events/halloween-cubata/stats');
  useEffect(() => {
    const id = setInterval(reload, 20000);
    return () => clearInterval(id);
  }, [reload]);

  const card = (label: string, value: number | string) => (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-xs uppercase tracking-wider text-brand-gray">{label}</p>
      <p className="mt-1 font-serif text-3xl font-bold text-primary">{value}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-primary">Fiesta · Halloween Cubata</h1>
        <p className="text-sm text-brand-gray">
          Activación «Comparte y te invitamos un trago» en grupo3i.com/fiesta. Se actualiza cada 20 segundos.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {card('Registrados (leads)', data?.guests ?? '—')}
        {card('Bebidas ganadas', data?.drinksEarned ?? '—')}
        {card('Bebidas entregadas', data?.drinksRedeemed ?? '—')}
        {card('Clics en sus enlaces', data?.clicks ?? '—')}
        {card(
          'Por red',
          data ? Object.entries(data.byChannel).map(([k, v]) => `${LABEL[k]?.[0] ?? k} ${v}`).join(' · ') : '—',
        )}
      </div>
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full text-sm">
          <thead className="bg-light text-left text-xs uppercase text-brand-gray">
            <tr>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">WhatsApp</th>
              <th className="px-3 py-2">Compartió en</th>
              <th className="px-3 py-2">Clics</th>
              <th className="px-3 py-2">Referidos</th>
              <th className="px-3 py-2">Cuenta</th>
              <th className="px-3 py-2">Hora</th>
            </tr>
          </thead>
          <tbody>
            {(data?.rows ?? []).map((r, i) => (
              <tr key={i} className="border-t border-black/5">
                <td className="px-3 py-2 font-medium text-primary">{r.name}</td>
                <td className="px-3 py-2">
                  {r.phone && (
                    <a href={`https://wa.me/${r.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                      {r.phone}
                    </a>
                  )}
                </td>
                <td className="px-3 py-2">
                  {r.drinks.map((d) => `${LABEL[d.channel] ?? d.channel}${d.redeemed ? ' ✓' : ''}`).join(', ') || '—'}
                </td>
                <td className="px-3 py-2">{r.clicks}</td>
                <td className="px-3 py-2">{r.referrals}</td>
                <td className="px-3 py-2">{r.claimed ? 'Activa' : 'Pendiente'}</td>
                <td className="px-3 py-2 text-brand-gray">
                  {new Date(r.createdAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-brand-gray">✓ = bebida entregada. «Pendiente» = aún no activa su cuenta de Refiere y gana.</p>
    </div>
  );
}

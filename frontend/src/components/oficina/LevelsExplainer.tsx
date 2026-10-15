import { ArrowRight, CalendarClock, Gift, Users, Wallet } from 'lucide-react';
import { Link, useLang } from '@/hooks/useLang';
import { formatCurrency } from '@/lib/utils';

// «Refiere y gana» explicado en una sola sección: los dos niveles, quién es tu
// referido directo y el de segundo nivel, cuánto se gana con una venta real y
// cuándo llega el dinero. Las tasas son las del motor (backend/src/lib/referralRules.ts).

const LEVELS = {
  PREMIERE: { l1: 0.02, l2: 0.01, days: 30 },
  ELITE: { l1: 0.04, l2: 0.02, days: 3 },
};
const RETRACTION_DAYS = 14;
// Promoción de lanzamiento: Elite de regalo con el primer referido (backend/src/lib/launchPromo.ts).
const PROMO_END = new Date('2027-03-01T05:00:00Z');

const pct = (n: number) => `${Math.round(n * 1000) / 10}%`;

export function LevelsExplainer({ examples }: { examples: { what: string; from: number }[] }) {
  const { t } = useLang();
  const promo = Date.now() < PROMO_END.getTime();

  return (
    <>
      {/* Los dos niveles */}
      <section className="bg-light">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-accent">{t('Dos niveles')}</p>
          <h2 className="mt-2 text-center text-3xl font-bold text-primary sm:text-4xl">{t('Empiezas en Premiere. En Elite ganas el doble.')}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-brand-gray">
            {t('Ganas una comisión por cada venta de tus referidos y también por las ventas de las personas que ellos refieran.')}
          </p>

          {/* Quién es quién */}
          <div className="mx-auto mt-10 flex max-w-3xl flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            {[
              [t('Tú'), t('compartes tu enlace')],
              [t('Tu referido'), t('se registra con tu enlace y compra')],
              [t('El referido de tu referido'), t('llega con el enlace de tu referido y compra')],
            ].map(([who, what], i) => (
              <div key={who} className="flex flex-1 items-center gap-3">
                <div className="flex-1 rounded-xl bg-white p-3 text-center shadow-sm ring-1 ring-black/5">
                  <p className="font-semibold text-primary">{who}</p>
                  <p className="text-xs text-brand-gray">{what}</p>
                </div>
                {i < 2 && <ArrowRight className="hidden h-5 w-5 shrink-0 text-secondary sm:block" aria-hidden />}
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {(['PREMIERE', 'ELITE'] as const).map((lv) => {
              const elite = lv === 'ELITE';
              const r = LEVELS[lv];
              return (
                <div
                  key={lv}
                  className={`relative rounded-2xl p-6 shadow-sm ${elite ? 'bg-primary text-white ring-2 ring-secondary' : 'bg-white ring-1 ring-black/5'}`}
                >
                  <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${elite ? 'text-secondary' : 'text-accent'}`}>{elite ? 'Elite' : 'Premiere'}</p>
                  <p className={`mt-1 text-sm ${elite ? 'text-white/75' : 'text-brand-gray'}`}>
                    {elite ? (promo ? t('Con tu primer referido.') : t('Cuando compras un inmueble o 5 de tus referidos compran en 180 días.')) : t('Tu nivel al registrarte, gratis.')}
                  </p>
                  <dl className="mt-5 space-y-4">
                    <div className="flex items-end justify-between gap-3">
                      <dt className={`text-sm ${elite ? 'text-white/85' : 'text-primary'}`}>{t('Por cada venta de tu referido')}</dt>
                      <dd className={`font-serif text-4xl font-bold ${elite ? 'text-secondary' : 'text-primary'}`}>{pct(r.l1)}</dd>
                    </div>
                    <div className="flex items-end justify-between gap-3">
                      <dt className={`text-sm ${elite ? 'text-white/85' : 'text-primary'}`}>{t('Por cada venta del referido de tu referido')}</dt>
                      <dd className={`font-serif text-2xl font-bold ${elite ? 'text-secondary' : 'text-primary'}`}>{pct(r.l2)}</dd>
                    </div>
                    <div className={`flex items-end justify-between gap-3 border-t pt-4 ${elite ? 'border-white/15' : 'border-black/5'}`}>
                      <dt className={`text-sm ${elite ? 'text-white/85' : 'text-primary'}`}>{t('Tu comisión pasa a tu saldo')}</dt>
                      <dd className="text-right text-sm font-semibold">{t('{n} días después del retracto', { n: r.days })}</dd>
                    </div>
                  </dl>
                  {!elite && (
                    <p className="mt-5 rounded-xl bg-light p-3 text-sm text-primary">
                      {t('Subes a Elite automáticamente, sin trámites, en cuanto cumples una de las condiciones.')}
                    </p>
                  )}
                  {elite && promo && (
                    <p className="mt-5 flex gap-2 rounded-xl bg-secondary/15 p-3 text-sm text-white ring-1 ring-secondary/40">
                      <Gift className="h-5 w-5 shrink-0 text-secondary" aria-hidden />
                      <span>{t('Promoción de lanzamiento: subes a Elite cuando se registre tu primer referido.')}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cuánto se gana */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-accent">{t('Ejemplos con precios de hoy')}</p>
        <h2 className="mt-2 text-center text-3xl font-bold text-primary sm:text-4xl">{t('¿Cuánto podrías ganar?')}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-brand-gray">{t('Lo que cobras por una sola venta, según quién compra y tu nivel.')}</p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {examples.map((e) => (
            <div key={e.what} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              <div className="border-b border-black/5 bg-light/60 px-5 py-4">
                <p className="font-semibold text-primary">{t(e.what)}</p>
                <p className="text-xs text-brand-gray">{t('Precio desde {p}', { p: formatCurrency(e.from) })}</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-brand-gray">
                    <th className="px-5 pt-3 text-left font-medium">{t('Si compra…')}</th>
                    <th className="px-5 pt-3 text-right font-medium">Premiere</th>
                    <th className="px-5 pt-3 text-right font-medium text-accent">Elite</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-5 py-3 text-primary">{t('Tu referido')}</td>
                    <td className="px-5 py-3 text-right font-serif text-xl font-bold text-primary">{formatCurrency(e.from * LEVELS.PREMIERE.l1)}</td>
                    <td className="px-5 py-3 text-right font-serif text-xl font-bold text-accent">{formatCurrency(e.from * LEVELS.ELITE.l1)}</td>
                  </tr>
                  <tr className="border-t border-black/5">
                    <td className="px-5 py-3 text-primary">{t('El referido de tu referido')}</td>
                    <td className="px-5 py-3 text-right font-semibold text-primary">{formatCurrency(e.from * LEVELS.PREMIERE.l2)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-accent">{formatCurrency(e.from * LEVELS.ELITE.l2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-brand-gray">{t('La comisión se calcula sobre el precio de venta; si tu referido elige una unidad más cara, ganas más.')}</p>

        {/* Cuándo llega el dinero */}
        <div className="mt-14">
          <h3 className="text-center text-xl font-bold text-primary">{t('¿Cuándo recibes tu dinero?')}</h3>
          <ol className="mt-6 grid gap-3 sm:grid-cols-4">
            {[
              [Users, t('Tu referido compra'), t('La venta queda registrada a tu nombre.')],
              [CalendarClock, t('{n} días de retracto', { n: RETRACTION_DAYS }), t('El plazo legal en que el comprador puede desistir.')],
              [CalendarClock, t('Liquidación'), t('30 días en Premiere, 3 días en Elite.')],
              [Wallet, t('Retiras'), t('La comisión pasa a tu saldo y la pides por transferencia desde tu oficina.')],
            ].map(([Icon, title, body], i) => {
              const I = Icon as typeof Users;
              return (
                <li key={i} className="rounded-2xl bg-light p-4">
                  <span className="flex items-center gap-2 text-xs font-semibold text-accent">
                    <I className="h-4 w-4" aria-hidden /> {t('Paso {n}', { n: i + 1 })}
                  </span>
                  <p className="mt-2 font-semibold text-primary">{title as string}</p>
                  <p className="mt-1 text-sm text-brand-gray">{body as string}</p>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-12 text-center">
          <Link to="/oficina/registro" className="inline-block rounded-full bg-secondary px-8 py-3 font-semibold text-primary transition hover:brightness-105">
            {t('Regístrate gratis')}
          </Link>
          <p className="mt-3 text-xs text-brand-gray">{t('Al registrarte encontrarás el reglamento completo del programa en tu oficina virtual.')}</p>
        </div>
      </section>
    </>
  );
}

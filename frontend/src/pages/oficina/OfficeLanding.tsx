import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Seo } from '@/components/shared/Seo';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ClipboardPen, Link2, HandCoins, type LucideIcon } from 'lucide-react';
import { estimateMonthly } from '@/lib/referral';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { BrandLoader } from '@/components/brand/Isotipo';

const steps: { icon: LucideIcon; title: string; body: string; image: string }[] = [
  {
    icon: ClipboardPen,
    title: 'Regístrate gratis',
    body: 'Crea tu cuenta Premiere con tu cédula en minutos.',
    image: '/images/secciones/paso-registro.jpg',
  },
  {
    icon: Link2,
    title: 'Comparte tu enlace',
    body: 'Recibe tu código y enlace único para invitar.',
    image: '/images/secciones/paso-comparte.jpg',
  },
  {
    icon: HandCoins,
    title: 'Gana comisiones',
    body: 'Cobra por cada membresía y propiedad referida.',
    image: '/images/secciones/paso-gana.jpg',
  },
];

const compare = [
  { feature: 'Comisión membresía (nivel 1)', premiere: '$50', elite: '$100' },
  { feature: 'Inmobiliario nivel 1', premiere: '2%', elite: '4%' },
  { feature: 'Inmobiliario nivel 2', premiere: '1%', elite: '2%' },
  { feature: 'Límite mensual', premiere: '$5,000', elite: 'Ilimitado' },
  { feature: 'Frecuencia de pago', premiere: 'Mensual', elite: 'Quincenal' },
  { feature: 'Liquidación', premiere: '45 días', elite: '30 días' },
];

const faqs = [
  { q: '¿Cuánto cuesta ser miembro?', a: 'El registro Premiere es gratuito. Solo necesitas verificar tu identidad (KYC).' },
  { q: '¿Cómo llego a Elite?', a: 'Comprando cualquier producto, o refiriendo 5 personas exitosas en 180 días (¡con membresía de viajes gratis!).' },
  { q: '¿Cuándo cobro mis comisiones?', a: 'Tras un período de retracto de 14 días y la liquidación según tu nivel (45 días Premiere / 30 días Elite).' },
  { q: '¿Pierdo mi cuenta si no refiero?', a: 'Premiere: tras 90 días sin referidos se da de baja. Elite es vitalicio.' },
];

export default function OfficeLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [memberships, setMemberships] = useState(5);
  const elite = estimateMonthly('ELITE', memberships, 1, 15000);

  // Esta es una página de VENTA del programa (pública, sin sidebar). Si ya hay
  // sesión, no tiene sentido mostrarle "Regístrate gratis" a alguien que ya es
  // socio — se lo manda directo a su panel real.
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <BrandLoader className="min-h-screen" label="Cargando…" />;
  if (isAuthenticated) return <Navigate to="/oficina/dashboard" replace />;

  return (
    <>
      <Seo
        title="Programa de Referidos — Oficina Virtual"
        description="Transforma tus recomendaciones en ingresos con el Club 3i."
      />

      {/* Barra superior: la única página de Oficina sin Navbar del sitio público. */}
      <header className="border-b border-black/5 bg-white px-4 py-3 sm:px-6">
        <Link to="/" className="inline-flex items-center">
          <img src="/images/logo-completo.svg" alt="Grupo 3i — Volver al inicio" className="h-8 w-auto" />
        </Link>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-primary text-white">
        <img
          src="/images/secciones/hero-referidos.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 -z-10 bg-primary/70" />
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center sm:px-6">
          <Badge variant="solid" className="mb-5">Programa de Referidos</Badge>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold sm:text-6xl"
          >
            Transforma tus recomendaciones en ingresos
          </motion.h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80">
            Únete al Club 3i, comparte lo que amas y gana comisiones por cada referido.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link to="/oficina/registro">
              <Button size="lg">Registrarme gratis</Button>
            </Link>
            <Link to="/oficina/login">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white hover:text-primary">
                Ya soy miembro
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="mb-12 text-center text-3xl font-bold text-primary sm:text-4xl">Cómo funciona</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="overflow-hidden rounded-2xl bg-white text-center shadow-sm ring-1 ring-black/5">
              <img src={s.image} alt="" className="h-36 w-full object-cover" />
              <div className="p-8">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-light text-accent ring-1 ring-secondary/30">
                  <s.icon className="h-6 w-6" strokeWidth={1.6} />
                </span>
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-secondary">Paso {i + 1}</p>
                <h3 className="mt-1 text-xl text-primary">{s.title}</h3>
                <p className="mt-2 text-sm text-brand-gray">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparativa */}
      <section className="bg-light">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
          <h2 className="mb-10 text-center text-3xl font-bold text-primary sm:text-4xl">Elige tu nivel</h2>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="px-4 py-4 text-sm">Beneficio</th>
                  <th className="px-4 py-4 text-center text-sm">Premiere</th>
                  <th className="px-4 py-4 text-center text-sm text-secondary">Elite</th>
                </tr>
              </thead>
              <tbody>
                {compare.map((row) => (
                  <tr key={row.feature} className="border-b border-black/5">
                    <td className="px-4 py-3 text-sm text-primary">{row.feature}</td>
                    <td className="px-4 py-3 text-center text-sm text-brand-gray">{row.premiere}</td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-accent">{row.elite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Calculadora rápida */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="mb-8 text-center text-3xl font-bold text-primary">¿Cuánto podrías ganar?</h2>
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
          <label className="block">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-primary">Membresías referidas al mes</span>
              <span className="font-serif text-xl font-bold text-accent">{memberships}</span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              value={memberships}
              onChange={(e) => setMemberships(Number(e.target.value))}
              className="mt-2 w-full cursor-pointer accent-[var(--color-secondary)]"
            />
          </label>
          <p className="mt-6 text-center text-brand-gray">
            Como Elite ganarías hasta{' '}
            <strong className="font-serif text-2xl text-accent">{formatCurrency(elite)}/mes</strong>
          </p>
        </div>
      </section>

      {/* Libertad financiera */}
      <section className="relative overflow-hidden bg-primary text-white">
        <img
          src="/images/secciones/libertad-financiera.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/70" />
        <div className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <h2 className="text-3xl font-bold sm:text-4xl">Libertad financiera, no solo un ingreso extra</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">
            Tus comisiones se acumulan con cada referido, sin importar dónde estés. Empieza hoy y
            deja que tu red trabaje para ti.
          </p>
          <Link to="/oficina/registro" className="mt-8 inline-block">
            <Button size="lg">Registrarme gratis</Button>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-light">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h2 className="mb-10 text-center text-3xl font-bold text-primary">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-medium text-primary">{f.q}</span>
                  <span className="text-accent">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && <p className="px-5 pb-4 text-sm text-brand-gray">{f.a}</p>}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/oficina/registro">
              <Button size="lg">Empieza gratis ahora</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

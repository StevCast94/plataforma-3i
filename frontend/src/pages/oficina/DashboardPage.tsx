import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, DollarSign, Wallet, Link2, Luggage } from 'lucide-react';
import { Seo } from '@/components/shared/Seo';
import { ProgressToElite } from '@/components/oficina/ProgressToElite';
import { useAuth } from '@/hooks/useAuth';
import { useCommissionSummary } from '@/hooks/useCommissions';
import { useReferrals } from '@/hooks/useReferrals';
import { formatCurrency } from '@/lib/utils';
import { statusLabel } from '@/lib/referral';

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-6 shadow-sm ring-1 ring-black/5 ${
        accent ? 'bg-primary text-white' : 'bg-white'
      }`}
    >
      <p className={`text-xs uppercase tracking-wider ${accent ? 'text-white/60' : 'text-brand-gray'}`}>
        {label}
      </p>
      <p className={`mt-2 font-serif text-3xl font-bold ${accent ? 'text-secondary' : 'text-primary'}`}>
        {value}
      </p>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { member } = useAuth();
  const { data: summary } = useCommissionSummary();
  const { data: referrals } = useReferrals();

  if (!member) return null;
  const recent = (referrals ?? []).slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <Seo title="Dashboard — Oficina Virtual" />

      <div>
        <h1 className="text-3xl font-bold text-primary">Hola, {member.fullName.split(' ')[0]} 👋</h1>
        <p className="mt-1 text-brand-gray">
          Eres miembro <strong>{statusLabel(member.status)}</strong>
          {member.membershipAwarded && ' · Membresía de viajes GRATIS 🎁'}
        </p>
      </div>

      {/* Cards resumen */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total ganado" value={formatCurrency(summary?.totalEarned ?? 0)} />
        <StatCard label="Saldo disponible" value={formatCurrency(summary?.available ?? 0)} accent />
        <StatCard
          label="Referidos"
          value={`${member.totalReferrals}`}
        />
        <StatCard label="Comisiones del mes" value={formatCurrency(summary?.thisMonth ?? 0)} />
      </div>

      {/* Progreso a Elite (solo Premiere) */}
      <ProgressToElite member={member} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Próximo pago */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h3 className="text-lg font-semibold text-primary">Próximo pago</h3>
          <p className="mt-2 text-sm text-brand-gray">
            Frecuencia:{' '}
            {member.status === 'ELITE' ? 'Quincenal (días 5 y 20)' : 'Mensual (día 15)'}
          </p>
          <p className="mt-4 font-serif text-2xl font-bold text-accent">
            {formatCurrency(summary?.liquidated ?? 0)}
          </p>
          <p className="text-xs text-brand-gray">Monto liquidado listo para el próximo ciclo.</p>
        </div>

        {/* Últimos referidos */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-primary">Últimos referidos</h3>
            <Link to="/oficina/mi-red" className="text-sm text-accent hover:underline">
              Ver todos
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {recent.length === 0 && (
              <li className="text-sm text-brand-gray">Aún no tienes referidos.</li>
            )}
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm">
                <span className="text-primary">{r.referred.fullName}</span>
                <span className="text-xs text-brand-gray">Nivel {r.level}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Acción principal: es literalmente cómo el socio gana dinero, así
          que va destacada aparte de los demás accesos, no como uno más. */}
      <Link
        to="/oficina/herramientas"
        className="flex items-center gap-4 rounded-2xl bg-secondary/15 p-6 shadow-sm ring-1 ring-secondary/40 transition hover:bg-secondary/25 hover:shadow-md"
      >
        <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-secondary text-primary">
          <Link2 className="h-6 w-6" strokeWidth={2} />
        </span>
        <div>
          <p className="font-semibold text-primary">Mi enlace y comisiones</p>
          <p className="text-sm text-brand-gray">Comparte tu enlace y empieza a ganar</p>
        </div>
      </Link>

      {/* Links rápidos */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { to: '/oficina/mi-red', label: 'Mi Red', icon: Users },
          { to: '/oficina/comisiones', label: 'Comisiones', icon: DollarSign },
          { to: '/oficina/pagos', label: 'Pagos', icon: Wallet },
          { to: '/oficina/viajes', label: 'Mis Viajes', icon: Luggage },
        ].map((q) => (
          <Link
            key={q.to}
            to={q.to}
            className="flex flex-col items-center gap-2 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5 transition hover:shadow-md"
          >
            <q.icon className="h-6 w-6 text-accent" strokeWidth={1.6} />
            <span className="text-sm font-medium text-primary">{q.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

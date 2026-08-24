import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { statusLabel } from '@/lib/referral';
import { NotificationBell } from './NotificationBell';

export function OfficeHeader() {
  const { member, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/oficina/login');
  }

  if (!member) return null;
  const isElite = member.status === 'ELITE';

  return (
    <header className="flex items-center justify-between border-b border-black/5 bg-white px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="md:hidden">
          <img src="/images/logo-completo.svg" alt="Grupo 3i — Volver al inicio" className="h-7 w-auto" />
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-primary">{member.fullName}</p>
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              isElite ? 'bg-secondary text-primary' : 'bg-blue-100 text-blue-700'
            }`}
          >
            {statusLabel(member.status)}
          </span>
        </div>
        <NotificationBell />
        <button
          onClick={handleLogout}
          className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-brand-gray hover:bg-light hover:text-primary"
        >
          Salir
        </button>
      </div>
    </header>
  );
}

import { useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const titles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/productos': 'Productos',
  '/admin/proyectos': 'Proyectos',
  '/admin/miembros': 'Miembros',
  '/admin/comisiones': 'Comisiones',
  '/admin/compras': 'Compras',
  '/admin/reportes': 'Reportes',
  '/admin/configuracion': 'Configuración',
};

export function AdminHeader() {
  const { staff, logout } = useAdminAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const title = titles[pathname] ?? 'Admin';

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  return (
    <header className="flex items-center justify-between border-b border-black/5 bg-white px-4 py-3 sm:px-6">
      <div>
        <p className="text-xs text-brand-gray">Grupo 3i / {title}</p>
        <h1 className="text-lg font-semibold text-primary">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-primary">{staff?.username}</p>
          <p className="text-[10px] uppercase tracking-wider text-brand-gray">{staff?.role}</p>
        </div>
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

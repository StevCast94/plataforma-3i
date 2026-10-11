import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ROLE_LABEL, titleFor, type StaffRole } from '@/lib/adminNav';
import { AdminBrand, AdminNav } from './AdminSidebar';

export function AdminHeader() {
  const { staff, logout } = useAdminAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const { title, group } = titleFor(pathname);

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  return (
    <>
      <header className="flex items-center justify-between gap-3 border-b border-black/5 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setOpen(true)} aria-label="Abrir menú" className="rounded-lg p-1.5 hover:bg-light md:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs text-brand-gray">Admin / {group}</p>
            <h1 className="text-lg font-semibold text-primary">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-primary">{staff?.username}</p>
            <p className="text-[10px] uppercase tracking-wider text-brand-gray">{ROLE_LABEL[staff?.role as StaffRole] ?? staff?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-brand-gray hover:bg-light hover:text-primary"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Menú en el celular */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-primary px-3 py-5">
            <button onClick={() => setOpen(false)} aria-label="Cerrar menú" className="absolute right-3 top-4 rounded-lg p-1.5 text-white/70 hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
            <AdminBrand />
            <AdminNav onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}

import { Bell } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useNotifications } from '@/hooks/useNotifications';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data, loading, reload } = useNotifications();
  const items = data?.items ?? [];
  const unread = data?.unread ?? 0;

  async function markAll() {
    try {
      await api.put('/notifications/read-all');
      reload();
    } catch {
      /* noop */
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative cursor-pointer rounded-full p-2 hover:bg-light"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5 text-primary" strokeWidth={1.8} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5"
            >
              <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
                <span className="font-semibold text-primary">Notificaciones</span>
                {unread > 0 && (
                  <button
                    onClick={markAll}
                    className="cursor-pointer text-xs text-accent hover:underline"
                  >
                    Marcar todas
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {loading && <p className="p-4 text-sm text-brand-gray">Cargando…</p>}
                {!loading && items.length === 0 && (
                  <p className="p-6 text-center text-sm text-brand-gray">
                    Sin notificaciones
                  </p>
                )}
                {items.map((n) => (
                  <div
                    key={n.id}
                    className={`border-b border-black/5 px-4 py-3 ${n.read ? '' : 'bg-light'}`}
                  >
                    <p className="text-sm font-semibold text-primary">{n.title}</p>
                    <p className="mt-0.5 text-xs text-brand-gray">{n.body}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

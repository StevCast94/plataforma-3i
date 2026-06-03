import type { ReactNode } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  danger,
  loading,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {message && <div className="text-sm text-brand-gray">{message}</div>}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant={danger ? 'secondary' : 'primary'}
          onClick={onConfirm}
          disabled={loading}
          className={danger ? 'bg-red-600 text-white hover:bg-red-700' : ''}
        >
          {loading ? 'Procesando…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

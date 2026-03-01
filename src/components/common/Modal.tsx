import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {title && <div className="modal__title">{title}</div>}
        {children}
      </div>
    </div>,
    document.body,
  );
}

interface ConfirmModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
}

export function ConfirmModal({ open, onConfirm, onCancel, title, message }: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>{message}</p>
      <div className="modal__actions">
        <button className="btn btn--secondary" style={{ flex: 1 }} onClick={onCancel}>Отмена</button>
        <button className="btn btn--danger" style={{ flex: 1 }} onClick={onConfirm}>Удалить</button>
      </div>
    </Modal>
  );
}

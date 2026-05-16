"use client";

import { Modal } from "../Modal";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal title={title} open={open} onClose={onClose} size="sm">
      {message && <p className="modal-message">{message}</p>}
      <div className="modal-actions">
        <button type="button" className="btn-ghost" onClick={onClose}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={variant === "danger" ? "btn-danger" : "btn-primary"}
          onClick={handleConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

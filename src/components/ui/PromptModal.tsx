"use client";

import { useEffect, useState } from "react";
import { Modal } from "../Modal";

interface PromptModalProps {
  open: boolean;
  title: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

export function PromptModal({
  open,
  title,
  label,
  placeholder,
  defaultValue = "",
  confirmLabel = "Save",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
}: PromptModalProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (open) setValue(defaultValue);
  }, [open, defaultValue]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onConfirm(value.trim());
    onClose();
  };

  return (
    <Modal title={title} open={open} onClose={onClose} size="sm">
      <form onSubmit={submit} className="modal-form">
        {label && (
          <label className="label" htmlFor="prompt-input">
            {label}
          </label>
        )}
        <input
          id="prompt-input"
          className="input"
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            {cancelLabel}
          </button>
          <button type="submit" className="btn-primary" disabled={!value.trim()}>
            {confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

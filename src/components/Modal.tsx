"use client";

import { X } from "lucide-react";

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  size?: "sm" | "md";
  children: React.ReactNode;
}

export function Modal({ title, open, onClose, size = "md", children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close"
        onClick={onClose}
      />
      <div className={`modal-panel ${size === "sm" ? "modal-panel--sm" : ""}`}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="m-0 text-lg font-bold tracking-tight" style={{ color: "var(--text)" }}>
            {title}
          </h2>
          <button type="button" onClick={onClose} className="btn-ghost rounded-lg p-1.5">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  abierto: boolean;
  onClose: () => void;
  titulo?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Modal centrado en escritorio; en celular sube desde abajo (bottom sheet). */
export function Modal({ abierto, onClose, titulo, children, footer }: ModalProps) {
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [abierto, onClose]);

  if (!abierto) return null;

  return (
    <div className="gy-modal-bg" onClick={onClose} role="presentation">
      <div
        className="gy-modal"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button
            className="gy-btn gy-btn-plano !p-2"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">{children}</div>
        {footer && (
          <div
            className="flex justify-end gap-2 border-t p-4 sm:p-5"
            style={{ borderColor: "var(--borde-suave)" }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

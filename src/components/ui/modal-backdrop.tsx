"use client";

import React from "react";
import { createPortal } from "react-dom";

interface ModalBackdropProps {
  children: React.ReactNode;
  onClose?: () => void;
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
  ariaLabel: string;
}

export function ModalBackdrop({
  children,
  onClose,
  closeOnEscape = true,
  closeOnBackdropClick = true,
  ariaLabel,
}: ModalBackdropProps) {
  React.useEffect(() => {
    if (!closeOnEscape || !onClose) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [closeOnEscape, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/60"
        aria-hidden
        onClick={() => {
          if (closeOnBackdropClick) onClose?.();
        }}
      />
      <div className="relative z-[1] flex flex-col items-center">{children}</div>
    </div>,
    document.body,
  );
}

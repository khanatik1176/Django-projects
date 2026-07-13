"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  size?: "md" | "lg" | "xl";
}

const sizes = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  size = "lg",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-[#0a1f17]/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "relative z-10 flex max-h-[min(92dvh,900px)] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl",
          sizes[size],
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#ecf1ed] px-5 py-4 sm:px-6">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-[#14201a]">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-[#5c6b63]">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#5c6b63] transition hover:bg-[#ecf1ed] hover:text-[#14201a]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";

interface ActionModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Footer actions — rendered in a sticky bottom bar */
  footer?: React.ReactNode;
  /** "panel" = right slide-over (wider, good for forms), "dialog" = centered (good for confirmations) */
  variant?: "dialog" | "panel";
  size?: "sm" | "md" | "lg";
}

const PANEL_WIDTHS = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-2xl",
} as const;

const DIALOG_WIDTHS = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
} as const;

export default function ActionModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = "dialog",
  size = "md",
}: ActionModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  if (variant === "dialog") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        {/* Dialog */}
        <div
          className={cn(
            "relative bg-white rounded-2xl shadow-xl w-full mx-4 flex flex-col max-h-[90vh]",
            DIALOG_WIDTHS[size]
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-brand-border">
            <div>
              <h2 className="text-base font-semibold text-brand-text-primary">
                {title}
              </h2>
              {description && (
                <p className="text-sm text-brand-text-secondary mt-1">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 shrink-0 text-brand-text-secondary hover:text-brand-text-primary transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="p-6 border-t border-brand-border bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Panel (slide-over)
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          "relative ml-auto bg-white shadow-2xl flex flex-col h-full w-full",
          PANEL_WIDTHS[size]
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-brand-border">
          <div>
            <h2 className="text-base font-semibold text-brand-text-primary">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-brand-text-secondary mt-1">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 text-brand-text-secondary hover:text-brand-text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-brand-border bg-gray-50 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
"use client";

import { useEffect } from "react";
import { X, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";

interface ActionDialogProps {
  open: boolean;
  onClose: () => void;

  title: string;
  description?: string;

  children: React.ReactNode;

  onConfirm: () => void;

  confirmText: string;
  cancelText?: string;

  confirmVariant?: "primary" | "danger";
  confirmDisabled?: boolean;

  loading?: boolean;
  error?: React.ReactNode;
  
  width?: "sm" | "md" | "lg";

  closeOnBackdrop?: boolean;
}

const WIDTHS = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-2xl",
} as const;

export default function ActionDialog({
  open,
  onClose,
  title,
  description,
  children,
  onConfirm,
  confirmText,
  cancelText = "Cancel",
  confirmVariant = "primary",
  loading = false,
  error = null,
  width = "md",
  closeOnBackdrop = true,
  confirmDisabled = false,
}: ActionDialogProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => {
          if (closeOnBackdrop && !loading) {
            onClose();
          }
        }}
      />

      <div
        className={cn(
          "relative w-full rounded-2xl bg-white shadow-xl",
          "flex max-h-[90vh] flex-col",
          WIDTHS[width],
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-brand-border p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-brand-text-primary">
              {title}
            </h2>

            {description && (
              <p className="text-sm text-brand-text-secondary">
                {description}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-md p-1 text-brand-text-secondary transition-colors hover:bg-brand-background hover:text-brand-text-primary"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {children}

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 shrink-0" size={18} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-brand-border bg-gray-50 p-6 rounded-b-2xl">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>

          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
             disabled={loading || confirmDisabled}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
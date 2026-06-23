"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /**
   * Marks the action as destructive — shows a red confirm button.
   * Existing callers use this; new callers can use `variant` instead.
   */
  destructive?: boolean;
  /**
   * Fine-grained variant. "danger" = red, "warning" = amber.
   * When omitted, falls back to `destructive` for colour resolution.
   */
  variant?: "danger" | "warning";
  /**
   * Icon rendered inside the coloured circle at the top of the dialog.
   * Defaults to AlertTriangle. Pass null to hide the circle entirely.
   */
  icon?: React.ReactNode;
  /**
   * Shows a loading spinner in the confirm button and disables both
   * buttons. Use for async actions to prevent double-clicks.
   */
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  variant,
  icon,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  // Track when we're mounted on the client so createPortal can target document.body
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!open || !mounted) return null;

  // Resolve colour: explicit variant wins, then legacy destructive flag, then brand purple
  const isDanger  = variant === "danger"  || (variant === undefined && destructive);
  const isWarning = variant === "warning";

  const iconBg    = isDanger  ? "bg-red-50"              : isWarning ? "bg-amber-50"              : "bg-brand-purple/10";
  const iconColor = isDanger  ? "text-red-500"            : isWarning ? "text-amber-500"            : "text-brand-purple";
  const btnCls    = isDanger  ? "bg-red-600 hover:bg-red-700"
                  : isWarning ? "bg-amber-500 hover:bg-amber-600"
                  :             "bg-brand-purple hover:bg-brand-purple-dark";

  const showIcon = icon !== null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon + heading row */}
        <div className="flex items-center gap-3 mb-3">
          {showIcon && (
            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
              <span className={iconColor}>
                {icon ?? <AlertTriangle size={18} />}
              </span>
            </div>
          )}
          <div>
            <h3 className="text-base font-semibold text-brand-text-primary">{title}</h3>
          </div>
        </div>

        <p className="text-sm text-brand-text-secondary mb-5">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex-1 h-10 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2",
              btnCls
            )}
          >
            {loading && (
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {loading ? "Please wait…" : confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 h-10 rounded-lg border border-brand-border text-sm font-medium text-brand-text-primary hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

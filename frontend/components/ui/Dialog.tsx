"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-brand-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-brand-text-primary">{title}</h2>
            {description && (
              <p className="text-sm text-brand-text-secondary mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-brand-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

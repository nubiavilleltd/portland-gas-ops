// components/ui/ErrorBanner.tsx

"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorBannerProps {
  message?: string | null;
  className?: string;
}

export default function ErrorBanner({
  message,
  className,
}: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700",
        className
      )}
    >
      <AlertCircle size={18} className="mt-0.5 shrink-0" />

      <div className="min-w-0">
        <p className="font-medium">Something went wrong</p>
        <p className="mt-0.5 text-red-600">{message}</p>
      </div>
    </div>
  );
}
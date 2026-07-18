"use client";

import type { ReactNode } from "react";

import Button from "@/components/ui/Button";

type PageErrorStateProps = {
  message: string;
  title?: string;
  onRetry?: () => void;
  retryLabel?: string;
  children?: ReactNode;
};

export default function PageErrorState({
  message,
  title = "Something went wrong",
  onRetry,
  retryLabel = "Try Again",
  children,
}: PageErrorStateProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <h2 className="text-lg font-semibold text-red-700">
        {title}
      </h2>

      <p className="mt-2 text-sm text-red-600">
        {message}
      </p>

      {onRetry && (
        <Button
          onClick={onRetry}
          className="mt-4"
        >
          {retryLabel}
        </Button>
      )}

      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
}
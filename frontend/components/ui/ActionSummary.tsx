"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { keyof } from "zod";






const VARIANTS = {
  warning: {
    container: "border-amber-200 bg-amber-50",
    title: "text-amber-900",
    text: "text-amber-800",
    bullet: "bg-amber-600",
  },
  danger: {
    container: "border-red-200 bg-red-50",
    title: "text-red-900",
    text: "text-red-800",
    bullet: "bg-red-600",
  },
  success: {
    container: "border-green-200 bg-green-50",
    title: "text-green-900",
    text: "text-green-800",
    bullet: "bg-green-600",
  },
  info: {
    container: "border-blue-200 bg-blue-50",
    title: "text-blue-900",
    text: "text-blue-800",
    bullet: "bg-blue-600",
  },
} as const;



type ActionSummaryVariant = keyof typeof VARIANTS;

interface ActionSummaryProps {
  title?: string;
  items: string[];
  variant?: ActionSummaryVariant
}


export default function ActionSummary({
  title,
  items,
  variant = "warning",
}: ActionSummaryProps) {
  const styles = VARIANTS[variant];

  return (
    <div className={`rounded-xl border p-4 ${styles.container}`}>
      {title && (
        <p className={`mb-2 text-sm font-medium ${styles.title}`}>
          {title}
        </p>
      )}

      <ul className={`space-y-2 text-sm ${styles.text}`}>
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2"
          >
            <span
              className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${styles.bullet}`}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
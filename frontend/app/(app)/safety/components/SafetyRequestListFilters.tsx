"use client";

import { cn } from "@/lib/utils";

export type SafetyRequestListFilter = "all" | "raised" | "assigned" | "approval";

const filterOptions: { value: SafetyRequestListFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "raised", label: "Raised by me" },
  { value: "assigned", label: "Assigned to me" },
  { value: "approval", label: "Awaiting my approval" },
];

export default function SafetyRequestListFilters({
  value,
  onChange,
}: {
  value: SafetyRequestListFilter;
  onChange: (value: SafetyRequestListFilter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {filterOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "cursor-pointer rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
            value === option.value
              ? "border-brand-purple bg-brand-purple text-white"
              : "border-brand-border bg-white text-brand-text-secondary hover:bg-gray-50 hover:text-brand-text-primary",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

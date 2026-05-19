"use client";

import { cn } from "@/lib/utils";
import type { WorkAuthorizationRole } from "@/types/safety";

const roleOptions: { value: WorkAuthorizationRole; label: string }[] = [
  { value: "requester", label: "Requester" },
  { value: "supervisor", label: "Supervisor" },
  { value: "hse", label: "HSE Inspector" },
];

export default function MockUserSwitcher({
  value,
  onChange,
}: {
  value: WorkAuthorizationRole;
  onChange: (role: WorkAuthorizationRole) => void;
}) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-text-primary">Mock user role</p>
          <p className="mt-1 text-sm text-brand-text-secondary">
            Switch roles to preview role-based visibility and actions.
          </p>
        </div>
        <div className="flex w-full rounded-xl border border-brand-border bg-gray-50 p-1 md:w-auto">
          {roleOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors md:flex-none",
                value === option.value
                  ? "bg-brand-purple text-white"
                  : "text-brand-text-secondary hover:text-brand-text-primary"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

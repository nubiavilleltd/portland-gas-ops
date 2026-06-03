"use client";

import { cn } from "@/lib/utils";
import type { WorkAuthorizationRole } from "@/types/safety";

export type MockUserRoleOption<T extends string> = {
  value: T;
  label: string;
};

const defaultRoleOptions: MockUserRoleOption<WorkAuthorizationRole>[] = [
  { value: "requester", label: "Requester" },
  { value: "supervisor", label: "Supervisor" },
  { value: "hse", label: "HSE Inspector" },
];

export default function MockUserSwitcher<T extends string = WorkAuthorizationRole>({
  value,
  onChange,
  roles,
  showSupervisor = true,
  title = "Mock user role",
  description = "Switch roles to preview role-based visibility and actions.",
}: {
  value: T;
  onChange: (role: T) => void;
  roles?: MockUserRoleOption<T>[];
  showSupervisor?: boolean;
  title?: string;
  description?: string;
}) {
  const configuredRoles = roles ?? (defaultRoleOptions as MockUserRoleOption<T>[]);
  const visibleRoles = showSupervisor
    ? configuredRoles
    : configuredRoles.filter((option) => option.value !== "supervisor");

  return (
    <div className="rounded-2xl border border-brand-border bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-text-primary">{title}</p>
          <p className="mt-1 text-sm text-brand-text-secondary">
            {description}
          </p>
        </div>
        <div className="flex w-full rounded-xl border border-brand-border bg-gray-50 p-1 md:w-auto">
          {visibleRoles.map((option) => (
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

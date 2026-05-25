"use client";

import { cn } from "@/lib/utils";
import type { WorkInitiationRole } from "@/types/safety";

const roles: { value: WorkInitiationRole; label: string }[] = [
  { value: "requester", label: "Requester" },
  { value: "supervisor", label: "Supervisor" },
  { value: "operations_hod", label: "Operations HOD" },
];

export default function WorkInitiationRoleSwitcher({
  value,
  onChange,
}: {
  value: WorkInitiationRole;
  onChange: (role: WorkInitiationRole) => void;
}) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-text-primary">Mock user role</p>
          <p className="mt-1 text-sm text-brand-text-secondary">
            Switch roles to preview supervisor and Operations HOD approvals.
          </p>
        </div>
        <div className="flex w-full rounded-xl border border-brand-border bg-gray-50 p-1 md:w-auto">
          {roles.map((role) => (
            <button
              key={role.value}
              type="button"
              onClick={() => onChange(role.value)}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors md:flex-none",
                value === role.value
                  ? "bg-brand-purple text-white"
                  : "text-brand-text-secondary hover:text-brand-text-primary",
              )}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

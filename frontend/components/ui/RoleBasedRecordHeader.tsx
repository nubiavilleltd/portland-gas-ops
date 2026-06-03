"use client";

import type { ReactNode } from "react";
import MockUserSwitcher, { type MockUserRoleOption } from "./MockUserSwitcher";

type Props<T extends string> = {
  id: string;
  currentRole: T;
  onRoleChange: (role: T) => void;
  roleLabel: string;
  roles: MockUserRoleOption<T>[];
  status: ReactNode;
  recordLabel?: string;
  title?: string;
  nextActor?: string;
  switcherTitle?: string;
  switcherDescription?: string;
};

export default function RoleBasedRecordHeader<T extends string>({
  id,
  currentRole,
  onRoleChange,
  roleLabel,
  roles,
  status,
  recordLabel,
  title,
  nextActor,
  switcherTitle = "Mock user role",
  switcherDescription = "Switch roles to preview role-based visibility and actions.",
}: Props<T>) {
  return (
    <div className="space-y-5">
      <MockUserSwitcher
        value={currentRole}
        onChange={onRoleChange}
        roles={roles}
        title={switcherTitle}
        description={switcherDescription}
      />

      <section className="rounded-2xl border border-brand-border bg-white p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            {recordLabel ? (
              <p className="text-xs font-medium uppercase tracking-wide text-brand-text-secondary">
                {recordLabel}
              </p>
            ) : null}
            <h2 className={recordLabel ? "mt-1 text-xl font-semibold text-brand-text-primary" : "text-xl font-semibold text-brand-text-primary"}>
              {id}
            </h2>
            <p className="mt-1 text-sm text-brand-text-secondary">
              Viewing as {roleLabel}
            </p>
            {nextActor ? (
              <p className="mt-1 text-sm text-brand-text-secondary">
                Next actor <span className="font-medium text-brand-text-primary">{nextActor}</span>
              </p>
            ) : null}
            {title ? (
              <p className="mt-1 text-sm font-medium text-brand-text-primary">{title}</p>
            ) : null}
          </div>
          {status}
        </div>
      </section>
    </div>
  );
}

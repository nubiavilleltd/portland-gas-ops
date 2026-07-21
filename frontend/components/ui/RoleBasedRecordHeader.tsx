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
  nextApproverName?: string;
  nextApproverRole?: string;
  switcherTitle?: string;
  switcherDescription?: string;
  showRoleSwitcher?: boolean;
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
  nextApproverName,
  nextApproverRole,
  switcherTitle = "Current access",
  switcherDescription = "Available actions are based on the current employee profile and record assignment.",
  showRoleSwitcher = true,
}: Props<T>) {
  return (
    <div className="space-y-5">
      {showRoleSwitcher ? (
        <MockUserSwitcher
          value={currentRole}
          onChange={onRoleChange}
          roles={roles}
          title={switcherTitle}
          description={switcherDescription}
        />
      ) : null}

      <section className="rounded-2xl border border-brand-border bg-white p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            {recordLabel ? (
              <p className="text-xs font-medium uppercase tracking-wide text-brand-text-secondary">
                {recordLabel}
              </p>
            ) : null}
            <h2 className={recordLabel ? "mt-1 text-xl font-semibold text-brand-text-primary" : "text-xl font-semibold text-brand-text-primary"}>
              <span className="text-brand-text-secondary">Reference:</span> {id}
            </h2>
            {title ? (
              <p className="mt-1 text-sm text-brand-text-secondary">
                Request Title: <span className="font-medium text-brand-text-primary">{title}</span>
              </p>
            ) : null}
            <p className="mt-1 text-sm text-brand-text-secondary">
              Current Access: <span className="font-medium text-brand-text-primary">{roleLabel}</span>
            </p>
            {nextApproverName ? (
              <p className="mt-1 text-sm text-brand-text-secondary">
                Next Approver Name: <span className="font-medium text-brand-text-primary">{nextApproverName}</span>
              </p>
            ) : null}
            {nextApproverRole ? (
              <p className="mt-1 text-sm text-brand-text-secondary">
                Next Approver Role: <span className="font-medium text-brand-text-primary">{nextApproverRole}</span>
              </p>
            ) : nextActor ? (
              <p className="mt-1 text-sm text-brand-text-secondary">
                Next Actor: <span className="font-medium text-brand-text-primary">{nextActor.toLowerCase() === "closed" ? "None" : nextActor}</span>
              </p>
            ) : null}
          </div>
          {status}
        </div>
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { homeModuleGroups, type ModuleProcess } from "@/config/module-groups-admin";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

function canAccessModule(href: string, role: UserRole | undefined): boolean {
  void href;
  void role;
  return true;
}

export default function AdminPage() {
  const { user, isLoading } = useCurrentUser();

  return (
    <AppLayout pageTitle="Administration">
      <div className="mb-2">
        <h2 className="text-2xl font-semibold text-brand-text-primary">
          Administration
        </h2>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {homeModuleGroups.map((group) => (
          <section
            key={group.title}
            className="rounded-xl border border-brand-border bg-white p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-3 border-b border-brand-border pb-2">
              <h3 className="text-sm font-semibold text-brand-text-primary">
                {group.title}
              </h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {group.processes.map((mod) => (
                <ProcessLink
                  key={mod.href}
                  module={mod}
                  disabled={!canAccessModule(mod.href, user?.role)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {isLoading && (
        <div className="mt-10">
          <div className="h-4 w-40 bg-gray-100 rounded animate-pulse mb-3" />
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shrink-0 w-60 h-24 bg-white border border-brand-border rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function ProcessLink({
  module,
  disabled,
}: {
  module: ModuleProcess;
  disabled: boolean;
}) {
  const Icon = module.icon;

  return (
    <Link
      href={disabled ? "#" : module.href}
      aria-disabled={disabled}
      className={cn(
        "group flex min-h-[58px] items-center gap-3 rounded-lg px-3 py-2 transition-all",
        disabled
          ? "pointer-events-none opacity-50"
          : "hover:border-brand-purple hover:bg-white hover:shadow-sm"
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-purple ring-1 ring-brand-border">
        <Icon size={18} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-brand-text-primary">
          {module.name}
        </span>
        <span className="mt-0.5 line-clamp-1 text-xs text-brand-text-secondary">
          {module.description}
        </span>
      </span>
    </Link>
  );
}

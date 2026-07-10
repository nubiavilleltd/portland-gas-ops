"use client";

import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { homeModuleGroups, type ModuleProcess } from "@/config/module-groups";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

// TODO: implement real per-role access control
function canAccessModule(href: string, role: UserRole | undefined): boolean {
  void href;
  void role;
  return true;
}

export default function HomePage() {
  const { user } = useCurrentUser();

  return (
    <AppLayout>
      {/* Welcome row */}
      <div className="mb-2">
        <h2 className="text-2xl font-semibold text-brand-text-primary">
          Welcome back{user ? `, ${user.first_name ?? user.name?.split(" ")[0] ?? ""}` : ""}
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
              {/* <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-brand-text-secondary">
                {group.processes.length} {group.processes.length === 1 ? "process" : "processes"}
              </span> */}
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

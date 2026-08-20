"use client";

import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { useCurrentUser } from "@/hooks/useCurrentUser";
// import { homeModuleGroups, type ModuleProcess } from "@/config/module-groups";

import {
  homeModuleGroups,
  moduleColorClasses,
  moduleSizeClasses,
  type ModuleProcess,
  type ModuleColor,
  type GroupSize,
} from "@/config/module-groups";
import { ArrowRight } from "lucide-react";

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
          Welcome Back{user ? `, ${user.first_name ?? user.name?.split(" ")[0] ?? ""}` : ""} 👋
        </h2>
        <p className="mt-1 text-sm text-brand-text-secondary">
          Manage and access your workflows across all operations.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {homeModuleGroups.map((group) => (

       <section
            key={group.title}
            className={cn(
              "w-full rounded-xl border border-brand-border bg-white p-4",
              moduleSizeClasses[group.size]
            )}
          >
            <div className="mb-1 flex items-center gap-3 pb-3">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  moduleColorClasses[group.color].badgeBg,
                  moduleColorClasses[group.color].badgeText
                )}
              >
                <group.icon size={18} />
              </span>
              <h3 className="text-base font-semibold text-brand-text-primary">
                {group.title}
              </h3>
            </div>
           <div
              className={cn(
                "grid grid-cols-1 gap-x-5",
                group.size === "wide" && "lg:grid-cols-2"
              )}
            >
              {group.processes.map((mod, index) => {
                const isLastItem = index === group.processes.length - 1;

                return (
                  <ProcessLink
                    key={mod.href}
                    module={mod}
                    color={group.color}
                    disabled={!canAccessModule(mod.href, user?.role)}
                    showBorder={!isLastItem}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>

    </AppLayout>
  );
}



function ProcessLink({
  module,
  color,
  disabled,
  showBorder,
}: {
  module: ModuleProcess;
  color: ModuleColor;
  disabled: boolean;
  showBorder: boolean;
}) {
  const Icon = module.icon;

  return (
    <Link
      href={disabled ? "#" : module.href}
      aria-disabled={disabled}
      className={cn(
        "group flex min-h-[58px] items-center gap-3",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          moduleColorClasses[color].tileBg,
          moduleColorClasses[color].tileText
        )}
      >
        <Icon size={18} />
      </span>

    <div className={cn("min-w-0 flex-1 flex items-center justify-between py-3", showBorder && "border-b border-brand-border")}>  <span className="" >
        <span className="block truncate text-sm font-semibold text-brand-text-primary transition-colors group-hover:text-brand-purple">
          {module.name}
        </span>
        <span className="mt-0.5 line-clamp-1 text-xs text-brand-text-secondary">
          {module.description}
        </span>
      </span>

      <div className="bg-brand-purple/5 p-1.5 rounded-full transition-colors group-hover:bg-brand-purple/15"><ArrowRight size={15} className="shrink-0 text-brand-purple" /></div></div>
    </Link>
  );
}
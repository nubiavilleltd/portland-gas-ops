// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import EmptyState from "@/components/ui/EmptyState";

// export default function ModulePage() {
//   const name = "admin";
//   return (
//     <AppLayout pageTitle={name}>
//       <PageHeader title={name} description="This module is under active development" className="mb-6" />
//       <EmptyState title="Coming soon" description="This module page will be built next. The backend API stubs are ready." />
//     </AppLayout>
//   );
// }


"use client";

import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { homeModuleGroups, type ModuleProcess } from "@/config/module-groups-admin";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

// TODO: implement real per-role access control
function canAccessModule(href: string, role: UserRole | undefined): boolean {
  void href;
  void role;
  return true;
}

export default function AdminPage() {
  const { user, isLoading } = useCurrentUser();

  return (
    <AppLayout pageTitle="Admin">
      {/* Welcome row */}
      <div className="mb-2">
        <h2 className="text-2xl font-semibold text-brand-text-primary">
          {/* Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""} */}
          Welcome back, Admin
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

      {/* Pending approvals strip */}
      {/* {pendingApprovals && pendingApprovals.items.length > 0 && (
        <div className="mt-10">
          <h3 className="text-sm font-semibold text-brand-text-primary mb-3">
            My pending approvals ({pendingApprovals.total})
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {pendingApprovals.items.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                href="/approvals"
                className="shrink-0 bg-white border border-brand-border rounded-xl p-4 hover:border-brand-purple hover:shadow-sm transition-all w-60"
              >
                <p className="text-xs font-mono text-brand-text-secondary">{item.reference_id}</p>
                <p className="text-sm font-medium text-brand-text-primary mt-1 line-clamp-1">{item.reference_label}</p>
                <div className="flex items-center justify-between mt-3">
                  <ApprovalBadge status={item.status} />
                  <span className="text-xs text-brand-purple font-medium">Review →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )} */}

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
      // href={disabled ? "#" : `/admin${module.href}`}
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

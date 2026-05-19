"use client";

import Link from "next/link";
import {
  ShoppingCart, Package, Receipt, Truck, Wrench,
  ShieldCheck, AlertTriangle, BarChart3, Users, Settings,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ModuleCard from "@/components/ui/ModuleCard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMyApprovals } from "@/hooks/useApprovals";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const moduleGroups = [
  {
    title: "Operations",
    fullWidth: true,
    modules: [
      { name: "Fleet Management", description: "Vehicles, drivers & maintenance", icon: Truck, href: "/fleet" },
      { name: "Orders & Dispatch", description: "Gas orders, dispatch & delivery", icon: Package, href: "/orders" },
      { name: "Assets", description: "Equipment & maintenance scheduling", icon: Wrench, href: "/assets" },
    ],
  },
  {
    title: "Finance",
    fullWidth: true,
    modules: [
      { name: "Procurement", description: "Purchase requests & vendor management", icon: ShoppingCart, href: "/procurement" },
      { name: "Billing", description: "Invoices & payment tracking", icon: Receipt, href: "/billing" },
      { name: "Finance", description: "Cash requisitions, invoices & approvals", icon: BarChart3, href: "/finance" },
    ],
  },
  {
    title: "Compliance & Safety",
    modules: [
      { name: "Safety & Compliance", description: "Permits, inspections & certifications", icon: ShieldCheck, href: "/safety" },
      { name: "Incidents", description: "Incident & near-miss reporting", icon: AlertTriangle, href: "/safety/incidents" },
    ],
  },
  {
    title: "HR Management",
    fullWidth: true,
    modules: [
      { name: "HR Management", description: "Employees, leave & recruitment", icon: Users, href: "/hr" },
      { name: "Admin", description: "Users, roles & system configuration", icon: Settings, href: "/admin" },
    ],
  },
];

// TODO: implement real per-role access control
function canAccessModule(href: string, role: UserRole | undefined): boolean {
  void href;
  void role;
  return true;
}

export default function HomePage() {
  const { user, isLoading } = useCurrentUser();
  const { data: pendingApprovals } = useMyApprovals();

  return (
    <AppLayout pageTitle="Portland Gas Operations">
      {/* Welcome row */}
      <div className="mb-2">
        <h2 className="text-2xl font-semibold text-brand-text-primary">
          Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""}
        </h2>
        <p className="text-sm text-brand-text-secondary mt-1">
          What would you like to work on today?
        </p>
      </div>

      <div className="grid gap-x-4 gap-y-8 mt-8 xl:grid-cols-2">
        {moduleGroups.map((group) => (
          <section
            key={group.title}
            className={cn(group.fullWidth && "xl:col-span-2")}
          >
            <h3 className="text-2xl font-semibold text-brand-text-primary">
              {group.title}
            </h3>
            <div
              className={cn(
                "grid gap-3 md:gap-4 mt-4",
                group.fullWidth ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2"
              )}
            >
              {group.modules.map((mod) => (
                <ModuleCard
                  key={mod.href}
                  name={mod.name}
                  description={mod.description}
                  icon={mod.icon}
                  href={mod.href}
                  disabled={!canAccessModule(mod.href, user?.role)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Pending approvals strip */}
      {pendingApprovals && pendingApprovals.items.length > 0 && (
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
      )}

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

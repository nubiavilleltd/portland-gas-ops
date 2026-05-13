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
import type { UserRole } from "@/types";

const modules = [
  { name: "Procurement", description: "Purchase requests & vendor management", icon: ShoppingCart, href: "/procurement" },
  { name: "Orders & Dispatch", description: "Gas orders, dispatch & delivery", icon: Package, href: "/orders" },
  { name: "Billing", description: "Invoices & payment tracking", icon: Receipt, href: "/billing" },
  { name: "Fleet Management", description: "Vehicles, drivers & maintenance", icon: Truck, href: "/fleet" },
  { name: "Assets", description: "Equipment & maintenance scheduling", icon: Wrench, href: "/assets" },
  { name: "Safety & Compliance", description: "Permits, inspections & certifications", icon: ShieldCheck, href: "/safety" },
  { name: "Incidents", description: "Incident & near-miss reporting", icon: AlertTriangle, href: "/safety/incidents" },
  { name: "Finance", description: "Budgets, expenses & reports", icon: BarChart3, href: "/finance" },
  { name: "HR Management", description: "Employees, leave & recruitment", icon: Users, href: "/hr" },
  { name: "Admin", description: "Users, roles & system configuration", icon: Settings, href: "/admin" },
];

// TODO: implement real per-role access control
function canAccessModule(_href: string, _role: UserRole | undefined): boolean {
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

      {/* Module grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-8">
        {modules.map((mod) => (
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
                href={`/approvals/${item.id}`}
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

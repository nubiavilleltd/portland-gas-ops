"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Banknote,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  DollarSign,
  FileText,
  FolderOpen,
  Package,
  ShoppingCart,
  Settings,
  Store,
  Truck,
  Users,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMyApprovals } from "@/hooks/useApprovals";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

type HomeModule = {
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
};

type HomeModuleGroup = {
  title: string;
  modules: HomeModule[];
};

const moduleGroups: HomeModuleGroup[] = [
  {
    title: "Administration",
    modules: [
      { name: "Admin", description: "Users, roles & system configuration", icon: Settings, href: "/admin" },
    ],
  },
  {
    title: "Compliance & Safety",
    modules: [
      { name: "Incident & Hazard Report",  description: "Report incidents, hazards, near misses, and HSE corrective actions", icon: AlertTriangle, href: "/safety/incidents" },
      { name: "Work Authorization", description: "Request and approve work before it starts", icon: ClipboardCheck, href: "/safety/work-authorization" },
      { name: "Work Completion & Close-Out", description: "Confirm completed work and final close-out approval", icon: CheckCircle2, href: "/safety/work-close-out" },
    ],
  },
  {
    title: "Finance",
    modules: [
      { name: "Cash Requisition", description: "Petty cash and operational funds", icon: Banknote, href: "/finance/cash-requisitions" },
      { name: "Invoice Processing", description: "Supplier invoices and approvals", icon: FileText, href: "/finance/invoices" },
    ],
  },
  {
    title: "HR Management",
    modules: [
      { name: "Employee Profile", description: "Staff profiles and records", icon: Users, href: "/hr-management/employees" },
      { name: "Employee Records", description: "Document vault", icon: FolderOpen, href: "/hr-management/employee-records" },
      { name: "HR Policies", description: "Policy library and acknowledgements", icon: BookOpen, href: "/hr-management/policies" },
      { name: "Leave Requests", description: "Leave applications and approvals", icon: CalendarDays, href: "/hr-management/leave-requests" },
      { name: "Pay Slips", description: "Monthly pay slip viewer", icon: CreditCard, href: "/hr-management/payslips" },
      { name: "Payroll", description: "Payroll runs and disbursements", icon: DollarSign, href: "/hr-management/payroll" },
    ],
  },
  {
    title: "Operations",
    modules: [
      { name: "Fleet Management", description: "Vehicles, drivers & maintenance", icon: Truck, href: "/fleet" },
      { name: "Orders & Dispatch", description: "Gas orders, dispatch & delivery", icon: Package, href: "/orders" },
      { name: "Work Initiation", description: "Define, review, and assign operational work", icon: ClipboardCheck, href: "/work-initiation" },
    ],
  },
  {
    title: "Supply Chain",
    modules: [
      { name: "Assets", description: "Register, track & request company assets", icon: Package, href: "/assets" },
      { name: "Purchase Requests", description: "Raise & manage purchase requisitions", icon: ShoppingCart, href: "/procurement" },
      { name: "Vendors", description: "Suppliers & service providers", icon: Store, href: "/vendors" },
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
    <AppLayout>
      {/* Welcome row */}
      <div className="mb-2">
        <h2 className="text-2xl font-semibold text-brand-text-primary">
          Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""}
        </h2>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {moduleGroups.map((group) => (
          <section
            key={group.title}
            className="rounded-xl border border-brand-border bg-white p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-3 border-b border-brand-border pb-2">
              <h3 className="text-sm font-semibold text-brand-text-primary">
                {group.title}
              </h3>
              {/* <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-brand-text-secondary">
                {group.modules.length} {group.modules.length === 1 ? "process" : "processes"}
              </span> */}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {group.modules.map((mod) => (
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

function ProcessLink({
  module,
  disabled,
}: {
  module: HomeModule;
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

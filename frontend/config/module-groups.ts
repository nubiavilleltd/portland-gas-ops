import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  DollarSign,
  FileText,
  Package,
  ShoppingCart,
  Store,
  Truck,
  User,
  UserCircle,
  Users,
} from "lucide-react";

export type ModuleProcess = {
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
  routePrefixes?: readonly string[];
  showOnHome?: boolean;
};

export type ModuleGroup = {
  title: string;
  routePrefixes?: readonly string[];
  processes: readonly ModuleProcess[];
};

export const moduleGroups: readonly ModuleGroup[] = [
  // {
  //   title: "Administration",
  //   processes: [
  //     {
  //       name: "Admin",
  //       description: "Users, roles & system configuration",
  //       icon: Settings,
  //       href: "/admin",
  //     },
  //   ],
  // },
  {
    title: "Finance & HR Management",
    routePrefixes: ["/finance", "/hr-management/leave-requests", "/hr-management/my-payslips", "/hr-management/my-profile"],
    processes: [
      {
        name: "Cash Requisition",
        description: "Petty cash and operational funds",
        icon: Banknote,
        href: "/finance/cash-requisitions",
      },
      {
        name: "Invoice Processing",
        description: "Supplier invoices and approvals",
        icon: FileText,
        href: "/finance/invoices",
      },
      {
        name: "Leave Requests",
        description: "Leave applications and approvals",
        icon: CalendarDays,
        href: "/hr-management/leave-requests",
      },
      {
        name: "My Pay Slips",
        description: "View and download your monthly pay slips",
        icon: CreditCard,
        href: "/hr-management/my-payslips",
      },
      {
        name: "My Profile",
        description: "View your employee profile and documents",
        icon: UserCircle,
        href: "/hr-management/my-profile",
      },
      {
        name: "Billing",
        description: "Billing operations",
        icon: DollarSign,
        href: "/billing",
        showOnHome: false,
      },
    ],
  },
  {
    title: "Operations",
    processes: [
      {
        name: "Trips & Dispatch",
        description: "Trip planning, dispatch, and delivery tracking",
        icon: Truck,
        href: "/fleet/trips",
      },
      {
        name: "Orders",
        description: "Gas orders and delivery",
        icon: ClipboardList,
        href: "/orders",
      },
      {
        name: "Invoices",
        description: "Customer billing and invoice tracking",
        icon: FileText,
        href: "/invoices",
      },
        {
        name: "Payments",
        description: "Record and review payments",
        icon: DollarSign,
        href: "/payments",
        showOnHome: false,
      },
    ],
  },
  {
    title: "Safety & Compliance",
    routePrefixes: ["/safety"],
    processes: [
      {
        name: "Incident & Hazard Report",
        description: "Report incidents, hazards, near misses, and HSE corrective actions",
        icon: AlertTriangle,
        href: "/safety/incidents",
      },
      {
        name: "Work Initiation",
        description: "Define, review, and assign operational work",
        icon: ClipboardCheck,
        href: "/safety/work-initiation",
      },
      {
        name: "Work Authorization",
        description: "Request and approve work before it starts",
        icon: ClipboardCheck,
        href: "/safety/work-authorization",
      },
      {
        name: "Work Completion & Close-Out",
        description: "Confirm completed work and final close-out approval",
        icon: CheckCircle2,
        href: "/safety/work-close-out",
      },
    ],
  },
  {
    title: "Supply Chain",
    processes: [
      {
        name: "Assets",
        description: "Browse & request available company assets",
        icon: Package,
        href: "/assets",
      },
      {
        name: "Purchase & Service Requests",
        description: "Raise & manage purchase and service requisitions",
        icon: ShoppingCart,
        href: "/procurement",
      },
    ],
  },
];

export const homeModuleGroups = moduleGroups
  .map((group) => ({
    ...group,
    processes: group.processes.filter((process) => process.showOnHome !== false).sort((a, b) => a.name.localeCompare(b.name)),
  }))
  .filter((group) => group.processes.length > 0);

function matchesPath(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getModuleGroupForPathname(pathname: string): ModuleGroup | undefined {
  for (const group of moduleGroups) {
    const ownsProcessPath = group.processes.some((process) =>
      [process.href, ...(process.routePrefixes ?? [])].some((prefix) =>
        matchesPath(pathname, prefix),
      ),
    );

    if (ownsProcessPath) {
      return group;
    }

    if (group.routePrefixes?.some((prefix) => matchesPath(pathname, prefix))) {
      return group;
    }
  }

  return undefined;
}

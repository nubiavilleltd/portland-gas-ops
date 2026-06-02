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
  Settings,
  ShoppingCart,
  Store,
  Truck,
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
  {
    title: "Administration",
    processes: [
      {
        name: "Admin",
        description: "Users, roles & system configuration",
        icon: Settings,
        href: "/admin",
      },
    ],
  },
  {
    title: "Finance",
    routePrefixes: ["/finance"],
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
        routePrefixes: ["/finance/invoices", "/finance/process-map/invoice", "/invoices"],
      },
      {
        name: "Payments",
        description: "Record and review payments",
        icon: DollarSign,
        href: "/payments",
        showOnHome: false,
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
    title: "HR Management",
    routePrefixes: ["/hr-management", "/hr"],
    processes: [
      {
        name: "Employee Profile",
        description: "Staff profiles and records",
        icon: Users,
        href: "/hr-management/employees",
      },
      {
        name: "Leave Requests",
        description: "Leave applications and approvals",
        icon: CalendarDays,
        href: "/hr-management/leave-requests",
      },
      {
        name: "Pay Slips",
        description: "Monthly pay slip viewer",
        icon: CreditCard,
        href: "/hr-management/payslips",
      },
      {
        name: "Employee Records",
        description: "Document vault",
        icon: FolderOpen,
        href: "/hr-management/employee-records",
        showOnHome: false,
      },
      {
        name: "HR Policies",
        description: "Policy library and acknowledgements",
        icon: BookOpen,
        href: "/hr-management/policies",
        showOnHome: false,
      },
      {
        name: "Payroll",
        description: "Payroll runs and disbursements",
        icon: DollarSign,
        href: "/hr-management/payroll",
        showOnHome: false,
      },
    ],
  },
  {
    title: "Operations",
    processes: [
      {
        name: "Fleet Management",
        description: "Vehicles, drivers & maintenance",
        icon: Truck,
        href: "/fleet",
      },
      {
        name: "Orders & Dispatch",
        description: "Gas orders, dispatch & delivery",
        icon: Package,
        href: "/orders",
      },
      {
        name: "Work Initiation",
        description: "Define, review, and assign operational work",
        icon: ClipboardCheck,
        href: "/work-initiation",
      },
      {
        name: "Customers",
        description: "Customer accounts and records",
        icon: Users,
        href: "/customers",
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
        description: "Register, track & request company assets",
        icon: Package,
        href: "/assets",
      },
      {
        name: "Purchase & Service Requests",
        description: "Raise & manage purchase and service requisitions",
        icon: ShoppingCart,
        href: "/procurement",
      },
      {
        name: "Vendors",
        description: "Suppliers & service providers",
        icon: Store,
        href: "/vendors",
      },
    ],
  },
];

export const homeModuleGroups = moduleGroups
  .map((group) => ({
    ...group,
    processes: group.processes.filter((process) => process.showOnHome !== false),
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

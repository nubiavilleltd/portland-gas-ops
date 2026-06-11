import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Banknote,
  BarChart2,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  DollarSign,
  FileText,
  FolderOpen,
  Package,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  User,
  Users,
  Warehouse,
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
    title: "Finance & HR Management",
    processes: [
      {
        name: "Employee Profile",
        description: "Staff profiles and records",
        icon: Users,
        href: "/admin/employees",
      },
      {
        name: "Leave Balances",
        description: "Entitlement and usage by employee",
        icon: BarChart2,
        href: "/admin/leave-balances",
      },
      {
        name: "Pay Slip Management",
        description: "Generate and manage employee pay slips",
        icon: CreditCard,
        href: "/admin/payslips",
      },
      {
        name: "Employee Records",
        description: "Document vault",
        icon: FolderOpen,
        href: "/admin/employee-records",
        showOnHome: false,
      },
      {
        name: "HR Policies",
        description: "Policy library and acknowledgements",
        icon: BookOpen,
        href: "/admin/policies",
        showOnHome: false,
      },
      {
        name: "Payroll",
        description: "Payroll runs and disbursements",
        icon: DollarSign,
        href: "/admin/payroll",
        showOnHome: false,
      },
    ],
  },
  {
    title: "Operations",
    processes: [
      {
        name: "Vehicles",
        description: "Vehicle records, maintenance, and inspections",
        icon: Truck,
        href: "/admin/fleet/vehicles",
      },
      {
        name: "Drivers",
        description: "Driver records, licenses, and training",
        icon: User,
        href: "/admin/fleet/drivers",
      },

      {
        name: "Customers",
        description: "Customer accounts and records",
        icon: Users,
        href: "/admin/customers",
      },
      {
        name: "Products",
        description: "Gas products and pricing",
        icon: Package,
        href: "/admin/products",
      },
      {
        name: "Inventory",
        description: "Stock levels, tracked assets, and movements",
        icon: Warehouse,
        href: "/admin/inventory",
      },
    ],
  },
  {
    title: "Safety & Compliance",
    routePrefixes: ["/admin/safety"],
    processes: [
      {
        name: "Safety Dashboard",
        description:
          "Track HSE queue, close-outs, compliance, and hazard trends",
        icon: ShieldCheck,
        href: "/admin/safety",
      },
      {
        name: "Incident & Hazard Report",
        description:
          "Review all incident, hazard, near-miss, and corrective-action records",
        icon: AlertTriangle,
        href: "/admin/safety/incidents",
      },
      {
        name: "Work Initiation",
        description:
          "View all operational work requests before safety authorization",
        icon: ClipboardCheck,
        href: "/admin/safety/work-initiation",
      },
      {
        name: "Work Authorization",
        description: "View all HSE authorization requests and decisions",
        icon: ClipboardCheck,
        href: "/admin/safety/work-authorization",
      },
      {
        name: "Work Completion & Close-Out",
        description: "View all completed work and close-out approvals",
        icon: CheckCircle2,
        href: "/admin/safety/work-close-out",
      },
    ],
  },
  {
    title: "Supply Chain",
    routePrefixes: ["/admin/assets", "/admin/vendors"],
    processes: [
      {
        name: "Assets",
        description: "Register, track & manage all company assets",
        icon: Package,
        href: "/admin/assets",
        routePrefixes: ["/admin/assets"],
      },
      {
        name: "Vendors",
        description: "Suppliers & service providers",
        icon: Store,
        href: "/admin/vendors",
        routePrefixes: ["/admin/vendors"],
      },
    ],
  },
];

export const homeModuleGroups = moduleGroups
  .map((group) => ({
    ...group,
    processes: group.processes
      .filter((process) => process.showOnHome !== false)
      .sort((a, b) => a.name.localeCompare(b.name)),
  }))
  .filter((group) => group.processes.length > 0);

function matchesPath(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getModuleGroupForPathname(
  pathname: string,
): ModuleGroup | undefined {
  // Pass 1: exact process/routePrefix match (most specific)
  for (const group of moduleGroups) {
    const ownsProcessPath = group.processes.some((process) =>
      [process.href, ...(process.routePrefixes ?? [])].some((prefix) =>
        matchesPath(pathname, prefix),
      ),
    );
    if (ownsProcessPath) return group;
  }

  // Pass 2: group-level routePrefix fallback (less specific, e.g. /admin)
  for (const group of moduleGroups) {
    if (group.routePrefixes?.some((prefix) => matchesPath(pathname, prefix))) {
      return group;
    }
  }

  return undefined;
}

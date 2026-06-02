import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BarChart2,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  DollarSign,
  FileText,
  FolderOpen,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  User,
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
    routePrefixes: ["/admin"],
    processes: [
      {
        name: "HR Management",
        description: "Staff management and HR operations",
        icon: Users,
        href: "/admin",
      },
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
      // {
      //   name: "Fleet Management",
      //   description: "Vehicles, drivers & maintenance",
      //   icon: Truck,
      //   href: "/fleet",
      // },
      {
        name: "Trips & Dispatch",
        description: "Trip planning, dispatch, and delivery tracking",
        icon: Truck,
        href: "/fleet/trips",
      },
      {
        name: "Vehicles",
        description: "Vehicle records, maintenance, and inspections",
        icon: Truck,
        href: "/fleet/vehicles",
      },
      {
        name: "Drivers",
        description: "Driver records, licenses, and training",
        icon: User,
        href: "/fleet/drivers",
      },
      {
        name: "Orders",
        description: "Gas orders and delivery",
        icon: ClipboardList,
        href: "/orders",
      },
      {
        name: "Customers",
        description: "Customer accounts and records",
        icon: Users,
        href: "/customers",
      },
      {
        name: "Products",
        description: "Gas products and pricing",
        icon: Package,
        href: "/products",
      },
      {
        name: "Invoices",
        description: "Customer billing and invoice tracking",
        icon: FileText,
        href: "/invoices",
      },
    ],
  },
  {
    title: "Safety & Compliance",
    routePrefixes: ["/safety"],
    processes: [
      {
        name: "Safety Dashboard",
        description: "Track HSE queue, close-outs, compliance, and hazard trends",
        icon: ShieldCheck,
        href: "/safety",
      },
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
        description: "Register, track & request company assets",
        icon: Package,
        href: "/assets",
      },
      {
        name: "Purchase Requests",
        description: "Raise & manage purchase requisitions",
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

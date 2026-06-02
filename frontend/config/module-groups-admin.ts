import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  BarChart2,
  BookOpen,
  CalendarDays,
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
        name: "Leave Balances",
        description: "Entitlement and usage by employee",
        icon: BarChart2,
        href: "/hr-management/leave-balances",
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
    ],
  },
  {
    title: "Safety & Compliance",
    routePrefixes: ["/admin/safety"],
    processes: [
      {
        name: "Safety Dashboard",
        description: "Track HSE queue, close-outs, compliance, and hazard trends",
        icon: ShieldCheck,
        href: "/admin/safety",
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

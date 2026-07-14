import type { LucideIcon } from "lucide-react";
import {
  BarChart2,
  BookOpen,
  Building2,
  CalendarDays,
  CreditCard,
  DollarSign,
  GitBranch,
  HelpCircle,
  MessageSquare,
  Mic2,
  Newspaper,
  Package,
  Quote,
  Settings,
  ShieldCheck,
  Star,
  Store,
  Truck,
  User,
  UserPlus,
  Users,
  Users2,
  Warehouse,
  SlidersHorizontal,
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
    title: "Customer Relationship Management",
    routePrefixes: ["/admin/crm"],
    processes: [
      {
        name: "Customer Onboarding",
        description: "Register and onboard new customers",
        icon: UserPlus,
        href: "/admin/crm/onboarding",
      },
      {
        name: "Customers",
        description: "Manage customer accounts and profiles",
        icon: Users,
        href: "/admin/crm/customers",
      },
      {
        name: "Contacts",
        description: "Manage customer contact persons",
        icon: Users2,
        href: "/admin/crm/contacts",
      },
      {
        name: "Activities",
        description: "Track customer calls, meetings and interactions",
        icon: CalendarDays,
        href: "/admin/crm/activities",
      },
      {
        name: "Service Requests",
        description: "Manage customer enquiries and requests",
        icon: MessageSquare,
        href: "/admin/crm/service-requests",
      },
      {
        name: "Complaints",
        description: "Track and resolve customer complaints",
        icon: HelpCircle,
        href: "/admin/crm/complaints",
      },
      {
        name: "CRM Dashboard",
        description: "Customer insights and relationship metrics",
        icon: BarChart2,
        href: "/admin/crm/dashboard",
      },
    ],
  },
  {
    title: "Intranet CMS",
    routePrefixes: ["/admin/intranet"],
    processes: [
      {
        name: "News & Announcements",
        description: "Manage news articles and company announcements",
        icon: Newspaper,
        href: "/admin/intranet/news",
      },
      {
        name: "Events",
        description: "Manage upcoming events and calendar entries",
        icon: CalendarDays,
        href: "/admin/intranet/events",
      },
      {
        name: "FAQs",
        description: "Manage FAQ categories and Q&A pairs",
        icon: HelpCircle,
        href: "/admin/intranet/faqs",
      },
      {
        name: "Podcast",
        description: "Manage the featured podcast episode",
        icon: Mic2,
        href: "/admin/intranet/podcast",
      },
      {
        name: "Employee of the Month",
        description: "Set the current employee of the month",
        icon: Star,
        href: "/admin/intranet/employee-of-month",
      },
      {
        name: "Employee Spotlight",
        description: "Manage the three employee spotlight cards",
        icon: Users,
        href: "/admin/intranet/spotlight",
      },
      {
        name: "Leadership Messages",
        description: "Manage the homepage leadership carousel",
        icon: Quote,
        href: "/admin/intranet/leadership",
      },
      {
        name: "Feedback Inbox",
        description: "View and review employee feedback submissions",
        icon: MessageSquare,
        href: "/admin/intranet/feedback",
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
    title: "People & Administration",
    routePrefixes: ["/admin/accounts", "/admin/employees"],
    processes: [
      {
        name: "Account Management",
        description: "Create employee accounts and manage system access",
        icon: UserPlus,
        href: "/admin/accounts",
        routePrefixes: ["/admin/accounts"],
      },
      {
        name: "Employee Profiles",
        description: "Staff profiles, records and employment details",
        icon: Users,
        href: "/admin/employees",
        routePrefixes: ["/admin/employees"],
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
        name: "Payroll",
        description: "Payroll runs and disbursements",
        icon: DollarSign,
        href: "/admin/payroll",
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
        name: "System Settings",
        description: "Roles, permissions and system configuration",
        icon: Settings,
        href: "/admin/settings",
        showOnHome: false,
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
  {
    title: "Workflow & Approvals",
    routePrefixes: ["/admin/workflows"],
    processes: [
      {
        name: "Workflows",
        description: "Create and manage multi-step approval chains",
        icon: GitBranch,
        href: "/admin/workflows",
        routePrefixes: ["/admin/workflows"],
      },
      {
        name: "Workflow Assignments",
        description: "Map each request type to its active workflow",
        icon: Settings,
        href: "/admin/workflows/assignments?from=admin",
        routePrefixes: ["/admin/workflows/assignments"],
      },
    ],
  },
  {
    title: "Setups",
    routePrefixes: ["/admin/setups"],
    processes: [
      {
        name: "Departments",
        description: "Manage company departments linked to employee profiles",
        icon: Building2,
        href: "/admin/setups/departments",
        routePrefixes: ["/admin/setups/departments"],
      },
      {
        name: "Groups",
        description: "Named lists of people for workflow steps and other processes",
        icon: Users2,
        href: "/admin/setups/groups",
        routePrefixes: ["/admin/setups/groups"],
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

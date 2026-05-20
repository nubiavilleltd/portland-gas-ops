"use client";

import {
  Users,
  CalendarDays,
  FolderOpen,
  BookOpen,
  CreditCard,
  DollarSign,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import ModuleCard from "@/components/ui/ModuleCard";

const MODULES = [
  {
    name: "Employee Profile",
    description: "Staff profiles & records",
    icon: Users,
    href: "/hr-management/employees",
  },
  {
    name: "Leave Requests",
    description: "Leave applications & approvals",
    icon: CalendarDays,
    href: "/hr-management/leave-requests",
  },
  {
    name: "Employee Records",
    description: "Document vault",
    icon: FolderOpen,
    href: "/hr-management/employee-records",
  },
  {
    name: "HR Policies",
    description: "Policy library & acknowledgements",
    icon: BookOpen,
    href: "/hr-management/policies",
  },
  {
    name: "Pay Slips",
    description: "Monthly pay slip viewer",
    icon: CreditCard,
    href: "/hr-management/payslips",
  },
  {
    name: "Payroll",
    description: "Payroll runs & disbursements",
    icon: DollarSign,
    href: "/hr-management/payroll",
  },
];

export default function HRManagementPage() {
  return (
    <AppLayout pageTitle="HR Management">
      <PageHeader
        title="HR Management"
        description="Manage employees, leave, records, policies, pay slips, and payroll"
        className="mb-6"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
        {MODULES.map((mod) => (
          <ModuleCard
            key={mod.href}
            name={mod.name}
            description={mod.description}
            icon={mod.icon}
            href={mod.href}
          />
        ))}
      </div>
    </AppLayout>
  );
}

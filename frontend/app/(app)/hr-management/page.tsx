"use client";

import { Users, CalendarDays, CreditCard, BarChart2 } from "lucide-react";
// import { FolderOpen, BookOpen, DollarSign } from "lucide-react"; // restore when modules are re-enabled
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import ModuleCard from "@/components/ui/ModuleCard";

const MODULES = [
  {
    name: "Leave Requests",
    description: "Leave applications & approvals",
    icon: CalendarDays,
    href: "/hr-management/leave-requests",
  },
  {
    name: "My Pay Slips",
    description: "View and download your monthly pay slips",
    icon: CreditCard,
    href: "/hr-management/my-payslips",
  },
];

export default function HRManagementPage() {
  return (
    <AppLayout pageTitle="HR Management">
      <PageHeader
        title="HR Management"
        description="View your leave requests and pay slips"
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

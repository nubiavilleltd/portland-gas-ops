"use client";

import { Banknote, FileText } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import ModuleCard from "@/components/ui/ModuleCard";

const MODULES = [
  {
    name: "Cash Requisition",
    description: "Petty cash & operational funds",
    icon: Banknote,
    href: "/finance/cash-requisitions",
  },
  {
    name: "Invoice Processing",
    description: "Supplier invoices & approvals",
    icon: FileText,
    href: "/finance/invoices",
  },
];

export default function FinancePage() {
  return (
    <AppLayout pageTitle="Finance">
      <PageHeader
        title="Finance"
        description="Manage cash requests, supplier invoices, and payment approvals"
        className="mb-6"
      />
      <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
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

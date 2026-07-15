"use client";

import Button from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { Eye } from "lucide-react";

import type { CustomerOnboarding } from "@/lib/modules/crm";

const COLUMNS: Column<CustomerOnboarding>[] = [
  {
    key: "customer_name",
    label: "Customer",
    render: (_, customer) => (
      <div>
        <p className="font-medium">{customer.customer_name}</p>

        <p className="text-xs text-brand-text-secondary">{customer.industry}</p>
      </div>
    ),
  },

  {
    key: "contact_person",
    label: "Primary Contact",
    render: (_, customer) => (
      <div>
        <p>{customer.contact_person}</p>

        <p className="text-xs text-brand-text-secondary">{customer.phone}</p>
      </div>
    ),
  },

  {
    key: "category",
    label: "Category",
  },

  {
    key: "customer_status",
    label: "Status",
    render: (_, customer) => (
      <ApprovalBadge status={customer.customer_status ?? customer.status} />
    ),
  },

  {
    key: "actions",
    label: "",
    render: (_, customer) => (
      <Button
        size="sm"
        variant="outline"
        href={`/admin/crm/customers/${customer.id}`}
        leftIcon={<Eye size={14} />}
      >
        View
      </Button>
    ),
  },
];

type Props = {
  customers: CustomerOnboarding[];
};

export default function ActiveCustomersTable({ customers }: Props) {
  return (
    <div className="rounded-lg border border-brand-border bg-white">
      <div className="flex items-center justify-between  px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">Active Customers</h2>

          <p className="text-sm text-brand-text-secondary">
            Recently acknowledged and active customers.
          </p>
        </div>

        <Button size="sm" href="/admin/crm/customers">
          View All
        </Button>
      </div>

      <div className="px-6 py-4">
        <DataTable<CustomerOnboarding>
          columns={COLUMNS}
          data={customers}
          rowHref={(customer) => `/admin/crm/customers/${customer.id}`}
          searchPlaceholder="Search customers..."
          emptyMessage="No active customers found."
        />
      </div>
    </div>
  );
}

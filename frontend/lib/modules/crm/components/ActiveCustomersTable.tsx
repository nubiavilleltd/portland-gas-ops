"use client";

import Button from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { Eye } from "lucide-react";
import Link from "next/link";
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
    sortable: false,
    searchable: false,
    render: (_, customer) => (
      <Link
        href={`/crm/customers/${customer.id}`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-purple transition-colors hover:bg-brand-purple-faint"
        title="View Customer"
      >
        <Eye size={18} />
      </Link>
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
            Recently active customers.
          </p>
        </div>

        <Button size="sm" href="/crm/customers">
          View All
        </Button>
      </div>

      <div className="px-6 py-4">
        <DataTable<CustomerOnboarding>
          columns={COLUMNS}
          data={customers}
          rowHref={(customer) => `/crm/customers/${customer.id}`}
          searchPlaceholder="Search customers..."
          emptyMessage="No active customers found."
        />
      </div>
    </div>
  );
}

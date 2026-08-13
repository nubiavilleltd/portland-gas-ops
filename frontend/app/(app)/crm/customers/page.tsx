"use client";

import Link from "next/link";
import { Eye, Plus } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import Button from "@/components/ui/Button";
import { useCustomers } from "@/lib/modules/crm";

import { type CustomerOnboarding } from "@/lib/modules/crm";

const COLUMNS: Column<CustomerOnboarding>[] = [
  {
    key: "customer_name",
    label: "Customer",
  },

  {
    key: "entity_type",
    label: "Entity Type",
    render: (value) =>
      typeof value === "string" && value
        ? value.charAt(0).toUpperCase() + value.slice(1)
        : "-",
  },
  {
    key: "company_email",
    label: "Company Email",
  },

  {
    key: "industry",
    label: "Industry",
    render: (value) =>
      typeof value === "string" && value
        ? value.charAt(0).toUpperCase() + value.slice(1)
        : "-",
  },

  {
    key: "contact_person",
    label: "Primary Contact",
  },

  {
    key: "phone",
    label: "Phone",
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

export default function CustomersPage() {
  const { data: customers = [], isLoading } = useCustomers();
  const activeCustomers = customers;

  return (
    <AppLayout pageTitle="Customers">
      <PageHeader
        title="Customers"
        description="Manage active customers and their information."
        action={
          <Button
            href="/crm/customers/new"
            leftIcon={<Plus size={15} />}
            size="sm"
          >
            New Customer
          </Button>
        }
      />

      <DataTable<CustomerOnboarding>
        columns={COLUMNS}
        data={activeCustomers}
        rowHref={(customer) => `/crm/customers/${customer.id}`}
        searchPlaceholder="Search customers..."
        emptyMessage="No customers found."
        isLoading={isLoading}
      />
    </AppLayout>
  );
}

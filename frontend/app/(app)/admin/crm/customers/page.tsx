"use client";

import { Eye } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import Button from "@/components/ui/Button";

import {
  useCustomerOnboarding,
  type CustomerOnboarding,
} from "@/lib/modules/crm";

const COLUMNS: Column<CustomerOnboarding>[] = [
  {
    key: "customer_name",
    label: "Customer",
  },

  {
    key: "entity_type",
    label: "Entity Type",
  },

  {
    key: "industry",
    label: "Industry",
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

export default function CustomersPage() {
  const { data: customers = [], isLoading, isError } = useCustomerOnboarding();

  const activeCustomers = customers.filter(
    (customer) =>
      customer.status === "acknowledged" ||
      customer.customer_status === "active",
  );

  return (
    <AppLayout pageTitle="Customers">
      <PageHeader
        title="Customers"
        description="Manage active customers and their information."
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : isError ? (
        <div className="py-20 text-center text-brand-text-secondary">
          Failed to load customers.
        </div>
      ) : activeCustomers.length === 0 ? (
        <EmptyState
          title="No customers found"
          description="There are no acknowledged customers available."
        />
      ) : (
        <DataTable<CustomerOnboarding>
          columns={COLUMNS}
          data={activeCustomers}
          rowHref={(customer) => `/admin/crm/customers/${customer.id}`}
          searchPlaceholder="Search customers..."
          emptyMessage="No customers found."
        />
      )}
    </AppLayout>
  );
}

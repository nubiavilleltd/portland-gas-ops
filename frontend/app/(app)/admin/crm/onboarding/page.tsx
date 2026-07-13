"use client";

import { Plus } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import Button from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import { Eye } from "lucide-react";

import {
  useCustomerOnboarding,
  type CustomerOnboarding,
} from "@/lib/modules/crm";
import { capitalize } from "@/lib/utils";

import ApprovalBadge from "@/components/ui/ApprovalBadge";

export const icons = {
  // ...

  edit: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#059669"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
};

const TABLE_COLUMNS: Column<CustomerOnboarding>[] = [
  {
    key: "customer_name",
    label: "Customer",
    render: (_, customer) => (
      <div>
        <p className="font-medium">{customer.customer_name}</p>
        <p className="text-xs text-brand-text-secondary">
          {customer.onboarding_number}
        </p>
      </div>
    ),
  },

  {
    key: "category",
    label: "Category",
    render: (_, customer) => capitalize(customer.category),
  },

  {
    key: "contact_person",
    label: "Contact",
  },

  {
    key: "phone",
    label: "Phone",
  },

  {
    key: "status",
    label: "Status",
    render: (_, customer) => <ApprovalBadge status={customer.status} />,
  },

  {
    key: "submitted_at",
    label: "Submitted",
  },
  {
    key: "customer_status",
    label: "Customer Status",
    render: (_, customer) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          customer.customer_status?.toLowerCase() === "inactive"
            ? "bg-gray-100 text-gray-600"
            : "bg-green-100 text-green-700"
        }`}
      >
        {capitalize(customer.customer_status ?? "active")}
      </span>
    ),
  },
  {
    key: "actions",
    label: "",
    // align: "right",
    render: (_, customer) => (
      <div
        className="flex items-center justify-end gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          size="sm"
          variant="ghost"
          href={`/admin/crm/onboarding/${customer.id}`}
          leftIcon={<Eye size={14} />}
        >
          View
        </Button>

        {customer.status?.toLowerCase() === "acknowledged" && (
          <Button
            size="sm"
            variant="outline"
            href={`/admin/crm/onboarding/${customer.id}/edit`}
            leftIcon={icons.edit}
          >
            Edit
          </Button>
        )}
      </div>
    ),
  },
];

export default function CustomerOnboardingPage() {
  const { data: customers = [], isLoading, isError } = useCustomerOnboarding();

  return (
    <AppLayout pageTitle="Customer Onboarding">
      <PageHeader
        title="Customer Onboarding"
        description="Register and manage customer onboarding requests."
        action={
          <Button
            href="/admin/crm/onboarding/new"
            leftIcon={<Plus size={15} />}
            size="sm"
          >
            New Customer
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : isError ? (
        <div className="py-20 text-center text-brand-text-secondary">
          Failed to load customer onboarding requests.
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="Create your first customer to begin managing customer relationships."
          action={<Button href="/admin/crm/customers/new">New Customer</Button>}
        />
      ) : (
        <DataTable<CustomerOnboarding>
          columns={TABLE_COLUMNS}
          data={customers}
          emptyMessage="No onboarding requests found."
          searchPlaceholder="Search customer..."
        />
      )}
    </AppLayout>
  );
}

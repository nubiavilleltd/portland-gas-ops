"use client";

import { Plus } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";

import { useCustomers } from "@/lib/modules/customers/hooks/useCustomers";
import type { Customer } from "@/lib/modules/customers/types/customer.types";
import { CUSTOMER_ROUTES } from "@/lib/modules/customers/constants/routes";

const columns: Column<Customer>[] = [
  { key: "name", label: "Customer Name" },
  {
    key: "type",
    label: "Type",
    render: (value) => (
      <span
        className={
          value === "corporate"
            ? "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
            : "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
        }
      >
        {value === "corporate" ? "Corporate" : "Individual"}
      </span>
    ),
  },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "address", label: "Address" },
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <span className={
        value === "active"
          ? "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"
          : "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500"
      }>
        {value === "active" ? "Active" : "Inactive"}
      </span>
    ),
  },
];

export default function CustomersPage() {
  const { customers, isLoading, error } = useCustomers();

  return (
    <AppLayout pageTitle="Customers">
      <PageHeader
        title="Customers"
        description="Manage customer records and contact details"
        action={
          <Button href={CUSTOMER_ROUTES.new()} leftIcon={<Plus size={16} />}>
            New Customer
          </Button>
        }
        className="mb-6"
      />

      <DataTable<Customer>
        columns={columns}
        data={customers}
        isLoading={isLoading}
        rowHref={(row) => CUSTOMER_ROUTES.detail(row.id)}
        emptyMessage="No customers found."
        emptyDescription="Add your first customer to get started."
      />
    </AppLayout>
  );
}
"use client";

import { Plus, Eye } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import Link from "next/link";
import { useCustomerContacts, type CustomerContact } from "@/lib/modules/crm";

const COLUMNS: Column<CustomerContact>[] = [
  {
    key: "customer_name",
    label: "Customer",
  },

  {
    key: "primary_contact",
    label: "Primary Contact",
    render: (_, record) => (
      <div>
        <p className="font-medium">
          {record.primary_contact.first_name} {record.primary_contact.last_name}
        </p>

        <p className="text-xs text-brand-text-secondary">
          {record.primary_contact.department}
        </p>
      </div>
    ),
  },

  {
    key: "contacts",
    label: "Contacts",
    render: (_, record) => (
      <span className="text-sm">{record.additional_contacts.length + 1}</span>
    ),
  },

  {
    key: "phone",
    label: "Phone",
    render: (_, record) => record.primary_contact.phone,
  },

  {
    key: "email",
    label: "Email",
    render: (_, record) => record.primary_contact.email,
  },

  {
    key: "status",
    label: "Status",
    render: (_, record) => <ApprovalBadge status={record.status} />,
  },

  {
    key: "actions",
    label: "",
    sortable: false,
    searchable: false,
    render: (_, record) => (
      <Link
        href={`/crm/contacts/${record.id}`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-purple transition-colors hover:bg-brand-purple-faint"
        title="View Contact"
      >
        <Eye size={18} />
      </Link>
    ),
  },
];

export default function ContactsPage() {
  const { data: contacts = [], isLoading, isError } = useCustomerContacts();

  return (
    <AppLayout pageTitle="Contacts">
      <PageHeader
        title="Contacts"
        description="Manage customer contacts."
        action={
          <Button
            href="/crm/contacts/new"
            size="sm"
            leftIcon={<Plus size={15} />}
          >
            New Contact
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : isError ? (
        <div className="py-20 text-center text-brand-text-secondary">
          Failed to load contacts.
        </div>
      ) : contacts.length === 0 ? (
        <EmptyState
          title="No contacts found"
          description="Add contacts for approved customers."
        />
      ) : (
        <DataTable<CustomerContact>
          columns={COLUMNS}
          data={contacts}
          rowHref={(record) => `/crm/contacts/${record.id}`}
          searchPlaceholder="Search customer or primary contact..."
          emptyMessage="No contacts found."
        />
      )}
    </AppLayout>
  );
}

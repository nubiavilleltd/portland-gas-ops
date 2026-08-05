"use client";

import { Plus, Eye } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import Link from "next/link";
import { useCustomerContacts, type CustomerContact } from "@/lib/modules/crm";

type GroupedCustomerContact = {
  id: string;
  customer_id: string;
  customer_name: string;
  status: string;
  primary_contact: CustomerContact | null;
  additional_contacts: CustomerContact[];
};

const COLUMNS: Column<GroupedCustomerContact>[] = [
  {
    key: "customer_name",
    label: "Customer",
  },

  {
    key: "first_name",
    label: "Primary Contact",

    getSearchValue: (row) =>
      `${row.primary_contact?.first_name ?? ""} ${row.primary_contact?.last_name ?? ""}`,

    render: (_, record) => (
      <div>
        <p className="font-medium">
          {record.primary_contact?.first_name}{" "}
          {record.primary_contact?.last_name}
        </p>

        <p className="text-xs text-brand-text-secondary">
          {record.primary_contact?.department}
        </p>
      </div>
    ),
  },

  {
    key: "contacts",
    label: "Contacts",
    render: (_, record) => (
      <span className="text-sm">
        {(record.primary_contact ? 1 : 0) + record.additional_contacts.length}
      </span>
    ),
  },

  {
    key: "phone",
    label: "Phone",
    render: (_, record) => record?.primary_contact?.phone,
  },

  {
    key: "email",
    label: "Email",
    render: (_, record) => record?.primary_contact?.email,
  },

  {
    key: "actions",
    label: "",
    sortable: false,
    searchable: false,
    render: (_, record) => (
      <Link
        href={`/crm/contacts/${record.customer_id}`}
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
  console.log(contacts, "contacts");
  function groupContacts(
    contacts: CustomerContact[],
  ): GroupedCustomerContact[] {
    const grouped: Record<string, GroupedCustomerContact> = {};

    for (const contact of contacts) {
      if (!grouped[contact.customer_id]) {
        grouped[contact.customer_id] = {
          id: contact.id,
          customer_id: contact.customer_id,
          customer_name: contact?.customer_name,
          status: contact.status,
          primary_contact: null,
          additional_contacts: [],
        };
      }
      if (contact.is_primary) {
        grouped[contact.customer_id].primary_contact = contact;
      } else {
        grouped[contact.customer_id].additional_contacts.push(contact);
      }
    }

    return Object.values(grouped);
  }

  const groupedContacts = groupContacts(contacts);

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

      <DataTable<GroupedCustomerContact>
        columns={COLUMNS}
        data={groupedContacts}
        rowHref={(record) => `/crm/contacts/${record.customer_id}`}
        searchPlaceholder="Search customer or primary contact..."
        emptyMessage="No contacts found."
        isLoading={isLoading}
      />
    </AppLayout>
  );
}

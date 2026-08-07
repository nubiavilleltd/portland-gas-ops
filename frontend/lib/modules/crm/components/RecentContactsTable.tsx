"use client";

import Button from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { Eye } from "lucide-react";
import Link from "next/link";

import type { CustomerContact } from "@/lib/modules/crm";

const COLUMNS: Column<CustomerContact>[] = [
  {
    key: "primary_contact",
    label: "Primary Contact",
    render: (_, contact) => (
      <div>
        <p className="font-medium">
          {contact.first_name} {contact.last_name}
        </p>

        <p className="text-xs text-brand-text-secondary">
          {contact.department}
        </p>
      </div>
    ),
  },

  {
    key: "customer_name",
    label: "Customer",
  },

  {
    key: "department",
    label: "Department",
    render: (_, contact) => <p className="">{contact.department}</p>,
  },

  {
    key: "role",
    label: "Role",
    render: (_, contact) => <p className="">{contact.role}</p>,
  },

  // {
  //   key: "status",
  //   label: "Status",
  //   render: (_, contact) => <ApprovalBadge status={contact.status} />,
  // },

  {
    key: "actions",
    label: "",
    sortable: false,
    searchable: false,
    render: (_, contact) => (
      <Link
        href={`/crm/contacts/${contact.customer_id}`}
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
  contacts: CustomerContact[];
};

export default function RecentContactsTable({ contacts }: Props) {
  return (
    <div className="rounded-lg border border-brand-border bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">Recent Contacts</h2>

          <p className="text-sm text-brand-text-secondary">
            Customer contacts recently added to the CRM.
          </p>
        </div>

        <Button size="sm" href="/crm/contacts">
          View All
        </Button>
      </div>
      <div className="px-6 py-4">
        <DataTable<CustomerContact>
          columns={COLUMNS}
          data={contacts}
          rowHref={(contact) => `/crm/contacts/${contact.id}`}
          searchPlaceholder="Search contacts..."
          emptyMessage="No contacts found."
        />
      </div>
    </div>
  );
}

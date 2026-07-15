"use client";

import Button from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { Eye } from "lucide-react";

import type { CustomerContact } from "@/lib/modules/crm";

const COLUMNS: Column<CustomerContact>[] = [
  {
    key: "primary_contact",
    label: "Primary Contact",
    render: (_, contact) => (
      <div>
        <p className="font-medium">
          {contact.primary_contact.first_name}{" "}
          {contact.primary_contact.last_name}
        </p>

        <p className="text-xs text-brand-text-secondary">
          {contact.primary_contact.department}
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
  },

  {
    key: "status",
    label: "Status",
    render: (_, contact) => <ApprovalBadge status={contact.status} />,
  },

  {
    key: "actions",
    label: "",
    render: (_, contact) => (
      <Button
        size="sm"
        variant="outline"
        href={`/admin/crm/contacts/${contact.id}`}
        leftIcon={<Eye size={14} />}
      >
        View
      </Button>
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

        <Button size="sm" href="/admin/crm/contacts">
          View All
        </Button>
      </div>
      <div className="px-6 py-4">
        <DataTable<CustomerContact>
          columns={COLUMNS}
          data={contacts}
          rowHref={(contact) => `/admin/crm/contacts/${contact.id}`}
          searchPlaceholder="Search contacts..."
          emptyMessage="No contacts found."
        />
      </div>
    </div>
  );
}

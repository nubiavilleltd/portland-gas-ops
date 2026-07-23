"use client";

import Button from "@/components/ui/Button";
import DataTable, { Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import Link from "next/link";
import { Eye } from "lucide-react";

import { CustomerVisit } from "../types";

type Props = {
  visits: CustomerVisit[];
};

export default function VisitsTable({ visits }: Props) {
  const columns: Column<CustomerVisit>[] = [
    {
      label: "Visit No.",
      key: "visit_number",
    },
    {
      label: "Customer",
      key: "customer_name",
    },
    {
      label: "Contact Person",
      key: "contact_person",
    },
    {
      label: "Visit Type",
      key: "visit_type",
    },
    {
      label: "Visit Date",
      key: "visit_date",
    },

    {
      key: "status",
      label: "Status",
      render: (_, visit) => (
        <ApprovalBadge
          status={visit.status?.toLowerCase() ?? visit.status?.toLowerCase()}
        />
      ),
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      searchable: false,
      render: (_, visit) => (
        <Link
          href={`/crm/visits/${visit.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-purple transition-colors hover:bg-brand-purple-faint"
          title="View Customer"
        >
          <Eye size={18} />
        </Link>
      ),
    },
  ];

  return (
    <DataTable
      data={visits}
      columns={columns}
      searchable
      searchPlaceholder="Search visits..."
    />
  );
}

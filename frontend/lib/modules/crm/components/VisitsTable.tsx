"use client";

import DataTable, { Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import Link from "next/link";
import { Eye } from "lucide-react";
import { formatDateTime } from "../utils";
import { CustomerVisit } from "../types";

type Props = {
  visits: CustomerVisit[];
  isLoading: boolean | undefined;
};

export default function VisitsTable({ visits, isLoading }: Props) {
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
      label: "Visit Type",
      key: "visit_type",
    },
    {
      label: "Visit By",
      key: "created_by",
      render: (_, visit) => visit.created_by || "-",
    },
    {
      label: "Visit Date",
      key: "visit_date",
      render: (_, visit) => `${formatDateTime(visit.visit_date)}`,
    },
    {
      label: "Contact Person",
      key: "contact_person",
      searchable: false,
      render: (_, visit) => visit.contact_person,
    },
    {
      key: "status",
      label: "Status",
      render: (_, visit) => (
        <ApprovalBadge status={visit.status.toLowerCase()} />
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
          title="View Visit"
        >
          <Eye size={18} />
        </Link>
      ),
    },
  ];

  return (
    <DataTable
      data={visits}
      isLoading={isLoading}
      rowHref={(record) => `/crm/visits/${record.id}`}
      emptyMessage="No visits found."
      columns={columns}
      searchable
      searchPlaceholder="Search visits..."
    />
  );
}

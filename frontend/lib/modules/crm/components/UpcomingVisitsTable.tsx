"use client";

import Link from "next/link";
import { Eye } from "lucide-react";

import DataTable, { Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import Button from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";
import { CustomerVisit } from "../types";

type Props = {
  visits: CustomerVisit[];
};

export default function UpcomingVisitsTable({ visits }: Props) {
  const columns: Column<CustomerVisit>[] = [
    {
      key: "visit_number",
      label: "Visit No.",
    },
    {
      key: "customer_name",
      label: "Customer",
      render: (value) => (
        <span className="capitalize">{String(value ?? "")}</span>
      ),
    },
    {
      key: "visit_type",
      label: "Visit Type",
      render: (value) => (
        <span className="capitalize">{String(value ?? "")}</span>
      ),
    },
    {
      key: "visit_date",
      label: "Visit Date",
      render: (date) => formatDateTime(date as string),
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
    <div className="rounded-lg border border-brand-border bg-white">
      <div className="flex items-center justify-between  px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">Scheduled Visits</h2>

          <p className="text-sm text-brand-text-secondary">
            Recently scheduled visits.
          </p>
        </div>

        <Button size="sm" href="/crm/visits">
          View All
        </Button>
      </div>

      <div className="px-6 py-4">
        <DataTable
          columns={columns}
          data={visits}
          rowHref={(visit) => `/crm/visits/${visit.id}`}
          emptyMessage="No upcoming visits."
          searchPlaceholder="Search visits..."
        />
      </div>
    </div>
  );
}

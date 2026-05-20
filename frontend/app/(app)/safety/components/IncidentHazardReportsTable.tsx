"use client";

import DataTable, { type Column } from "@/components/ui/DataTable";
import { mockIncidentHazardReports } from "@/lib/mock/incident-hazard";
import type { IncidentHazardReport, IncidentHazardStatus } from "@/types/safety";

const columns: Column<IncidentHazardReport>[] = [
  { key: "id", label: "Reference" },
  {
    key: "reportType",
    label: "Report Type",
    render: (value) => String(value || "-"),
  },
  {
    key: "location",
    label: "Location",
    render: (value) => String(value || "-"),
  },
  {
    key: "reporter",
    label: "Reporter",
    render: (_, row) => row.reporter.name,
  },
  {
    key: "priority",
    label: "Priority",
    render: (value) => String(value || "-"),
  },
  {
    key: "severityEstimate",
    label: "Severity",
    render: (value) => String(value || "-"),
  },
  {
    key: "status",
    label: "Status",
    render: (value) => <IncidentHazardStatusBadge status={value as IncidentHazardStatus} />,
  },
  {
    key: "dateTimeObserved",
    label: "Date Reported",
    render: (value, row) => String(value || row.reporter.reportDate),
  },
];

// Draft rows are hidden for now. Keep the mock draft records intact so draft
// workflows can return later without rebuilding the data.
const visibleIncidentHazardReports = mockIncidentHazardReports.filter(
  (report) => report.status !== "draft"
);

export default function IncidentHazardReportsTable() {
  return (
    <DataTable
      columns={columns}
      data={visibleIncidentHazardReports}
      rowHref={(report) => `/safety/incidents/${report.id}`}
      emptyMessage="No incident or hazard reports found."
    />
  );
}

function IncidentHazardStatusBadge({ status }: { status: IncidentHazardStatus }) {
  const labelByStatus: Record<IncidentHazardStatus, string> = {
    draft: "Draft",
    submitted: "Submitted",
    approved: "Resolved",
  };

  const classByStatus: Record<IncidentHazardStatus, string> = {
    draft: "bg-gray-100 text-gray-600",
    submitted: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${classByStatus[status]}`}>
      {labelByStatus[status]}
    </span>
  );
}

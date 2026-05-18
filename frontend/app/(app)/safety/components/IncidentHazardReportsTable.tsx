"use client";

import ApprovalBadge from "@/components/ui/ApprovalBadge";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { mockIncidentHazardReports } from "@/lib/mock/incident-hazard";
import type { IncidentHazardReport } from "@/types/safety";

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
    render: (value) => <ApprovalBadge status={String(value)} />,
  },
  {
    key: "dateTimeObserved",
    label: "Date Reported",
    render: (value, row) => String(value || row.reporter.reportDate),
  },
];

export default function IncidentHazardReportsTable() {
  return (
    <DataTable
      columns={columns}
      data={mockIncidentHazardReports}
      rowHref={(report) => `/safety/incident-hazard/${report.id}`}
      emptyMessage="No incident or hazard reports found."
    />
  );
}

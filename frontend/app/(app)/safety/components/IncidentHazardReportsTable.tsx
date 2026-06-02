"use client";

import DataTable, { type Column } from "@/components/ui/DataTable";
import { isSafetyCurrentUser } from "@/lib/safety-demo-identity";
import { getAdminIncidentHref, sortByLatestSafetyActivity } from "@/lib/safety-demo-routing";
import { useSafetyDemoData } from "@/lib/safety-demo-store";
import type { IncidentHazardReport, IncidentHazardStatus } from "@/types/safety";

const incidentHazardStatusLabels: Record<IncidentHazardStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  recommended: "Recommended",
  resolved: "Resolved",
  closed: "Closed",
  not_resolved: "Not Resolved",
};

const columns: Column<IncidentHazardReport>[] = [
  { key: "id", label: "Reference" },
  {
    key: "title",
    label: "Title",
    render: (value) => String(value || "-"),
  },
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
    key: "severityEstimate",
    label: "Severity",
    render: (value) => String(value || "-"),
  },
  {
    key: "status",
    label: "Status",
    getSearchValue: (row) => incidentHazardStatusLabels[row.status],
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
export default function IncidentHazardReportsTable({
  scope = "user",
}: {
  scope?: "user" | "admin";
}) {
  const { incidentHazards } = useSafetyDemoData();
  const reports = sortByLatestSafetyActivity(
    incidentHazards.filter(
      (report) =>
        report.status !== "draft" &&
        (scope === "admin" || isSafetyCurrentUser(report.reporter.name)),
    ),
    (report) => report.dateTimeObserved || report.reporter.reportDate,
  );

  return (
    <DataTable
      columns={columns}
      data={reports}
      rowHref={(report) =>
        scope === "admin" ? getAdminIncidentHref(report) : `/safety/incidents/${report.id}`
      }
      emptyMessage="No incident or hazard reports found."
    />
  );
}

function IncidentHazardStatusBadge({ status }: { status: IncidentHazardStatus }) {
  const classByStatus: Record<IncidentHazardStatus, string> = {
    draft: "bg-gray-100 text-gray-600",
    submitted: "bg-amber-100 text-amber-700",
    recommended: "bg-blue-100 text-blue-700",
    resolved: "bg-green-100 text-green-700",
    closed: "bg-slate-100 text-slate-700",
    not_resolved: "bg-red-100 text-red-700",
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${classByStatus[status]}`}>
      {incidentHazardStatusLabels[status]}
    </span>
  );
}

"use client";

import DataTable, { type Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { getIncidentHazardNextActor } from "@/lib/safety-next-actor";
import { getAdminIncidentHref, sortByLatestSafetyActivity } from "@/lib/safety-demo-routing";
import { useIncidentReports } from "@/lib/modules/safety/incidentReport";
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
  {
    key: "reference",
    label: "Reference",
    render: (value, row) => String(value || row.id),
  },
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
    render: (value) => <ApprovalBadge status={value as IncidentHazardStatus} />,
  },
  {
    key: "nextAction",
    label: "Next Actor",
    getSearchValue: (row) => getIncidentHazardNextActor(row),
    render: (_, row) => getIncidentHazardNextActor(row),
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
  const reportsQuery = useIncidentReports();
  const reports = sortByLatestSafetyActivity(
    (reportsQuery.data ?? []).filter((report) => report.status !== "draft"),
    (report) => report.dateTimeObserved || report.reporter.reportDate,
  );

  return (
    <DataTable
      columns={columns}
      data={reports}
      isLoading={reportsQuery.isLoading}
      rowHref={(report) =>
        scope === "admin" ? getAdminIncidentHref(report) : `/safety/incidents/${report.id}`
      }
      emptyMessage={
        reportsQuery.isError
          ? "Incident or hazard reports could not be loaded."
          : "No incident or hazard reports found."
      }
    />
  );
}

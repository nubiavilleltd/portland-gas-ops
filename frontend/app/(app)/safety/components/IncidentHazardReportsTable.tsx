"use client";

import DataTable, { type Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { getIncidentHazardNextActor } from "@/lib/safety-next-actor";
import { getAdminIncidentHref, sortByLatestSafetyActivity } from "@/lib/safety-demo-routing";
import { useIncidentReports } from "@/lib/modules/safety/incidentReport";
import { useSafetyCurrentEmployee } from "@/lib/modules/safety/people";
import { useMyApprovals } from "@/lib/modules/workflow/queries";
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
    render: (value) => String(value || "Reference pending"),
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
    key: "reportedAtRaw",
    label: "Date Reported",
    getSearchValue: (row) => row.reporter.reportDate,
    getSortValue: (row) => row.reportedAtRaw ?? row.reporter.reportDate,
    className: "whitespace-nowrap",
    render: (_, row) => row.reporter.reportDate || "-",
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
  const currentEmployee = useSafetyCurrentEmployee();
  const myApprovals = useMyApprovals();
  const currentEmployeeId = currentEmployee.data?.id;
  const isHseEmployee = isHseDepartment(currentEmployee.data?.department);
  const approvalRequestIds = new Set(
    (myApprovals.data ?? [])
      .filter((approval) => approval.request_type === "incident_hazard")
      .map((approval) => approval.request_id),
  );
  const canSeeReport = (report: IncidentHazardReport) =>
    scope === "admin" ||
    isHseEmployee ||
    approvalRequestIds.has(report.id) ||
    Boolean(
      currentEmployeeId &&
        (report.reporterId === currentEmployeeId ||
          report.hseReview?.actionOwnerId === currentEmployeeId),
    );
  const reports = sortByLatestSafetyActivity(
    (reportsQuery.data ?? []).filter(
      (report) => report.status !== "draft" && canSeeReport(report),
    ),
    (report) => report.reportedAtRaw ?? report.reporter.reportDate,
  );

  return (
    <DataTable
      columns={columns}
      data={reports}
      isLoading={
        reportsQuery.isLoading || currentEmployee.isLoading || myApprovals.isLoading
      }
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

function isHseDepartment(department?: string | null) {
  const normalized = department?.trim().toLowerCase();
  return normalized === "hse" || normalized === "safety";
}

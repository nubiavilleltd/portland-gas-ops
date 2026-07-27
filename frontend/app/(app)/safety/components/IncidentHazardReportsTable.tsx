"use client";

import { useState } from "react";
import DataTable, { type Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { getSafetyDisplayStatus } from "@/lib/modules/safety/presentation";
import { getIncidentHazardNextActor } from "@/lib/safety-next-actor";
import { getAdminIncidentHref, sortByLatestSafetyActivity } from "@/lib/safety-demo-routing";
import { useIncidentReports } from "@/lib/modules/safety/incidentReport";
import { useSafetyCurrentEmployee } from "@/lib/modules/safety/people";
import type { IncidentHazardReport, IncidentHazardStatus } from "@/types/safety";
import SafetyRequestListFilters, {
  type SafetyRequestListFilter,
} from "./SafetyRequestListFilters";
import SafetyTruncatedTableText from "./SafetyTruncatedTableText";

const incidentHazardStatusLabels: Record<IncidentHazardStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  recommended: "Recommended",
  pending_hse_verification: "Pending HSE Verification",
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
    render: (value) => <SafetyTruncatedTableText value={String(value || "")} />,
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
    render: (value) => (
      <ApprovalBadge
        status={getSafetyDisplayStatus(value as IncidentHazardStatus)}
      />
    ),
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
  const [filter, setFilter] = useState<SafetyRequestListFilter>("all");
  const reportsQuery = useIncidentReports();
  const currentEmployee = useSafetyCurrentEmployee();
  const currentEmployeeId = currentEmployee.data?.id;
  const isHseEmployee = isHseDepartment(currentEmployee.data?.department);
  const isRaisedByCurrentEmployee = (report: IncidentHazardReport) =>
    Boolean(currentEmployeeId && report.reporterId === currentEmployeeId);
  const isAssignedToCurrentEmployee = (report: IncidentHazardReport) =>
    Boolean(currentEmployeeId && report.hseReview?.actionOwnerId === currentEmployeeId);
  const isAwaitingCurrentEmployeeApproval = (report: IncidentHazardReport) =>
    isHseEmployee &&
    (report.status === "submitted" ||
      report.status === "pending_hse_verification");
  const canSeeReport = (report: IncidentHazardReport) =>
    scope === "admin" ||
    isHseEmployee ||
    isRaisedByCurrentEmployee(report) ||
    isAssignedToCurrentEmployee(report);
  const visibleReports = (reportsQuery.data ?? []).filter(
    (report) => report.status !== "draft" && canSeeReport(report),
  );
  const reports = sortByLatestSafetyActivity(
    visibleReports.filter((report) => {
      if (filter === "raised") return isRaisedByCurrentEmployee(report);
      if (filter === "assigned") return isAssignedToCurrentEmployee(report);
      if (filter === "approval") return isAwaitingCurrentEmployeeApproval(report);
      return true;
    }),
    (report) => report.reportedAtRaw ?? report.reporter.reportDate,
  );

  return (
    <div className="space-y-3">
      {/* <SafetyRequestListFilters value={filter} onChange={setFilter} /> */}
      <DataTable
        columns={columns}
        data={reports}
        isLoading={reportsQuery.isLoading || currentEmployee.isLoading}
        rowHref={(report) =>
          scope === "admin" ? getAdminIncidentHref(report) : `/safety/incidents/${report.id}`
        }
        emptyMessage={
          reportsQuery.isError
            ? "Incident or hazard reports could not be loaded."
            : "No incident or hazard reports found."
        }
      />
    </div>
  );
}

function isHseDepartment(department?: string | null) {
  const normalized = department?.trim().toLowerCase();
  return normalized === "hse" || normalized === "safety";
}

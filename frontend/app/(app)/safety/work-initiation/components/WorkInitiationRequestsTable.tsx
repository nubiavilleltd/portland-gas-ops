"use client";

import { useState } from "react";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { getWorkInitiationNextActor } from "@/lib/safety-next-actor";
import {
  getAdminWorkInitiationHref,
  sortByLatestSafetyActivity,
} from "@/lib/safety-demo-routing";
import { useSafetyCurrentEmployee } from "@/lib/modules/safety/people";
import { useWorkInitiations } from "@/lib/modules/safety/workInitiation";
import { useMyApprovals } from "@/lib/modules/workflow/queries";
import type { WorkInitiationRequest } from "@/types/safety";
import SafetyRequestListFilters, {
  type SafetyRequestListFilter,
} from "../../components/SafetyRequestListFilters";
import SafetyTruncatedTableText from "../../components/SafetyTruncatedTableText";

const columns: Column<WorkInitiationRequest>[] = [
  {
    key: "reference",
    label: "Reference",
    render: (_, row) => row.reference ?? "Reference pending",
  },
  { key: "title", label: "Work Title" },
  { key: "requester", label: "Requester", render: (_, row) => row.requester.name },
  {
    key: "requestDate",
    label: "Request Date",
    className: "whitespace-nowrap",
    getSearchValue: (row) => row.requester.requestDate,
    getSortValue: (row) => row.requester.requestDate,
    render: (_, row) => row.requester.requestDate || "-",
  },
  {
    key: "workCategory",
    label: "Work Category",
    render: (_, row) =>
      row.workCategory === "Other" && row.otherWorkCategory
        ? `Other - ${row.otherWorkCategory}`
        : row.workCategory,
  },
  {
    key: "workType",
    label: "Work Type",
    render: (value) => (Array.isArray(value) ? value.join(", ") : String(value || "-")),
  },
  {
    key: "location",
    label: "Location",
    render: (value) => <SafetyTruncatedTableText value={String(value || "")} />,
  },
  {
    key: "status",
    label: "Status",
    render: (value) => <ApprovalBadge status={String(value)} />,
  },
  {
    key: "nextAction",
    label: "Next Actor",
    getSearchValue: (row) => getWorkInitiationNextActor(row),
    render: (_, row) => getWorkInitiationNextActor(row),
  },
];

export default function WorkInitiationRequestsTable({
  scope = "user",
}: {
  scope?: "user" | "admin";
}) {
  const [filter, setFilter] = useState<SafetyRequestListFilter>("all");
  const requestsQuery = useWorkInitiations();
  const currentEmployee = useSafetyCurrentEmployee();
  const myApprovals = useMyApprovals();
  const currentEmployeeId = currentEmployee.data?.id;
  const approvalRequestIds = new Set(
    (myApprovals.data ?? [])
      .filter((approval) => approval.request_type === "work_initiation")
      .map((approval) => approval.request_id),
  );
  const isRaisedByCurrentEmployee = (request: WorkInitiationRequest) =>
    Boolean(currentEmployeeId && request.requesterId === currentEmployeeId);
  const isAssignedToCurrentEmployee = (request: WorkInitiationRequest) =>
    Boolean(
      currentEmployeeId &&
        (request.assignment.assignedSupervisorId === currentEmployeeId ||
          request.assignment.assignedWorkerIds?.includes(currentEmployeeId)),
    );
  const isCurrentEmployeeApprover = (request: WorkInitiationRequest) =>
    approvalRequestIds.has(request.id);
  const requests = (requestsQuery.data ?? []).filter(
    (request) =>
      scope === "admin" ||
      isRaisedByCurrentEmployee(request) ||
      isAssignedToCurrentEmployee(request) ||
      isCurrentEmployeeApprover(request),
  );
  const scopedRequests = sortByLatestSafetyActivity(
    requests.filter((request) => {
      if (filter === "raised") return isRaisedByCurrentEmployee(request);
      if (filter === "assigned") return isAssignedToCurrentEmployee(request);
      if (filter === "approval") return isCurrentEmployeeApprover(request);
      return true;
    }),
    (request) => request.requester.requestDate,
  );

  return (
    <div className="space-y-3">
      {/* <SafetyRequestListFilters value={filter} onChange={setFilter} /> */}
      <DataTable
        columns={columns}
        data={scopedRequests}
        rowHref={(request) =>
          scope === "admin"
            ? getAdminWorkInitiationHref(request)
            : `/safety/work-initiation/${request.id}`
        }
        isLoading={
          requestsQuery.isLoading || currentEmployee.isLoading || myApprovals.isLoading
        }
        emptyMessage="No work initiation requests found."
      />
    </div>
  );
}

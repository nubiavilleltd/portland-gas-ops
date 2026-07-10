"use client";

import { useState } from "react";
import DataTable, { type Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { useSafetyCurrentEmployee } from "@/lib/modules/safety/people";
import { useMyApprovals } from "@/lib/modules/workflow/queries";
import { getWorkAuthorizationNextActor } from "@/lib/safety-next-actor";
import {
  getAdminWorkAuthorizationHref,
  sortByLatestSafetyActivity,
} from "@/lib/safety-demo-routing";
import { useWorkAuthorizations } from "@/lib/modules/safety/workAuthorization";
import type { WorkAuthorizationRequest } from "@/types/safety";
import SafetyRequestListFilters, {
  type SafetyRequestListFilter,
} from "./SafetyRequestListFilters";

const columns: Column<WorkAuthorizationRequest>[] = [
  {
    key: "reference",
    label: "Reference",
    render: (_, row) => row.reference || "Reference pending",
  },
  {
    key: "title",
    label: "Request",
    render: (_, row) => row.workInitiation.title,
  },
  {
    key: "requester",
    label: "Requester",
    render: (_, row) => row.requester.name,
  },
  {
    key: "requestDate",
    label: "Request Date",
    className: "whitespace-nowrap",
    getSearchValue: (row) => row.requester.requestDate,
    getSortValue: (row) => row.requestedAtRaw ?? row.requester.requestDate,
    render: (_, row) => row.requester.requestDate || "-",
  },
  {
    key: "department",
    label: "Department",
    render: (_, row) => row.requester.department,
  },
  {
    key: "location",
    label: "Location",
    render: (_, row) => row.workInitiation.location,
  },
  {
    key: "supervisor",
    label: "Supervisor",
    render: (_, row) => row.workInitiation.assignedSupervisor,
  },
  {
    key: "plannedStartDateTime",
    label: "Planned Start",
    className: "whitespace-nowrap",
    render: (_, row) => row.workInitiation.plannedStartDateTime,
  },
  {
    key: "status",
    label: "Status",
    render: (value) => <ApprovalBadge status={String(value)} />,
  },
  {
    key: "nextAction",
    label: "Next Actor",
    getSearchValue: (row) => getWorkAuthorizationNextActor(row),
    render: (_, row) => getWorkAuthorizationNextActor(row),
  },
];

export default function WorkAuthorizationRequestsTable({
  scope = "user",
}: {
  scope?: "user" | "admin";
}) {
  const [filter, setFilter] = useState<SafetyRequestListFilter>("all");
  const requestsQuery = useWorkAuthorizations();
  const currentEmployee = useSafetyCurrentEmployee();
  const myApprovals = useMyApprovals();
  const currentEmployeeId = currentEmployee.data?.id;
  const approvalRequestIds = new Set(
    (myApprovals.data ?? [])
      .filter((approval) => approval.request_type === "work_authorization")
      .map((approval) => approval.request_id),
  );
  const isRaisedByCurrentEmployee = (item: WorkAuthorizationRequest) =>
    Boolean(currentEmployeeId && item.requesterId === currentEmployeeId);
  const isAssignedToCurrentEmployee = (item: WorkAuthorizationRequest) =>
    Boolean(
      currentEmployeeId &&
        (item.workInitiation.assignedSupervisorId === currentEmployeeId ||
          item.workInitiation.assignedWorkerIds?.includes(currentEmployeeId)),
    );
  const isCurrentEmployeeApprover = (item: WorkAuthorizationRequest) =>
    approvalRequestIds.has(item.id);
  const visibleRequests = (requestsQuery.data ?? []).filter(
    (item) =>
      item.status !== "draft" &&
      (scope === "admin" ||
        isRaisedByCurrentEmployee(item) ||
        isAssignedToCurrentEmployee(item) ||
        isCurrentEmployeeApprover(item)),
  );
  const requests = sortByLatestSafetyActivity(
    visibleRequests.filter((item) => {
      if (filter === "raised") return isRaisedByCurrentEmployee(item);
      if (filter === "assigned") return isAssignedToCurrentEmployee(item);
      if (filter === "approval") return isCurrentEmployeeApprover(item);
      return true;
    }),
    (item) => item.requestedAtRaw ?? item.requester.requestDate,
  );

  return (
    <div className="space-y-3">
      <SafetyRequestListFilters value={filter} onChange={setFilter} />
      <DataTable
        columns={columns}
        data={requests}
        isLoading={
          requestsQuery.isLoading || currentEmployee.isLoading || myApprovals.isLoading
        }
        rowHref={(request) =>
          scope === "admin"
            ? getAdminWorkAuthorizationHref(request)
            : `/safety/work-authorization/${request.id}`
        }
        emptyMessage={
          requestsQuery.isError
            ? "Work authorization requests could not be loaded."
            : "No work authorization requests found."
        }
        getSearchValues={(request) => [
          request.reference,
          request.workInitiation.title,
          request.workInitiation.assignedSupervisor,
          request.workInitiation.location,
        ]}
      />
    </div>
  );
}

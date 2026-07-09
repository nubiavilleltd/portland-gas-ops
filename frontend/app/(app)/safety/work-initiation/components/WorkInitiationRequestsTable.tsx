"use client";

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

const columns: Column<WorkInitiationRequest>[] = [
  {
    key: "reference",
    label: "Reference",
    render: (_, row) => row.reference ?? "Reference pending",
  },
  { key: "title", label: "Work Title" },
  { key: "requester", label: "Requester", render: (_, row) => row.requester.name },
  { key: "workCategory", label: "Work Category" },
  {
    key: "workType",
    label: "Work Type",
    render: (value) => (Array.isArray(value) ? value.join(", ") : String(value || "-")),
  },
  { key: "location", label: "Location" },
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
  const requestsQuery = useWorkInitiations();
  const currentEmployee = useSafetyCurrentEmployee();
  const myApprovals = useMyApprovals();
  const currentEmployeeId = currentEmployee.data?.id;
  const approvalRequestIds = new Set(
    (myApprovals.data ?? [])
      .filter((approval) => approval.request_type === "work_initiation")
      .map((approval) => approval.request_id),
  );
  const isCurrentEmployeeRequest = (request: WorkInitiationRequest) =>
    Boolean(
      currentEmployeeId &&
        (request.requesterId === currentEmployeeId ||
          request.assignment.assignedWorkerIds?.includes(currentEmployeeId)),
    );
  const isCurrentEmployeeApprover = (request: WorkInitiationRequest) =>
    approvalRequestIds.has(request.id);
  const requests = (requestsQuery.data ?? []).filter(
    (request) =>
      scope === "admin" ||
      isCurrentEmployeeRequest(request) ||
      isCurrentEmployeeApprover(request),
  );
  const scopedRequests = sortByLatestSafetyActivity(
    requests,
    (request) => request.requester.requestDate,
  );

  return (
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
  );
}

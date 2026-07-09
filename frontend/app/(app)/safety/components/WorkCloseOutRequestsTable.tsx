"use client";

import DataTable, { type Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { useSafetyCurrentEmployee } from "@/lib/modules/safety/people";
import { useWorkCloseouts } from "@/lib/modules/safety/workCloseout";
import { useMyApprovals } from "@/lib/modules/workflow/queries";
import { getWorkCloseOutNextActor } from "@/lib/safety-next-actor";
import {
  getAdminWorkCloseOutHref,
  sortByLatestSafetyActivity,
} from "@/lib/safety-demo-routing";
import type { WorkCloseOutRequest } from "@/types/safety";

const columns: Column<WorkCloseOutRequest>[] = [
  {
    key: "reference",
    label: "Reference",
    render: (_, row) => row.reference ?? "Reference pending",
  },
  { key: "title", label: "Close-Out Request" },
  {
    key: "workAuthorization",
    label: "Work Authorization",
    render: (_, row) => row.workAuthorization.reference ?? "Reference pending",
  },
  {
    key: "requester",
    label: "Requester",
    render: (_, row) => row.requester.name,
  },
  {
    key: "location",
    label: "Location",
    render: (_, row) => row.workAuthorization.location,
  },
  {
    key: "supervisor",
    label: "Supervisor",
    render: (_, row) => row.workAuthorization.supervisor,
  },
  {
    key: "status",
    label: "Status",
    render: (value) => <ApprovalBadge status={String(value)} />,
  },
  {
    key: "nextAction",
    label: "Next Actor",
    getSearchValue: (row) => getWorkCloseOutNextActor(row),
    render: (_, row) => getWorkCloseOutNextActor(row),
  },
];

export default function WorkCloseOutRequestsTable({
  scope = "user",
}: {
  scope?: "user" | "admin";
}) {
  const closeOuts = useWorkCloseouts({ limit: 100 });
  const currentEmployee = useSafetyCurrentEmployee();
  const myApprovals = useMyApprovals();
  const currentEmployeeId = currentEmployee.data?.id;
  const approvalRequestIds = new Set(
    (myApprovals.data ?? [])
      .filter((approval) => approval.request_type === "work_closeout")
      .map((approval) => approval.request_id),
  );
  const isCurrentEmployeeRequester = (request: WorkCloseOutRequest) =>
    Boolean(currentEmployeeId && request.requesterId === currentEmployeeId);
  const isCurrentEmployeeApprover = (request: WorkCloseOutRequest) =>
    approvalRequestIds.has(request.id);
  const requests = sortByLatestSafetyActivity(
    (closeOuts.data ?? []).filter(
      (request) =>
        request.status !== "draft" &&
        (scope === "admin" ||
          isCurrentEmployeeRequester(request) ||
          isCurrentEmployeeApprover(request)),
    ),
    (request) => request.requester.requestDate,
  );

  return (
    <DataTable
      columns={columns}
      data={requests}
      isLoading={currentEmployee.isLoading || closeOuts.isLoading || myApprovals.isLoading}
      rowHref={(request) =>
        scope === "admin"
          ? getAdminWorkCloseOutHref(request)
          : `/safety/work-close-out/${request.id}`
      }
      emptyMessage="No work close-out requests found."
    />
  );
}

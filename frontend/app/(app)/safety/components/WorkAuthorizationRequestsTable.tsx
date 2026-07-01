"use client";

import DataTable, { type Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { isSafetyCurrentUser } from "@/lib/safety-demo-identity";
import { getWorkAuthorizationNextActor } from "@/lib/safety-next-actor";
import {
  getAdminWorkAuthorizationHref,
  sortByLatestSafetyActivity,
} from "@/lib/safety-demo-routing";
import { useWorkAuthorizations } from "@/lib/modules/safety/workAuthorization";
import type { WorkAuthorizationRequest } from "@/types/safety";

const columns: Column<WorkAuthorizationRequest>[] = [
  {
    key: "id",
    label: "Reference",
    render: (_, row) => row.reference || row.id,
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
  const requestsQuery = useWorkAuthorizations();
  const requests = sortByLatestSafetyActivity(
    (requestsQuery.data ?? []).filter(
      (item) =>
        item.status !== "draft" &&
        (scope === "admin" || isSafetyCurrentUser(item.requester.name)),
    ),
    (item) => item.requestedAtRaw ?? item.requester.requestDate,
  );

  return (
    <DataTable
      columns={columns}
      data={requests}
      isLoading={requestsQuery.isLoading}
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
  );
}

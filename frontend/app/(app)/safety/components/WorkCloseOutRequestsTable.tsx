"use client";

import DataTable, { type Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { mockWorkCloseOutRequests } from "@/lib/mock/work-close-out";
import type { WorkCloseOutRequest } from "@/types/safety";

const columns: Column<WorkCloseOutRequest>[] = [
  { key: "id", label: "Reference" },
  { key: "title", label: "Close-Out Request" },
  {
    key: "workAuthorization",
    label: "Work Authorization",
    render: (_, row) => row.workAuthorization.id,
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
];

export default function WorkCloseOutRequestsTable() {
  return (
    <DataTable
      columns={columns}
      data={mockWorkCloseOutRequests}
      rowHref={(request) => `/safety/work-close-out/${request.id}`}
      emptyMessage="No work close-out requests found."
    />
  );
}

"use client";

import ApprovalBadge from "@/components/ui/ApprovalBadge";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { mockWorkInitiationRequests } from "@/lib/mock/work-initiation";
import type { WorkInitiationRequest } from "@/types/safety";

const columns: Column<WorkInitiationRequest>[] = [
  { key: "id", label: "Reference" },
  { key: "title", label: "Work Title" },
  { key: "requester", label: "Requester", render: (_, row) => row.requester.name },
  { key: "workType", label: "Work Type" },
  { key: "priority", label: "Priority" },
  { key: "location", label: "Location" },
  {
    key: "status",
    label: "Status",
    render: (value) => <ApprovalBadge status={String(value)} />,
  },
];

export default function WorkInitiationRequestsTable() {
  return (
    <DataTable
      columns={columns}
      data={mockWorkInitiationRequests}
      rowHref={(request) => `/work-initiation/${request.id}`}
      emptyMessage="No work initiation requests found."
      searchFields={[{ key: "workType" }, { key: "location" }, { key: "priority" }]}
    />
  );
}

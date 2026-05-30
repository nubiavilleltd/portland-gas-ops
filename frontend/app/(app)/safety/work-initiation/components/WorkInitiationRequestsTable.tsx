"use client";

import ApprovalBadge from "@/components/ui/ApprovalBadge";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { useSafetyDemoData } from "@/lib/safety-demo-store";
import type { WorkInitiationRequest } from "@/types/safety";

const columns: Column<WorkInitiationRequest>[] = [
  { key: "id", label: "Reference" },
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
];

export default function WorkInitiationRequestsTable() {
  const { workInitiations: requests } = useSafetyDemoData();

  return (
    <DataTable
      columns={columns}
      data={requests}
      rowHref={(request) => `/safety/work-initiation/${request.id}`}
      emptyMessage="No work initiation requests found."
    />
  );
}

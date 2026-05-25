"use client";

import { useEffect, useState } from "react";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { fetchWorkAuthorizationRequests } from "@/lib/mock/work-authorization-api";
import type { WorkAuthorizationRequest } from "@/types/safety";

const columns: Column<WorkAuthorizationRequest>[] = [
  {
    key: "id",
    label: "Reference",
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
    key: "priority",
    label: "Priority",
    getSearchValue: (row) => row.requestDetails.priority,
    render: (_, row) => <PriorityPill priority={row.requestDetails.priority} />,
  },
  {
    key: "plannedStartDateTime",
    label: "Planned Start",
    render: (_, row) => row.workInitiation.plannedStartDateTime,
  },
  {
    key: "status",
    label: "Status",
    render: (value) => <WorkAuthorizationStatusBadge status={String(value)} />,
  },
];

export default function WorkAuthorizationRequestsTable() {
  const [requests, setRequests] = useState<WorkAuthorizationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetchWorkAuthorizationRequests()
      .then((items) => {
        if (mounted) {
          // Draft rows are hidden for now. Keep the mock draft records intact so
          // draft workflows can return later without rebuilding the data.
          setRequests(items.filter((item) => item.status !== "draft"));
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-16 animate-pulse rounded-2xl border border-brand-border bg-white"
          />
        ))}
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={requests}
      showActions={true}
      rowHref={(request) => `/safety/work-authorization/${request.id}`}
      emptyMessage="No work authorization requests found."
      getSearchValues={(request) => [
        request.workInitiation.title,
        request.workInitiation.assignedSupervisor,
        request.workInitiation.location,
      ]}
    />
  );
}

function WorkAuthorizationStatusBadge({ status }: { status: string }) {
  const labelByStatus: Record<string, string> = {
    approved: "Authorized",
    unauthorized: "Unauthorized",
    denied: "Denied",
    returned: "Returned",
    submitted: "Submitted",
    draft: "Draft",
  };

  return (
    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
      {labelByStatus[status] ?? status}
    </span>
  );
}

function PriorityPill({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    Low: "bg-gray-100 text-gray-600",
    Medium: "bg-blue-50 text-blue-700 border border-blue-200",
    High: "bg-amber-50 text-amber-700 border border-amber-200",
    Critical: "bg-red-50 text-red-700 border border-red-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[priority] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {priority}
    </span>
  );
}

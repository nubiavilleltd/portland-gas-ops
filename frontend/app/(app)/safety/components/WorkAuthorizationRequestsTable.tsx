"use client";

import { useEffect, useState } from "react";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { fetchWorkAuthorizationRequests } from "@/lib/mock/work-authorization-api";
import { formatDateTime } from "@/lib/utils";
import type { WorkAuthorizationRequest } from "@/types/safety";

const columns: Column<WorkAuthorizationRequest>[] = [
  {
    key: "reference",
    label: "Reference",
    render: (value) =>
      value ? (
        String(value)
      ) : (
        <span className="text-brand-text-secondary">Not generated</span>
      ),
  },
  { key: "title", label: "Request" },
  { key: "requester_name", label: "Requester" },
  { key: "department", label: "Department" },
  { key: "work_location", label: "Location" },
  { key: "supervisor", label: "Supervisor" },
  {
    key: "priority",
    label: "Priority",
    render: (value) => <PriorityPill priority={String(value)} />,
  },
  {
    key: "expected_start",
    label: "Expected Start",
    render: (value) => formatDateTime(String(value)),
  },
  {
    key: "status",
    label: "Status",
    render: (value) => <ApprovalBadge status={String(value)} />,
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
          setRequests(items);
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
      emptyMessage="No work authorization requests found."
    />
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

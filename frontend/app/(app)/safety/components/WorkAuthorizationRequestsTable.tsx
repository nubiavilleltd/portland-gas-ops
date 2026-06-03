"use client";

import { useEffect, useState } from "react";
import DataTable, { type Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { isSafetyCurrentUser } from "@/lib/safety-demo-identity";
import {
  getAdminWorkAuthorizationHref,
  sortByLatestSafetyActivity,
} from "@/lib/safety-demo-routing";
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
    key: "plannedStartDateTime",
    label: "Planned Start",
    render: (_, row) => row.workInitiation.plannedStartDateTime,
  },
  {
    key: "status",
    label: "Status",
    render: (value) => <ApprovalBadge status={String(value)} />,
  },
];

export default function WorkAuthorizationRequestsTable({
  scope = "user",
}: {
  scope?: "user" | "admin";
}) {
  const [requests, setRequests] = useState<WorkAuthorizationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetchWorkAuthorizationRequests()
      .then((items) => {
        if (mounted) {
          // Draft rows are hidden for now. Keep the mock draft records intact so
          // draft workflows can return later without rebuilding the data.
          setRequests(
            sortByLatestSafetyActivity(
              items.filter(
                (item) =>
                  item.status !== "draft" &&
                  (scope === "admin" || isSafetyCurrentUser(item.requester.name)),
              ),
              (item) => item.requester.requestDate,
            ),
          );
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
  }, [scope]);

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
      rowHref={(request) =>
        scope === "admin"
          ? getAdminWorkAuthorizationHref(request)
          : `/safety/work-authorization/${request.id}`
      }
      emptyMessage="No work authorization requests found."
      getSearchValues={(request) => [
        request.workInitiation.title,
        request.workInitiation.assignedSupervisor,
        request.workInitiation.location,
      ]}
    />
  );
}

"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { useMyApprovals } from "@/hooks/useApprovals";
import { capitalize, formatDateTime } from "@/lib/utils";
import type { ApprovalRequest } from "@/types";

const columns: Column<ApprovalRequest>[] = [
  { key: "reference_id", label: "Reference" },
  { key: "reference_label", label: "Request" },
  {
    key: "workflow_type",
    label: "Workflow",
    render: (value) => <span className="capitalize">{capitalize(String(value))}</span>,
  },
  {
    key: "current_step",
    label: "Progress",
    render: (_, row) => `Step ${row.current_step} of ${row.total_steps}`,
  },
  {
    key: "updated_at",
    label: "Last Updated",
    render: (value, row) => formatDateTime((value as string | null) ?? row.created_at),
  },
  { key: "status", label: "Status" },
];

export default function MyApprovalsPage() {
  const { data, isLoading } = useMyApprovals();

  return (
    <AppLayout pageTitle="My Approvals">
      <PageHeader
        title="My Approvals"
        description="Requests waiting for your review across the company."
        className="mb-6"
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-16 animate-pulse rounded-2xl border border-brand-border bg-white"
            />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <DataTable
          columns={columns}
          data={data.items}
          emptyMessage="No approval requests found."
        />
      ) : (
        <EmptyState
          title="No approvals waiting for you"
          description="When requests need your review, they will show up here."
        />
      )}
    </AppLayout>
  );
}

"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import DataTable, { type Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { useMyApprovals, type MyApproval } from "@/lib/modules/workflow/queries";
import ApprovalsSkeleton from "./ApprovalsSkeleton";
import {
  getWorkflowProcessConfig,
  normalizeWorkflowProcessType,
} from "@/lib/modules/workflow/processes";

// DataTable requires T extends { id: string } — map approval_request_id → id
type ApprovalRow = MyApproval & { id: string };
import { formatDateTime } from "@/lib/utils";

function requestHref(row: ApprovalRow): string {
  switch (normalizeWorkflowProcessType(row.request_type)) {
    case "procurement": return `/procurement/${row.request_id}`;
    case "asset":       return `/assets/requests/${row.request_id}`;
    case "leave_request": return `/hr-management/leave-requests/${row.request_id}`;
    case "cash_requisition": return `/finance/cash-requisitions/${row.request_id}`;
    case "invoice":     return `/finance/invoices/${row.request_id}`;
    case "work_initiation": return `/safety/work-initiation/${row.request_id}`;
    case "work_authorization": return `/safety/work-authorization/${row.request_id}`;
    case "work_closeout": return `/safety/work-close-out/${row.request_id}`;
    default:            return "#";
  }
}

const columns: Column<ApprovalRow>[] = [
  {
    key: "reference",
    label: "Reference",
    render: (v) => <span className="font-mono text-xs">{v ? String(v) : "—"}</span>,
  },
  {
    key: "title",
    label: "Request",
    render: (v) => (
      <span className="text-sm text-brand-text-primary">{v ? String(v) : "—"}</span>
    ),
  },
  {
    key: "request_type",
    label: "Process",
    render: (v) => {
      const cfg = getWorkflowProcessConfig(String(v));
      return (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${cfg.badge}`}>
          {cfg.label}
        </span>
      );
    },
  },
  {
    key: "requester_name",
    label: "Requester",
    render: (v) => (
      <span className="text-sm text-brand-text-primary">
        {v ? String(v) : "—"}
      </span>
    ),
  },
  {
    key: "department",
    label: "Department",
    render: (v) => (
      <span className="text-sm text-brand-text-secondary capitalize">
        {v ? String(v).replace(/_/g, " ") : "—"}
      </span>
    ),
  },
  {
    key: "submitted_at",
    label: "Submitted",
    getSortValue: (row) => new Date(row.submitted_at).getTime(),
    render: (v) => (
      <span className="text-xs text-brand-text-secondary">{formatDateTime(v as string)}</span>
    ),
  },
  {
    key: "action_needed",
    label: "Action Needed",
    render: (_, row) => (
      <ApprovalBadge status={row.current_step_number === 4 ? "awaiting_confirmation" : "pending_approval"} />
    ),
  },
];

export default function MyApprovalsPage() {
  const { data: rawApprovals = [], isLoading } = useMyApprovals();
  const approvals: ApprovalRow[] = rawApprovals
    .map((approval) => ({ ...approval, id: approval.approval_request_id }))
    .sort(
      (left, right) =>
        new Date(right.submitted_at).getTime() -
        new Date(left.submitted_at).getTime(),
    );

  return (
    <AppLayout pageTitle="My Approvals">
      <PageHeader
        title="My Approvals"
        description="Requests waiting for your review across the company."
        className="mb-6"
      />

      {isLoading ? (
        <ApprovalsSkeleton />
      ) : approvals.length > 0 ? (
        <DataTable
          columns={columns}
          data={approvals}
          rowHref={requestHref}
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

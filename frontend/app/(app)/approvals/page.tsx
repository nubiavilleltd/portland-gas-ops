"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import DataTable, { type Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { useMyApprovals, type MyApproval } from "@/lib/modules/workflow/queries";

// DataTable requires T extends { id: string } — map approval_request_id → id
type ApprovalRow = MyApproval & { id: string };
import { formatDateTime } from "@/lib/utils";

const PROCESS_CONFIG: Record<string, { label: string; badge: string }> = {
  procurement:      { label: "Procurement",    badge: "bg-purple-100 text-purple-700" },
  asset:            { label: "Asset Request",  badge: "bg-blue-100 text-blue-700" },
  leave:            { label: "Leave Request",  badge: "bg-green-100 text-green-700" },
  work_initiation:  { label: "Work Initiation", badge: "bg-orange-100 text-orange-700" },
  work_authorization: { label: "Work Authorization", badge: "bg-cyan-100 text-cyan-700" },
  work_closeout:    { label: "Work Closeout",   badge: "bg-teal-100 text-teal-700" },
};

function getProcessConfig(type: string) {
  return PROCESS_CONFIG[type] ?? { label: type, badge: "bg-gray-100 text-gray-700" };
}

function requestHref(row: ApprovalRow): string {
  switch (row.request_type) {
    case "procurement": return `/procurement/${row.request_id}`;
    case "asset":       return `/assets/requests/${row.request_id}`;
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
      const cfg = getProcessConfig(String(v));
      return (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${cfg.badge}`}>
          {cfg.label}
        </span>
      );
    },
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
    key: "current_step_number",
    label: "Step",
    render: (v) => <span className="text-sm text-brand-text-secondary">Step {String(v)}</span>,
  },
  {
    key: "submitted_at",
    label: "Submitted",
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
  const approvals: ApprovalRow[] = rawApprovals.map((a) => ({ ...a, id: a.approval_request_id }));

  return (
    <AppLayout pageTitle="My Approvals">
      <PageHeader
        title="My Approvals"
        description="Requests waiting for your review across the company."
        className="mb-6"
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl border border-brand-border bg-white" />
          ))}
        </div>
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

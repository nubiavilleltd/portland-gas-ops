"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import DataTable, { type Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import Badge from "@/components/ui/Badge";
import { useMyApprovals, useMyActedApprovals, type MyApproval, type MyActedApproval } from "@/lib/modules/workflow/queries";
import ApprovalsSkeleton from "./ApprovalsSkeleton";
import {
  getWorkflowProcessConfig,
  normalizeWorkflowProcessType,
} from "@/lib/modules/workflow/processes";

// DataTable requires T extends { id: string } — map approval_request_id → id
type ApprovalRow = MyApproval & { id: string };
type ActedRow = MyActedApproval & { id: string };
import { formatDateTime } from "@/lib/utils";

function requestHref(requestType: string, requestId: string): string {
  switch (normalizeWorkflowProcessType(requestType)) {
    case "procurement": return `/procurement/${requestId}`;
    case "asset":       return `/assets/requests/${requestId}`;
    case "leave_request": return `/hr-management/leave-requests/${requestId}`;
    case "cash_requisition": return `/finance/cash-requisitions/${requestId}`;
    case "invoice":     return `/finance/invoices/${requestId}`;
    case "work_initiation": return `/safety/work-initiation/${requestId}`;
    case "work_authorization": return `/safety/work-authorization/${requestId}`;
    case "work_closeout": return `/safety/work-close-out/${requestId}`;
    default:            return "#";
  }
}

const pendingColumns: Column<ApprovalRow>[] = [
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

const ACTION_BADGE: Record<string, { variant: "success" | "danger" | "warning"; label: string }> = {
  approved: { variant: "success", label: "Approved" },
  rejected: { variant: "danger",  label: "Rejected" },
  returned: { variant: "warning", label: "Returned" },
};

const actedColumns: Column<ActedRow>[] = [
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
    key: "my_action",
    label: "Your Action",
    render: (v) => {
      const action = ACTION_BADGE[String(v)] ?? { variant: "neutral" as const, label: String(v) };
      return <Badge variant={action.variant} label={action.label} />;
    },
  },
  {
    key: "acted_at",
    label: "Acted On",
    getSortValue: (row) => new Date(row.acted_at).getTime(),
    render: (v) => (
      <span className="text-xs text-brand-text-secondary">{formatDateTime(v as string)}</span>
    ),
  },
  {
    key: "current_status",
    label: "Current Status",
    render: (v) => {
      if (!v) return <span className="text-brand-text-secondary">—</span>;
      const status = String(v);
      const statusClass = status === "approved" ? "bg-green-50 text-green-700"
        : status === "rejected" ? "bg-red-50 text-red-700"
        : status === "pending" ? "bg-amber-50 text-amber-700"
        : "bg-gray-100 text-gray-600";
      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusClass}`}>
          {status.replace(/_/g, " ")}
        </span>
      );
    },
  },
];

type Tab = "pending" | "acted";

export default function MyApprovalsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("pending");

  const { data: rawApprovals = [], isLoading: pendingLoading } = useMyApprovals();
  const { data: rawActed = [], isLoading: actedLoading } = useMyActedApprovals();

  const approvals: ApprovalRow[] = rawApprovals
    .map((approval) => ({ ...approval, id: approval.approval_request_id }))
    .sort(
      (left, right) =>
        new Date(right.submitted_at).getTime() -
        new Date(left.submitted_at).getTime(),
    );

  const actedApprovals: ActedRow[] = rawActed
    .map((item) => ({ ...item, id: item.audit_id }));

  const isLoading = activeTab === "pending" ? pendingLoading : actedLoading;

  return (
    <AppLayout pageTitle="My Approvals">
      <PageHeader
        title="My Approvals"
        description="Requests waiting for your review and your approval history."
        className="mb-6"
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-brand-border">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "pending"
              ? "border-brand-purple text-brand-purple"
              : "border-transparent text-brand-text-secondary hover:text-brand-text-primary"
          }`}
        >
          Pending
          {approvals.length > 0 && (
            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
              activeTab === "pending" ? "bg-brand-purple/10 text-brand-purple" : "bg-gray-100 text-gray-600"
            }`}>
              {approvals.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("acted")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "acted"
              ? "border-brand-purple text-brand-purple"
              : "border-transparent text-brand-text-secondary hover:text-brand-text-primary"
          }`}
        >
          Acted On
        </button>
      </div>

      {isLoading ? (
        <ApprovalsSkeleton />
      ) : activeTab === "pending" ? (
        approvals.length > 0 ? (
          <DataTable
            columns={pendingColumns}
            data={approvals}
            rowHref={(row) => requestHref(row.request_type, row.request_id)}
            emptyMessage="No approval requests found."
          />
        ) : (
          <EmptyState
            title="No approvals waiting for you"
            description="When requests need your review, they will show up here."
          />
        )
      ) : (
        actedApprovals.length > 0 ? (
          <DataTable
            columns={actedColumns}
            data={actedApprovals}
            rowHref={(row) => requestHref(row.request_type, row.request_id)}
            emptyMessage="No acted approvals found."
          />
        ) : (
          <EmptyState
            title="No approval history"
            description="Requests you've approved, rejected, or returned will appear here."
          />
        )
      )}
    </AppLayout>
  );
}

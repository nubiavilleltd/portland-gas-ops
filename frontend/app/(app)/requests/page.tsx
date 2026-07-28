"use client";

import { useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import DataTable, { type Column } from "@/components/ui/DataTable";
import SelectInput from "@/components/forms/SelectInput";
import { useMyRequests, type MyRequest } from "@/lib/modules/workflow/queries";
import {
  getWorkflowProcessConfig,
  normalizeWorkflowProcessType,
} from "@/lib/modules/workflow/processes";
import { formatDate } from "@/lib/utils";

// ── Title fallback ─────────────────────────────────────────────────────────────

const REQUEST_TYPE_LABEL: Record<string, string> = {
  procurement:      "Purchase Request",
  asset:            "Asset Request",
  leave_request:    "Leave Request",
  cash_requisition: "Cash Requisition",
  invoice:          "Invoice Request",
  work_initiation:  "Work Initiation",
  work_authorization: "Work Authorization",
  work_closeout:    "Work Close-Out",
  safety:           "Safety Incident",
  incident_report:  "Safety Incident",
};

function resolveTitle(row: MyRequest): string {
  if (row.title && row.title !== "undefined" && row.title.trim()) {
    const title = row.title.trim();

    // Procurement titles arrive as "category — PR-REF". Flip to "PR-REF — Category".
    if (normalizeWorkflowProcessType(row.request_type) === "procurement") {
      const parts = title.split(" — ");
      if (parts.length === 2) {
        const [category, reference] = parts;
        const normalizedCategory = category.trim().replace(/_/g, " ");
        const label =
          normalizedCategory.charAt(0).toUpperCase() + normalizedCategory.slice(1);
        return `${reference.trim()} — ${label}`;
      }
    }

    return title;
  }

  return (
    REQUEST_TYPE_LABEL[normalizeWorkflowProcessType(row.request_type)] ?? "Request"
  );
}

// ── Table columns ──────────────────────────────────────────────────────────────

const COLUMNS: Column<MyRequest>[] = [
  {
    key: "reference",
    label: "Reference",
    render: (v) => (
      <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-brand-text-primary">
        {String(v)}
      </span>
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
    key: "title",
    label: "Title / Summary",
    render: (_, row) => {
      const title = resolveTitle(row);
      return (
        <span className="block truncate max-w-xs text-brand-text-primary" title={title}>
          {title}
        </span>
      );
    },
  },
  {
    key: "status",
    label: "Status",
    render: (v) => <ApprovalBadge status={String(v) === "in_progress" ? "pending" : String(v)} />,
  },
  {
    key: "next_approver_name",
    label: "Next Approver",
    render: (v, row) =>
      v ? (
        <div>
          <p className="text-sm text-brand-text-primary">{String(v)}</p>
          {row.next_approver_role ? (
            <p className="text-xs text-brand-text-secondary">
              {row.next_approver_role}
            </p>
          ) : null}
        </div>
      ) : (
        <span className="text-brand-text-secondary">—</span>
      ),
  },
  {
    key: "created_at",
    label: "Date Submitted",
    render: (v) => (
      <span className="text-xs text-brand-text-secondary whitespace-nowrap">
        {formatDate(String(v))}
      </span>
    ),
  },
];

// ── Request href resolver ──────────────────────────────────────────────────────

function resolveHref(row: MyRequest): string {
  const id = row.request_id;
  switch (normalizeWorkflowProcessType(row.request_type)) {
    case "procurement": return `/procurement/${id}`;
    case "asset":       return `/assets/requests/${id}`;
    case "leave_request": return `/hr-management/leave-requests/${id}`;
    case "cash_requisition": return `/finance/cash-requisitions/${id}`;
    case "invoice":     return `/finance/invoices/${id}`;
    case "work_initiation": return `/safety/work-initiation/${id}`;
    case "work_authorization": return `/safety/work-authorization/${id}`;
    case "work_closeout": return `/safety/work-close-out/${id}`;
    case "safety":
    case "incident_report": return `/safety/incidents/${id}`;
    default:            return "#";
  }
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MyRequestsPage() {
  const [activeProcess, setActiveProcess] = useState("");
  const [activeStatus,  setActiveStatus]  = useState("");

  const { data: requests = [] } = useMyRequests();

  const processOptions = useMemo(() => {
    const seen = new Set<string>();
    requests.forEach((request) =>
      seen.add(normalizeWorkflowProcessType(request.request_type)),
    );
    return Array.from(seen).map((type) => ({
      value: type,
      label: getWorkflowProcessConfig(type).label,
    }));
  }, [requests]);

  const filtered = useMemo(() => {
    let list = requests;
    if (activeProcess) {
      list = list.filter(
        (request) =>
          normalizeWorkflowProcessType(request.request_type) === activeProcess,
      );
    }
    if (activeStatus)  list = list.filter((r) => r.status.toLowerCase() === activeStatus);
    return list;
  }, [requests, activeProcess, activeStatus]);

  return (
    <AppLayout pageTitle="My Requests">
      <PageHeader
        title="My Requests"
        description="Track all your submissions across every workflow"
        className="mb-6"
      />

      {/* ── Table (filters live inside DataTable toolbar via toolbarActions) ── */}
      <DataTable
          columns={COLUMNS}
          data={filtered}
          rowHref={resolveHref}
          searchable
          showStatusFilter={false}
          emptyMessage="No requests yet"
          emptyDescription="Requests you submit will appear here"
          toolbarActions={
            <>
              <div className="w-48 shrink-0">
                <SelectInput
                  placeholder="All Processes"
                  sortOptions={false}
                  value={activeProcess}
                  onValueChange={setActiveProcess}
                  options={processOptions}
                />
              </div>
              <div className="w-40 shrink-0">
                <SelectInput
                  placeholder="All Statuses"
                  sortOptions={false}
                  value={activeStatus}
                  onValueChange={setActiveStatus}
                  options={[
                    { value: "pending",  label: "Pending" },
                    { value: "approved", label: "Approved" },
                    { value: "rejected", label: "Rejected" },
                    { value: "returned", label: "Returned" },
                  ]}
                />
              </div>
            </>
          }
        />
    </AppLayout>
  );
}

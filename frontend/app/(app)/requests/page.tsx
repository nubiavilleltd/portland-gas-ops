"use client";

import { useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import DataTable, { type Column } from "@/components/ui/DataTable";
import SelectInput from "@/components/forms/SelectInput";
import { useMyRequests, type MyRequest } from "@/lib/modules/workflow/queries";
import { formatDate } from "@/lib/utils";

// ── Process config ─────────────────────────────────────────────────────────────

const PROCESS_CONFIG: Record<string, { label: string; badge: string }> = {
  procurement:      { label: "Procurement",      badge: "bg-purple-100 text-purple-700" },
  asset:            { label: "Asset Request",    badge: "bg-blue-100 text-blue-700" },
  leave:            { label: "Leave",            badge: "bg-green-100 text-green-700" },
  cash_requisition: { label: "Cash Requisition", badge: "bg-yellow-100 text-yellow-700" },
  invoice:          { label: "Invoice",          badge: "bg-pink-100 text-pink-700" },
  work_initiation:  { label: "Work Initiation",  badge: "bg-orange-100 text-orange-700" },
  work_closeout:    { label: "Work Close-Out",   badge: "bg-teal-100 text-teal-700" },
  safety:           { label: "Safety Incident",  badge: "bg-red-100 text-red-700" },
};

function getProcessConfig(type: string) {
  return PROCESS_CONFIG[type] ?? { label: type, badge: "bg-gray-100 text-gray-700" };
}

// ── Title fallback ─────────────────────────────────────────────────────────────

const REQUEST_TYPE_LABEL: Record<string, string> = {
  procurement:      "Purchase Request",
  asset:            "Asset Request",
  leave:            "Leave Request",
  cash_requisition: "Cash Requisition",
  invoice:          "Invoice Request",
  work_initiation:  "Work Initiation",
  work_closeout:    "Work Close-Out",
  safety:           "Safety Incident",
};

function resolveTitle(row: MyRequest): string {
  if (row.title && row.title !== "undefined" && row.title.trim()) {
    // Procurement titles arrive as "category — PR-REF". Flip to "PR-REF — Category".
    if (row.request_type === "procurement") {
      const parts = row.title.split(" — ");
      if (parts.length === 2) {
        const [category, reference] = parts;
        const label = category.trim().charAt(0).toUpperCase() + category.trim().slice(1).replace(/_/g, " ");
        return `${reference.trim()} — ${label}`;
      }
    }
    return row.title;
  }
  return REQUEST_TYPE_LABEL[row.request_type] ?? "Request";
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
      const cfg = getProcessConfig(String(v));
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
    render: (v) => <ApprovalBadge status={String(v)} />,
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
  switch (row.request_type) {
    case "procurement":       return `/procurement/${id}`;
    case "asset":             return `/assets/requests/${id}`;
    case "work_initiation":   return `/safety/work-initiation/${id}`;
    case "work_authorization":return `/safety/work-authorization/${id}`;
    case "work_closeout":     return `/safety/work-close-out/${id}`;
    default:                  return "#";
  }
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MyRequestsPage() {
  const [activeProcess, setActiveProcess] = useState("");
  const [activeStatus,  setActiveStatus]  = useState("");

  const { data: requests = [] } = useMyRequests();

  const processOptions = useMemo(() => {
    const seen = new Set<string>();
    requests.forEach((r) => seen.add(r.request_type));
    return Array.from(seen).map((t) => ({ value: t, label: getProcessConfig(t).label }));
  }, [requests]);

  const filtered = useMemo(() => {
    let list = requests;
    if (activeProcess) list = list.filter((r) => r.request_type === activeProcess);
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

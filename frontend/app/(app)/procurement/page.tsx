"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Download } from "lucide-react";
import { procurementStore } from "@/lib/mockStore";
import { generatePO } from "@/lib/generatePO";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import SelectInput from "@/components/forms/SelectInput";
import { formatDate, capitalize } from "@/lib/utils";
import { useProcurementList } from "@/hooks/useProcurement";
import type { ProcurementListItem, ProcurementStatus } from "@/types";

const STATUS_OPTIONS = [
  { value: "pending_line_manager",  label: "Pending — Operations Manager" },
  { value: "pending_procurement",   label: "Pending — Procurement Officer" },
  { value: "awaiting_payment",      label: "Awaiting Payment" },
  { value: "awaiting_confirmation", label: "Awaiting Confirmation" },
  { value: "completed",             label: "Completed" },
  { value: "rejected",              label: "Rejected" },
  { value: "returned",              label: "Returned" },
];

const NEXT_APPROVER: Partial<Record<string, string>> = {
  pending_line_manager:  "Operations Manager",
  pending_procurement:   "Procurement Officer",
  awaiting_payment:      "Finance",
  awaiting_confirmation: "Procurement Officer",
};

function StatusCell({ status }: { status: string }) {
  if (status === "rejected")              return <ApprovalBadge status="rejected" />;
  if (status === "returned")              return <ApprovalBadge status="returned" />;
  if (status === "completed")             return <ApprovalBadge status="completed" />;
  if (status === "awaiting_payment")      return <ApprovalBadge status="awaiting_payment" />;
  if (status === "awaiting_confirmation") return <ApprovalBadge status="awaiting_confirmation" />;
  return <ApprovalBadge status="pending" />;
}

const columns: Column<ProcurementListItem>[] = [
  { key: "reference", label: "Reference", render: (v) => <span className="font-mono text-xs">{String(v)}</span> },
  {
    key: "category",
    label: "Category",
    render: (v) => <span className="capitalize">{String(v).replace(/_/g, " ")}</span>,
  },
  {
    key: "vendor",
    label: "Vendor",
    render: (v) => (v as ProcurementListItem["vendor"])?.name ?? <span className="text-brand-text-secondary">—</span>,
  },
  {
    key: "required_by",
    label: "Required By",
    render: (v) => formatDate(v as string | null),
  },
  {
    key: "status",
    label: "Status",
    render: (v) => <StatusCell status={String(v)} />,
  },
  {
    key: "payment_status",
    label: "Next Actor",
    render: (_, row) => {
      if (row.status === "returned") {
        return <span className="text-xs text-orange-600 font-medium">Requester to revise</span>;
      }
      const approver = NEXT_APPROVER[row.status];
      return approver
        ? <span className="text-sm text-brand-text-primary">{approver}</span>
        : <span className="text-brand-text-secondary">—</span>;
    },
  },
  {
    key: "po_url",
    label: "PO",
    render: (v, row) =>
      v ? (
        <PODownloadCell requestId={row.id} />
      ) : (
        <span className="text-brand-text-secondary text-xs">—</span>
      ),
  },
];

function PODownloadCell({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    setLoading(true);
    try {
      const req = procurementStore.getById(requestId);
      if (!req) throw new Error("Not found");
      await generatePO(req);
    } catch {
      alert("Could not generate the PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-1 text-xs text-brand-purple hover:underline disabled:opacity-50"
    >
      <Download size={12} />
      {loading ? "…" : "Download"}
    </button>
  );
}

export default function ProcurementPage() {
  const [activeStatus, setActiveStatus] = useState<ProcurementStatus | undefined>(undefined);
  const { data, isLoading, isError } = useProcurementList(activeStatus);

  return (
    <AppLayout pageTitle="Procurement">
      <PageHeader
        title="Purchase & Service Requests"
        description="Raise and manage purchase and service requisitions"
        action={
          <Link
            href="/procurement/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors w-fit"
          >
            <Plus size={16} /> New Request
          </Link>
        }
        className="mb-6"
      />

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        rowHref={(row) => `/procurement/${row.id}`}
        emptyMessage={isError ? "Could not load requests" : "No procurement requests"}
        emptyDescription={
          isError
            ? "Check your connection and try again."
            : activeStatus
              ? `No requests with status "${activeStatus}".`
              : "Raise your first request to get started."
        }
        toolbarActions={
          <div className="w-52 shrink-0">
            <SelectInput
              placeholder="All Statuses"
              sortOptions={false}
              value={activeStatus ?? ""}
              onValueChange={(v) => setActiveStatus((v || undefined) as ProcurementStatus | undefined)}
              options={STATUS_OPTIONS}
            />
          </div>
        }
      />
    </AppLayout>
  );
}

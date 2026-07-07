"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Download } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import SelectInput from "@/components/forms/SelectInput";
import { formatDate, formatCurrency, capitalize } from "@/lib/utils";
import { useProcurementList } from "@/lib/modules/procurement";
import type { ProcurementListItem, ProcurementStatus } from "@/types";

const STATUS_OPTIONS = [
  { value: "draft",     label: "Draft" },
  { value: "pending",   label: "Pending Approval" },
  { value: "approved",  label: "Approved" },
  { value: "awaiting_confirmation", label: "Awaiting Confirmation" },
  { value: "completed", label: "Completed" },
  { value: "rejected",  label: "Rejected" },
  { value: "returned",  label: "Returned" },
];

const columns: Column<ProcurementListItem>[] = [
  {
    key: "reference",
    label: "Reference",
    render: (v) => <span className="font-mono text-xs">{String(v)}</span>,
  },
  {
    key: "category",
    label: "Category",
    render: (v) => <span className="text-sm text-brand-text-primary capitalize">{v ? String(v).replace(/_/g, " ") : "—"}</span>,
  },
  {
    key: "vendor",
    label: "Vendor",
    render: (_, row) =>
      row.vendor?.name
        ? <span className="text-sm">{row.vendor.name}</span>
        : <span className="text-brand-text-secondary">—</span>,
  },
  {
    key: "estimated_amount",
    label: "Est. Amount",
    render: (v) =>
      v != null
        ? <span className="text-sm font-medium">{formatCurrency(Number(v))}</span>
        : <span className="text-brand-text-secondary">—</span>,
  },
  {
    key: "created_at",
    label: "Date",
    render: (v) => <span className="text-xs text-brand-text-secondary">{formatDate(v as string)}</span>,
  },
  {
    key: "status",
    label: "Status",
    render: (v) => <ApprovalBadge status={String(v)} />,
  },
  {
    key: "po_document_url",
    label: "PO",
    render: (_, row) =>
      row.po_document_url ? (
        <a
          href={row.po_document_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-purple-50 text-brand-purple hover:bg-purple-100 transition-colors"
          title="Download Purchase Order"
        >
          <Download size={14} />
        </a>
      ) : (
        <span className="text-brand-text-secondary">—</span>
      ),
  },
  {
    key: "next_actor_name",
    label: "Next Actor",
    render: (_, row) =>
      row.next_actor_name ? (
        <div>
          <p className="text-sm text-brand-text-primary">{row.next_actor_name}</p>
          {row.current_step_name && (
            <p className="text-xs text-brand-text-secondary">{row.current_step_name}</p>
          )}
        </div>
      ) : (
        <span className="text-brand-text-secondary">—</span>
      ),
  },
];

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
              ? `No requests with status "${capitalize(activeStatus)}".`
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import SelectInput from "@/components/forms/SelectInput";
import { useAssetRequests } from "@/hooks/useAssets";
import { formatDate, capitalize } from "@/lib/utils";
import type { AssetRequestListItem, AssetRequestStatus } from "@/types";

const STATUS_OPTIONS = [
  { value: "pending",   label: "Pending" },
  { value: "approved",  label: "Approved" },
  { value: "allocated", label: "Allocated" },
  { value: "rejected",  label: "Rejected" },
  { value: "returned",  label: "Returned" },
];

// ── Type badge ─────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    loan: "bg-blue-50 text-blue-700 border border-blue-200",
    requisition: "bg-purple-50 text-purple-700 border border-purple-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[type] ?? "bg-gray-100 text-gray-600"}`}>
      {capitalize(type)}
    </span>
  );
}

// ── Columns ────────────────────────────────────────────────────────────────────

const columns: Column<AssetRequestListItem>[] = [
  {
    key: "reference",
    label: "Reference",
    render: (v) => <span className="font-mono text-xs">{String(v)}</span>,
  },
  {
    key: "request_type",
    label: "Type",
    render: (v) => <TypeBadge type={String(v)} />,
  },
  {
    key: "purpose",
    label: "Purpose",
    render: (v) => (
      <span className="block max-w-[200px] truncate text-brand-text-primary" title={String(v)}>
        {String(v)}
      </span>
    ),
  },
  {
    key: "item_count",
    label: "Items",
    render: (v) => (
      <span className="text-brand-text-secondary">{String(v)} item{Number(v) !== 1 ? "s" : ""}</span>
    ),
  },
  {
    key: "return_date",
    label: "Return Date",
    render: (v, row) =>
      row.request_type === "loan" ? (
        <span>{formatDate(v as string | null)}</span>
      ) : (
        <span className="text-brand-text-secondary">—</span>
      ),
  },
  {
    key: "status",
    label: "Status",
    render: (v) => <ApprovalBadge status={String(v)} />,
  },
  {
    key: "next_actor",
    label: "Next Actor",
    render: (_, row) => {
      if (row.status === "pending" || row.status === "approved") return <span className="text-sm text-brand-text-primary">Asset Admin</span>;
      if (row.status === "allocated" && row.request_type === "loan") return <span className="text-sm text-brand-text-primary">Requester</span>;
      return <span className="text-brand-text-secondary">—</span>;
    },
  },
  {
    key: "created_at",
    label: "Submitted",
    render: (v) => <span className="text-brand-text-secondary text-xs">{formatDate(v as string)}</span>,
  },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AssetRequestsPage() {
  const [activeStatus, setActiveStatus] = useState<AssetRequestStatus | undefined>(undefined);
  const { data, isLoading, isError } = useAssetRequests(activeStatus);

  return (
    <AppLayout pageTitle="Assets">
      <Link
        href="/assets"
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors mb-5"
      >
        <ArrowLeft size={14} /> Back to Assets
      </Link>
      <PageHeader
        title="My Requests"
        description="Your loan and requisition requests for company assets"
        action={
          <Link
            href="/assets/requests/new"
            className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors"
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
        rowHref={(row) => `/assets/requests/${row.id}`}
        emptyMessage={isError ? "Could not load requests" : "No asset requests"}
        emptyDescription={
          isError
            ? "Check your connection and try again."
            : activeStatus
              ? `No requests with status "${activeStatus}".`
              : "Submit your first asset request to get started."
        }
        toolbarActions={
          <div className="w-44 shrink-0">
            <SelectInput
              placeholder="All Statuses"
              sortOptions={false}
              value={activeStatus ?? ""}
              onValueChange={(v) => setActiveStatus((v || undefined) as AssetRequestStatus | undefined)}
              options={STATUS_OPTIONS}
            />
          </div>
        }
      />
    </AppLayout>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { useAssetRequests } from "@/hooks/useAssets";
import { formatDate, capitalize } from "@/lib/utils";
import type { AssetRequestListItem, AssetRequestStatus } from "@/types";

// ── Status tabs ────────────────────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: AssetRequestStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Returned", value: "returned" },
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
      <PageHeader
        title="Asset Requests"
        description="Loan and requisition requests for company assets"
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

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-4 bg-white border border-brand-border rounded-xl p-1 w-fit overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveStatus(tab.value)}
            className={[
              "px-3 py-1.5 text-sm rounded-lg transition-colors whitespace-nowrap",
              activeStatus === tab.value
                ? "bg-brand-purple text-white font-medium"
                : "text-brand-text-secondary hover:text-brand-text-primary hover:bg-gray-50",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : isError ? (
        <EmptyState title="Could not load requests" description="Check your connection and try again." />
      ) : !data?.length ? (
        <EmptyState
          title="No asset requests"
          description={
            activeStatus
              ? `No requests with status "${activeStatus}".`
              : "Submit your first asset request to get started."
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          rowHref={(row) => `/assets/requests/${row.id}`}
        />
      )}
    </AppLayout>
  );
}

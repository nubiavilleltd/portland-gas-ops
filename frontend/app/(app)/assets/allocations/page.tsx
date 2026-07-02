"use client";

import Link from "next/link";
import { ArrowLeft, Boxes } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { useAssetRequests } from "@/lib/modules/assets";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatDate, capitalize } from "@/lib/utils";
import type { AssetRequestListItem } from "@/types";

// ── Columns ────────────────────────────────────────────────────────────────────

const columns: Column<AssetRequestListItem>[] = [
  {
    key: "reference",
    label: "Reference",
    render: (v) => <span className="font-mono text-xs">{String(v)}</span>,
  },
  {
    key: "requester_name",
    label: "Requester",
    render: (v) => <span className="text-brand-text-primary">{String(v ?? "—")}</span>,
  },
  {
    key: "request_type",
    label: "Type",
    render: (v) => (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        String(v) === "loan"
          ? "bg-blue-50 text-blue-700 border border-blue-200"
          : "bg-purple-50 text-purple-700 border border-purple-200"
      }`}>
        {capitalize(String(v))}
      </span>
    ),
  },
  {
    key: "purpose",
    label: "Purpose",
    render: (v) => (
      <span className="block max-w-[260px] truncate text-brand-text-secondary text-sm" title={String(v)}>
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
    key: "status",
    label: "Status",
    render: (v) => <ApprovalBadge status={String(v)} />,
  },
  {
    key: "created_at",
    label: "Submitted",
    render: (v) => <span className="text-brand-text-secondary text-xs">{formatDate(v as string)}</span>,
  },
  {
    key: "id",
    label: "",
    render: (_, row) => (
      <Link
        href={`/assets/allocations/new?requestId=${row.id}`}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
      >
        <Boxes size={12} /> Allocate
      </Link>
    ),
  },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AllocationsQueuePage() {
  const { user } = useCurrentUser();
  const isAssetAdmin =
    user?.role === "asset_admin" ||
    user?.role === "admin" ||
    user?.role === "super_admin";

  const { data, isLoading, isError } = useAssetRequests("approved");

  return (
    <AppLayout pageTitle="Assets">
      <Link
        href="/assets/requests"
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors mb-5"
      >
        <ArrowLeft size={14} /> Back to Requests
      </Link>
      <PageHeader
        title="Allocations Queue"
        description="Approved requests waiting for assets to be assigned"
        className="mb-6"
      />

      {!isAssetAdmin ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-brand-text-secondary">
          <Boxes size={32} className="text-gray-300" />
          <p className="text-sm">You don&apos;t have permission to view the allocations queue.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data ?? []}
          isLoading={isLoading}
          rowHref={(row) => `/assets/requests/${row.id}`}
          emptyMessage={isError ? "Could not load requests" : "No requests pending allocation"}
          emptyDescription={
            isError
              ? "Check your connection and try again."
              : "All approved requests have been allocated, or no requests have been approved yet."
          }
        />
      )}
    </AppLayout>
  );
}

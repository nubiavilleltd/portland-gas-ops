"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FileText, Download } from "lucide-react";
import { API_URL } from "@/lib/constants";
import { useAuthStore } from "@/store/authStore";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { formatDate, capitalize } from "@/lib/utils";
import { useProcurementList } from "@/hooks/useProcurement";
import type { ProcurementListItem, ProcurementStatus } from "@/types";

const STATUS_TABS: { label: string; value: ProcurementStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Submitted", value: "submitted" },
  { label: "Ordered", value: "ordered" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

const columns: Column<ProcurementListItem>[] = [
  { key: "reference", label: "Reference", render: (v) => <span className="font-mono text-xs">{String(v)}</span> },
  {
    key: "category",
    label: "Category",
    render: (v) => <span className="capitalize">{String(v).replace(/_/g, " ")}</span>,
  },
  {
    key: "priority",
    label: "Priority",
    render: (v) => {
      const colours: Record<string, string> = {
        routine: "text-gray-500",
        urgent: "text-amber-600 font-medium",
        emergency: "text-red-600 font-semibold",
      };
      return <span className={colours[String(v)] ?? ""}>{capitalize(String(v))}</span>;
    },
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
    render: (v) => <ApprovalBadge status={String(v)} />,
  },
  {
    key: "po_url",
    label: "PO",
    render: (v, row) =>
      v ? (
        <PODownloadCell requestId={row.id} reference={row.reference} />
      ) : (
        <span className="text-brand-text-secondary text-xs">—</span>
      ),
  },
];

function PODownloadCell({ requestId, reference }: { requestId: string; reference: string }) {
  const [loading, setLoading] = useState(false);
  const token = useAuthStore((s) => s.accessToken);

  async function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/procurement/${requestId}/download-po`, {
        headers,
        credentials: "include",   // sends access_token cookie, same as axios withCredentials
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reference}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Could not download the PDF. Please try again.");
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
        title="Purchase Requests"
        description="Raise and manage purchase requisitions"
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

      {/* Status filter tabs */}
      <div className="inline-flex gap-1 mb-4 bg-white border border-brand-border rounded-xl p-1 max-w-full overflow-x-auto">
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
          title="No procurement requests"
          description={activeStatus ? `No requests with status "${activeStatus}".` : "Raise your first request to get started."}
        />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          rowHref={(row) => `/procurement/${row.id}`}
        />
      )}
    </AppLayout>
  );
}

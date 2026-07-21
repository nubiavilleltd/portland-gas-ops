"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Download } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import SelectInput from "@/components/forms/SelectInput";
import { formatDateTime, formatCurrency, capitalize } from "@/lib/utils";
import { useProcurementList } from "@/lib/modules/procurement";
import api from "@/lib/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { ProcurementListItem, ProcurementStatus } from "@/types";

const STATUS_OPTIONS = [
  { value: "pending",   label: "Pending Approval" },
  { value: "approved",  label: "Approved" },
  { value: "awaiting_confirmation", label: "Awaiting Confirmation" },
  { value: "completed", label: "Completed" },
  { value: "rejected",  label: "Rejected" },
  { value: "returned",  label: "Returned" },
];

export default function ProcurementPage() {
  const [activeStatus, setActiveStatus] = useState<ProcurementStatus | undefined>(undefined);
  const { data, isLoading, isError } = useProcurementList(activeStatus);
  const { user } = useCurrentUser();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const columns = useMemo<Column<ProcurementListItem>[]>(() => {
    const base: Column<ProcurementListItem>[] = [
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
    ];

    if (isAdmin) {
      base.push({
        key: "raiser",
        label: "Requester",
        render: (_, row) => {
          if (!row.raiser?.user) return <span className="text-brand-text-secondary">—</span>;
          const { first_name, last_name } = row.raiser.user;
          const name = [first_name, last_name].filter(Boolean).join(" ") || row.raiser.user.email;
          return (
            <div>
              <p className="text-sm text-brand-text-primary">{name}</p>
              {row.raiser.department && (
                <p className="text-xs text-brand-text-secondary">{row.raiser.department}</p>
              )}
            </div>
          );
        },
      });
    }

    base.push(
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
        label: "Submitted",
        render: (v) => <span className="text-xs text-brand-text-secondary">{formatDateTime(v as string)}</span>,
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
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const response = await api.get(`/api/procurement/${row.id}/po/download`, { responseType: "blob" });
                  const blob = new Blob([response.data], { type: "application/pdf" });
                  const url  = URL.createObjectURL(blob);
                  const a    = document.createElement("a");
                  a.href     = url;
                  a.download = row.po_number ? `${row.po_number}.pdf` : "purchase-order.pdf";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  setTimeout(() => URL.revokeObjectURL(url), 10_000);
                } catch {
                  alert("Could not download PO. Please try again.");
                }
              }}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-purple-50 text-brand-purple hover:bg-purple-100 transition-colors"
              title="Download Purchase Order"
            >
              <Download size={14} />
            </button>
          ) : row.po_number ? (
            <span className="text-xs font-mono text-brand-text-secondary" title="PO issued — PDF not yet available">
              {row.po_number}
            </span>
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
    );

    return base;
  }, [isAdmin]);

  return (
    <AppLayout pageTitle="Procurement">
      <PageHeader
        title="Purchase & Service Requests"
        description="Raise and manage purchase and service requisitions"
        action={
          <Button href="/procurement/new" leftIcon={<Plus size={15} />} size="sm">
            New Request
          </Button>
        }
        className="mb-6"
      />

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        minWidthClassName="min-w-max"
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

"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column, type DataTableAction } from "@/components/ui/DataTable";
import ActionModal from "@/components/ui/ActionModal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import FormSelect from "@/components/forms/FormSelect";
import { BackButton } from "@/components/ui/BackButton";
import Tip from "@/components/ui/Tip";
import { useIntranetFeedback } from "@/lib/modules/intranet/hooks/useIntranetFeedback";
import { useToast } from "@/hooks/useToast";
import type { FeedbackEntry, FeedbackStatus } from "@/lib/modules/intranet/types/intranet.types";

type FeedbackRow = Omit<FeedbackEntry, "id"> & { id: string; _numId: number };

const STATUS_BADGE: Record<FeedbackStatus, "warning" | "info" | "success" | "neutral"> = {
  open:      "warning",
  in_review: "info",
  resolved:  "success",
  closed:    "neutral",
};

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  open:      "Open",
  in_review: "In Review",
  resolved:  "Resolved",
  closed:    "Closed",
};

const STATUS_OPTIONS: { value: FeedbackStatus; label: string }[] = [
  { value: "open",      label: "Open" },
  { value: "in_review", label: "In Review" },
  { value: "resolved",  label: "Resolved" },
  { value: "closed",    label: "Closed" },
];

const CATEGORY_BADGE: Record<string, "purple" | "info" | "warning" | "danger" | "neutral"> = {
  General:    "neutral",
  IT:         "info",
  HR:         "purple",
  Suggestion: "warning",
  Complaint:  "danger",
};

const columns: Column<FeedbackRow>[] = [
  {
    key: "subject",
    label: "Subject",
    render: (_, row) => (
      <div className="min-w-0">
        <p className="text-sm font-medium text-brand-text-primary max-w-xs truncate">{row.subject}</p>
        <p className="text-xs text-brand-text-secondary mt-0.5">
          {row.is_anonymous ? "Anonymous" : `${row.submitted_by_name}${row.submitted_by_dept ? ` · ${row.submitted_by_dept}` : ""}`}
        </p>
      </div>
    ),
  },
  {
    key: "category",
    label: "Category",
    render: (_, row) => (
      <Badge variant={CATEGORY_BADGE[row.category] ?? "neutral"} label={row.category} />
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (_, row) => (
      <Badge variant={STATUS_BADGE[row.status]} label={STATUS_LABELS[row.status]} />
    ),
  },
  {
    key: "created_at",
    label: "Submitted",
    render: (_, row) => (
      <span className="text-sm text-brand-text-secondary">
        {new Date(row.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
      </span>
    ),
  },
];

export default function FeedbackInboxPage() {
  const { entries, isLoading, isFetching, updateStatus } = useIntranetFeedback();
  const toast = useToast();

  const [viewTarget, setViewTarget]   = useState<FeedbackEntry | null>(null);
  const [statusEdit, setStatusEdit]   = useState<FeedbackStatus>("open");

  const rows: FeedbackRow[] = entries.map((e) => ({ ...e, id: String(e.id), _numId: e.id }));

  function openView(row: FeedbackRow) {
    const item = entries.find((e) => e.id === row._numId)!;
    setViewTarget(item);
    setStatusEdit(item.status);
  }

  const STATUS_LABELS_MAP: Record<FeedbackStatus, string> = {
    open: "Open", in_review: "In Review", resolved: "Resolved", closed: "Closed",
  };

  async function handleStatusSave() {
    if (!viewTarget) return;
    const prevStatus = viewTarget.status;
    try {
      await updateStatus(viewTarget.id, statusEdit);
      if (!viewTarget.is_anonymous && viewTarget.submitted_by_name && statusEdit !== prevStatus) {
        toast.success(
          `Status updated to "${STATUS_LABELS_MAP[statusEdit]}". Notification sent to ${viewTarget.submitted_by_name}.`
        );
      } else {
        toast.success("Status updated.");
      }
      setViewTarget(null);
    } catch {
      toast.error("Failed to update status. Please try again.");
    }
  }

  // Summary counts
  const openCount     = entries.filter((e) => e.status === "open").length;
  const reviewCount   = entries.filter((e) => e.status === "in_review").length;
  const resolvedCount = entries.filter((e) => e.status === "resolved").length;

  const tableActions: DataTableAction<FeedbackRow>[] = [
    {
      key: "view",
      label: "",
      icon: <Tip label="View & Update Status"><Eye size={14} /></Tip>,
      variant: "ghost",
      onClick: (row) => openView(row),
    },
  ];

  return (
    <AppLayout pageTitle="Feedback Inbox">
      <BackButton href="/admin" label="Back to Admin" />
      <PageHeader
        title="Feedback Inbox"
        description="View and manage feedback submitted by employees through the intranet portal"
        className="mb-6"
      />

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Open",      count: openCount,     variant: "warning" as const },
          { label: "In Review", count: reviewCount,   variant: "info"    as const },
          { label: "Resolved",  count: resolvedCount, variant: "success" as const },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-brand-border bg-white px-5 py-4">
            <p className="text-xs text-brand-text-secondary mb-1">{s.label}</p>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-brand-text-primary">{s.count}</p>
              <Badge variant={s.variant} label={s.label} />
            </div>
          </div>
        ))}
      </div>

      <DataTable<FeedbackRow>
        columns={columns}
        data={rows}
        isLoading={isLoading || isFetching}
        showActions
        actions={tableActions}
        actionsLabel="Actions"
        searchable
        searchPlaceholder="Search feedback…"
        emptyMessage="No feedback submissions yet."
        emptyDescription="Feedback submitted via the intranet portal will appear here."
      />

      {/* Detail panel */}
      <ActionModal
        open={viewTarget !== null}
        onClose={() => setViewTarget(null)}
        title="Feedback Detail"
        variant="panel"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setViewTarget(null)}>Close</Button>
            <Button onClick={handleStatusSave}>Update Status</Button>
          </>
        }
      >
        {viewTarget && (
          <div className="space-y-5">
            {/* Submitter */}
            <div className="rounded-lg bg-gray-50 p-4 space-y-1">
              <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider">Submitted by</p>
              <p className="text-sm font-medium text-brand-text-primary">
                {viewTarget.is_anonymous ? "Anonymous" : viewTarget.submitted_by_name ?? "—"}
              </p>
              {!viewTarget.is_anonymous && viewTarget.submitted_by_dept && (
                <p className="text-xs text-brand-text-secondary">{viewTarget.submitted_by_dept}</p>
              )}
              <p className="text-xs text-brand-text-secondary">
                {new Date(viewTarget.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            {/* Category + subject */}
            <div className="border-t border-brand-border pt-4">
              <Badge variant={CATEGORY_BADGE[viewTarget.category] ?? "neutral"} label={viewTarget.category} />
              <p className="text-base font-semibold text-brand-text-primary mt-5">{viewTarget.subject}</p>
            </div>

            {/* Status — placed before message so dropdown opens downward with room */}
            <FormSelect
              label="Status"
              options={STATUS_OPTIONS}
              value={statusEdit}
              onValueChange={(v) => setStatusEdit(v as FeedbackStatus)}
            />

            {/* Message */}
            <div>
              <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-2">Message</p>
              <p className="text-sm text-brand-text-primary leading-relaxed whitespace-pre-wrap rounded-lg border border-brand-border bg-white p-3">
                {viewTarget.message}
              </p>
            </div>

            {viewTarget.resolved_at && (
              <p className="text-xs text-brand-text-secondary">
                Resolved on {new Date(viewTarget.resolved_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>
        )}
      </ActionModal>
    </AppLayout>
  );
}

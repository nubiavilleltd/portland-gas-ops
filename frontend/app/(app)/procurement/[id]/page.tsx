"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Paperclip, Building2, AlertCircle, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import FormTextarea from "@/components/forms/FormTextarea";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useUpdateProcurementStatus, useCancelProcurement, useProcurement } from "@/hooks/useProcurement";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/useToast";
import { formatDate, formatCurrency, capitalize } from "@/lib/utils";
import { API_URL } from "@/lib/constants";
import { useAuthStore } from "@/store/authStore";
import type { ProcurementStatus } from "@/types";

function DownloadPOButton({ requestId, reference }: { requestId: string; reference: string }) {
  const [loading, setLoading] = useState(false);
  const token = useAuthStore((s) => s.accessToken);

  async function handleDownload() {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/procurement/${requestId}/download-po`, {
        headers,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Download failed");
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
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-brand-border rounded-lg hover:bg-gray-50 transition-colors text-brand-text-primary disabled:opacity-50"
    >
      <Download size={14} />
      {loading ? "Downloading…" : "Download PO"}
    </button>
  );
}

const STATUS_ACTIONS: Record<ProcurementStatus, { label: string; next: ProcurementStatus } | null> = {
  draft:      { label: "Submit Request", next: "submitted" },
  submitted:  { label: "Mark as Ordered", next: "ordered" },
  ordered:    { label: "Mark as Delivered", next: "delivered" },
  delivered:  null,
  cancelled:  null,
};


export default function ProcurementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { user } = useCurrentUser();

  const { data: req, isLoading, isError } = useProcurement(id);
  const updateStatus = useUpdateProcurementStatus(id);
  const cancelRequest = useCancelProcurement(id);

  const isManager = user?.role === "admin" || user?.role === "super_admin";

  type ApprovalAction = "approve" | "reject" | "return" | null;
  const [approvalAction, setApprovalAction] = useState<ApprovalAction>(null);
  const [approvalComment, setApprovalComment] = useState("");

  const approvalDialogConfig: Record<NonNullable<ApprovalAction>, { title: string; message: string; confirmLabel: string; destructive: boolean }> = {
    approve: { title: "Approve Request",       message: "Confirm that you are approving this procurement request.",                              confirmLabel: "Approve",      destructive: false },
    reject:  { title: "Deny Request",          message: "This will deny the request. The requester will be notified and must resubmit.",        confirmLabel: "Deny Request", destructive: true  },
    return:  { title: "Return to Submitter",   message: "The request will be sent back to the requester for revision.",                         confirmLabel: "Return",       destructive: false },
  };

  async function handleStatusUpdate(next: ProcurementStatus) {
    try {
      await updateStatus.mutateAsync(next);
      toast.success(`Request marked as ${next}`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this request?")) return;
    try {
      await cancelRequest.mutateAsync();
      toast.success("Request cancelled");
      router.push("/procurement");
    } catch {
      toast.error("Failed to cancel request");
    }
  }

  if (isLoading) {
    return (
      <AppLayout pageTitle="Procurement">
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      </AppLayout>
    );
  }

  if (isError || !req) {
    return (
      <AppLayout pageTitle="Procurement">
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-brand-text-secondary">
          <AlertCircle size={32} />
          <p className="text-sm">Request not found or you don&apos;t have access.</p>
          <button onClick={() => router.back()} className="text-brand-purple text-sm hover:underline">Go back</button>
        </div>
      </AppLayout>
    );
  }

  const grandTotal = req.items.reduce((sum, item) => sum + Number(item.total_cost), 0);
  const statusAction = STATUS_ACTIONS[req.status];
  const canCancel = req.status !== "cancelled" && req.status !== "delivered";

  return (
    <AppLayout pageTitle="Procurement">

      {/* ── Top bar: back + actions ──────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Back to Procurement
        </button>
        <div className="flex items-center gap-2">
          {req.po_url && <DownloadPOButton requestId={req.id} reference={req.reference} />}
          {isManager && statusAction && req.status !== "submitted" && (
            <button
              onClick={() => handleStatusUpdate(statusAction.next)}
              disabled={updateStatus.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60"
            >
              {updateStatus.isPending ? "Updating…" : statusAction.label}
            </button>
          )}
          {isManager && canCancel && req.status !== "submitted" && (
            <button
              onClick={handleCancel}
              disabled={cancelRequest.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60"
            >
              {cancelRequest.isPending ? "Cancelling…" : "Cancel Request"}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-3xl space-y-5">

        {/* ── Section 1: Request Details ───────────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-mono text-brand-text-secondary mb-1">{req.reference}</p>
              <h1 className="text-xl font-semibold text-brand-text-primary">{req.title}</h1>
            </div>
            <ApprovalBadge status={req.status} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 border-t border-brand-border pt-5 text-sm">
            {[
              ["Category",    capitalize(req.category)],
              ["Priority",    capitalize(req.priority)],
              ["Required By", formatDate(req.required_by)],
              ["Submitted",   formatDate(req.created_at)],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-xs text-brand-text-secondary mb-0.5">{label}</p>
                <p className="font-medium text-brand-text-primary">{val}</p>
              </div>
            ))}
          </div>

          {req.justification && (
            <div className="mt-5 pt-5 border-t border-brand-border text-sm">
              <p className="text-xs text-brand-text-secondary mb-1">Justification</p>
              <p className="text-brand-text-primary leading-relaxed">{req.justification}</p>
            </div>
          )}
        </div>

        {/* ── Section 2: Line Items ────────────────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-border">
            <h2 className="text-sm font-semibold text-brand-text-primary">Line Items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border bg-gray-50/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Description</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Qty</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Unit</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Unit Cost</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {req.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3.5 text-brand-text-primary">{item.description}</td>
                    <td className="px-5 py-3.5 text-center text-brand-text-secondary">{item.quantity}</td>
                    <td className="px-5 py-3.5 text-center text-brand-text-secondary capitalize">{item.unit}</td>
                    <td className="px-5 py-3.5 text-right text-brand-text-secondary">{formatCurrency(Number(item.unit_cost))}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-brand-text-primary">{formatCurrency(Number(item.total_cost))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-brand-border bg-gray-50/60">
                  <td colSpan={4} className="px-5 py-3.5 text-sm font-semibold text-brand-text-secondary text-right">
                    Estimated Total
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-brand-purple text-base">
                    {formatCurrency(grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ── Section 3: Vendor Information ───────────────────────────────── */}
        {req.vendor ? (
          <div className="bg-white border border-brand-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={14} className="text-brand-purple" />
              <h2 className="text-sm font-semibold text-brand-text-primary">Vendor Information</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 text-sm">
              <div>
                <p className="text-xs text-brand-text-secondary mb-0.5">Vendor Name</p>
                <p className="font-medium text-brand-text-primary">{req.vendor.name}</p>
              </div>
              {req.vendor.address && (
                <div>
                  <p className="text-xs text-brand-text-secondary mb-0.5">Address</p>
                  <p className="font-medium text-brand-text-primary">{req.vendor.address}</p>
                </div>
              )}
              {req.vendor.phone && (
                <div>
                  <p className="text-xs text-brand-text-secondary mb-0.5">Phone</p>
                  <p className="font-medium text-brand-text-primary">{req.vendor.phone}</p>
                </div>
              )}
              {req.vendor.email && (
                <div>
                  <p className="text-xs text-brand-text-secondary mb-0.5">Email</p>
                  <p className="font-medium text-brand-text-primary">{req.vendor.email}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-brand-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={14} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-brand-text-primary">Vendor Information</h2>
            </div>
            <p className="text-sm text-brand-text-secondary">No vendor assigned to this request.</p>
          </div>
        )}

        {/* ── Supporting Document ──────────────────────────────────────────── */}
        {req.attachment_url && (
          <div className="bg-white border border-brand-border rounded-2xl p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
              <Paperclip size={16} className="text-brand-purple" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-brand-text-primary truncate">
                {req.attachment_name ?? "Supporting document"}
              </p>
              <p className="text-xs text-brand-text-secondary">Attached file</p>
            </div>
            <a
              href={req.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-medium text-brand-purple hover:underline shrink-0"
            >
              <Download size={13} /> View
            </a>
          </div>
        )}

        {/* ── Section 5: Approver Action ──────────────────────────────────── */}
        {(
          <div className="bg-white border border-brand-border rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-brand-text-primary mb-4">Approval Decision</h2>
            <FormTextarea
              label="Comment (optional)"
              placeholder="Add a comment before submitting your decision…"
              rows={3}
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
            />
            <div className="flex items-center gap-2 justify-end mt-4">
              <button
                onClick={() => setApprovalAction("return")}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <RotateCcw size={14} /> Return
              </button>
              <button
                onClick={() => setApprovalAction("reject")}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <XCircle size={14} /> Deny
              </button>
              <button
                onClick={() => setApprovalAction("approve")}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors"
              >
                <CheckCircle size={14} /> Approve
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── Confirmation modal ───────────────────────────────────────────── */}
      {approvalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setApprovalAction(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-base font-semibold text-brand-text-primary">{approvalDialogConfig[approvalAction].title}</h3>
            <p className="text-sm text-brand-text-secondary mt-2 mb-4">{approvalDialogConfig[approvalAction].message}</p>
            {approvalComment && (
              <div className="bg-gray-50 border border-brand-border rounded-lg px-3 py-2 mb-4">
                <p className="text-xs text-brand-text-secondary">Your comment</p>
                <p className="text-sm text-brand-text-primary mt-0.5">{approvalComment}</p>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setApprovalAction(null)}
                className="px-4 py-2 text-sm font-medium text-brand-text-secondary border border-brand-border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { toast.success("Decision submitted"); setApprovalAction(null); setApprovalComment(""); }}
                className={
                  approvalDialogConfig[approvalAction].destructive
                    ? "px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    : "px-4 py-2 text-sm font-medium text-white bg-brand-purple rounded-lg hover:bg-brand-purple-dark transition-colors"
                }
              >
                {approvalDialogConfig[approvalAction].confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

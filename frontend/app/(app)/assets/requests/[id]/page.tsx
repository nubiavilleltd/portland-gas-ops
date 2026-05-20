"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, Package } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAssetRequest, useUpdateAssetRequestStatus } from "@/hooks/useAssets";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/useToast";
import { formatDate, capitalize } from "@/lib/utils";
import type { AssetRequestStatus } from "@/types";

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

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AssetRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { user } = useCurrentUser();

  const { data: req, isLoading, isError } = useAssetRequest(id);
  const updateStatus = useUpdateAssetRequestStatus(id);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  async function handleStatusUpdate(status: AssetRequestStatus, reason?: string) {
    try {
      await updateStatus.mutateAsync({
        status,
        rejection_reason: reason || undefined,
      });
      toast.success(
        status === "approved"
          ? "Request approved"
          : status === "rejected"
          ? "Request rejected"
          : "Request marked as returned"
      );
      setShowRejectForm(false);
      setRejectionReason("");
    } catch {
      toast.error("Failed to update status");
    }
  }

  if (isLoading) {
    return (
      <AppLayout pageTitle="Assets">
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      </AppLayout>
    );
  }

  if (isError || !req) {
    return (
      <AppLayout pageTitle="Assets">
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-brand-text-secondary">
          <AlertCircle size={32} />
          <p className="text-sm">Request not found or you don&apos;t have access.</p>
          <button onClick={() => router.back()} className="text-brand-purple text-sm hover:underline">
            Go back
          </button>
        </div>
      </AppLayout>
    );
  }

  const canApproveReject = isAdmin && req.status === "pending";
  const canMarkReturned = isAdmin && req.status === "approved" && req.request_type === "loan";

  return (
    <AppLayout pageTitle="Assets">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Requests
      </button>

      <div className="max-w-5xl space-y-5">

        {/* ── Header card ─────────────────────────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-mono text-brand-text-secondary mb-1">{req.reference}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <TypeBadge type={req.request_type} />
                <ApprovalBadge status={req.status} />
              </div>
            </div>
            <div className="text-right text-sm text-brand-text-secondary">
              <p>Submitted {formatDate(req.created_at)}</p>
              {req.requester_name && (
                <p className="font-medium text-brand-text-primary mt-0.5">{req.requester_name}</p>
              )}
            </div>
          </div>

          {req.approved_at && (
            <div className="mt-4 pt-4 border-t border-brand-border text-xs text-brand-text-secondary">
              {req.status === "approved"
                ? `Approved on ${formatDate(req.approved_at)}`
                : `Reviewed on ${formatDate(req.approved_at)}`}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left (2/3): Details + items ───────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Purpose */}
            <div className="bg-white border border-brand-border rounded-2xl">
              <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
                <h2 className="text-sm font-semibold text-brand-text-primary">Request Details</h2>
              </div>
              <div className="p-6 space-y-4 text-sm">
                <div>
                  <p className="text-xs text-brand-text-secondary mb-1">Purpose</p>
                  <p className="text-brand-text-primary">{req.purpose}</p>
                </div>

                {req.request_type === "loan" && req.return_date && (
                  <div>
                    <p className="text-xs text-brand-text-secondary mb-1">Return Date</p>
                    <p className="font-medium text-brand-text-primary">{formatDate(req.return_date)}</p>
                  </div>
                )}

                {req.rejection_reason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs font-medium text-red-700 mb-1">Rejection Reason</p>
                    <p className="text-sm text-red-600">{req.rejection_reason}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Items table */}
            <div className="bg-white border border-brand-border rounded-2xl">
              <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
                <h2 className="text-sm font-semibold text-brand-text-primary">
                  Requested Items ({req.items.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Asset</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {req.items.map((item, i) => (
                      <tr key={item.id} className={i % 2 === 1 ? "bg-gray-50/50" : ""}>
                        <td className="px-4 py-3">
                          {item.asset ? (
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                <Package size={14} className="text-gray-400" />
                              </div>
                              <div>
                                <p className="font-medium text-brand-text-primary">{item.asset.name}</p>
                                {item.asset.category && (
                                  <p className="text-xs text-brand-text-secondary">{item.asset.category.name}</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-brand-text-secondary">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-brand-text-secondary">{item.quantity}</td>
                        <td className="px-4 py-3 text-brand-text-secondary">
                          {item.notes ?? <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Right (1/3): Status + actions ─────────────────────────────── */}
          <div className="space-y-5">

            {/* Status card */}
            <div className="bg-white border border-brand-border rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-brand-text-primary mb-3">Status</h3>
              <div className="flex items-center gap-2 mb-4">
                <ApprovalBadge status={req.status} />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-brand-text-secondary">Type</span>
                  <TypeBadge type={req.request_type} />
                </div>
                {req.request_type === "loan" && req.return_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-brand-text-secondary">Return By</span>
                    <span className="font-medium text-brand-text-primary">{formatDate(req.return_date)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-brand-text-secondary">Items</span>
                  <span className="font-medium text-brand-text-primary">{req.items.length}</span>
                </div>
              </div>
            </div>

            {/* Admin actions */}
            {isAdmin && (canApproveReject || canMarkReturned) && (
              <div className="bg-white border border-brand-border rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-brand-text-primary">Actions</h3>

                {canApproveReject && !showRejectForm && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate("approved")}
                      disabled={updateStatus.isPending}
                      className="w-full px-4 py-2.5 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60"
                    >
                      {updateStatus.isPending ? "Updating…" : "Approve Request"}
                    </button>
                    <button
                      onClick={() => setShowRejectForm(true)}
                      className="w-full px-4 py-2.5 text-sm font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Reject Request
                    </button>
                  </>
                )}

                {showRejectForm && (
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-brand-text-primary">
                        Rejection Reason <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Explain why this request is being rejected…"
                        rows={3}
                        className="rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate("rejected", rejectionReason)}
                        disabled={updateStatus.isPending || !rejectionReason.trim()}
                        className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                      >
                        {updateStatus.isPending ? "Rejecting…" : "Confirm Reject"}
                      </button>
                      <button
                        onClick={() => { setShowRejectForm(false); setRejectionReason(""); }}
                        className="px-4 py-2 text-sm font-medium border border-brand-border rounded-lg text-brand-text-secondary hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {canMarkReturned && (
                  <button
                    onClick={() => handleStatusUpdate("returned")}
                    disabled={updateStatus.isPending}
                    className="w-full px-4 py-2.5 text-sm font-medium border border-brand-border rounded-lg text-brand-text-primary hover:bg-gray-50 transition-colors disabled:opacity-60"
                  >
                    {updateStatus.isPending ? "Updating…" : "Mark as Returned"}
                  </button>
                )}
              </div>
            )}

            {/* Staff: status-only message */}
            {!isAdmin && (
              <div className="bg-white border border-brand-border rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-brand-text-primary mb-2">Your Request</h3>
                <p className="text-xs text-brand-text-secondary">
                  {req.status === "pending" && "Your request is pending review by an administrator."}
                  {req.status === "approved" && "Your request has been approved. Please collect your asset(s)."}
                  {req.status === "rejected" && "Your request was not approved. See the rejection reason for details."}
                  {req.status === "returned" && "This loan has been marked as returned."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, Package, CheckCircle, XCircle, Clock, RotateCcw } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ToggleGroup from "@/components/ui/ToggleGroup";
import FormTextarea from "@/components/forms/FormTextarea";
import { useAssetRequest, useUpdateAssetRequestStatus } from "@/hooks/useAssets";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/useToast";
import { formatDate, capitalize } from "@/lib/utils";
import type { AssetRequestStatus } from "@/types";

// ── Type badge ─────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    loan:        "bg-blue-50 text-blue-700 border border-blue-200",
    requisition: "bg-purple-50 text-purple-700 border border-purple-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[type] ?? "bg-gray-100 text-gray-600"}`}>
      {capitalize(type)}
    </span>
  );
}

// ── Demo view toggle ───────────────────────────────────────────────────────────

type DemoView = "requester" | "asset_admin";

const DEMO_VIEWS: { value: DemoView; label: string }[] = [
  { value: "requester",   label: "Requester"   },
  { value: "asset_admin", label: "Asset Admin" },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AssetRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { user } = useCurrentUser();

  const { data: req, isLoading, isError } = useAssetRequest(id);
  const updateStatus = useUpdateAssetRequestStatus(id);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [demoView, setDemoView] = useState<DemoView>("requester");
  const [approvalComment, setApprovalComment] = useState("");
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | "return" | null>(null);

  async function handleAction(status: AssetRequestStatus, reason?: string) {
    try {
      await updateStatus.mutateAsync({
        status,
        rejection_reason: reason || undefined,
      });
      toast.success(
        status === "approved" ? "Request approved" :
        status === "rejected" ? "Request rejected" :
        "Request returned to requester"
      );
      setApprovalAction(null);
      setApprovalComment("");
    } catch {
      toast.error("Failed to update request");
    }
  }

  async function handleMarkReturned() {
    try {
      await updateStatus.mutateAsync({ status: "returned" });
      toast.success("Marked as returned");
    } catch {
      toast.error("Failed to update request");
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
          <button onClick={() => router.back()} className="text-brand-purple text-sm hover:underline">Go back</button>
        </div>
      </AppLayout>
    );
  }

  const isAdminView  = demoView === "asset_admin";
  const canApprove   = isAdminView && req.status === "pending";
  const canReturn    = demoView === "requester" && req.status === "approved" && req.request_type === "loan";

  return (
    <AppLayout pageTitle="Assets">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Back to Requests
        </button>
      </div>

      <div className="max-w-3xl space-y-5">

        {/* ── DEMO view toggle ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-brand-text-secondary shrink-0">Viewing as</span>
          <ToggleGroup options={DEMO_VIEWS} value={demoView} onChange={setDemoView} />
        </div>

        {/* ── Section 1: Request Overview ──────────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          {/* Reference + badges */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-mono text-brand-text-secondary mb-2">{req.reference}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <TypeBadge type={req.request_type} />
                <ApprovalBadge status={req.status} />
              </div>
            </div>
            <div className="text-right text-sm">
              {req.requester_name && (
                <p className="font-medium text-brand-text-primary">{req.requester_name}</p>
              )}
              <p className="text-xs text-brand-text-secondary mt-0.5">Submitted {formatDate(req.created_at)}</p>
            </div>
          </div>

          {/* Meta row — only show what exists */}
          <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-brand-border pt-4 text-sm">
            {req.request_type === "loan" && req.return_date && (
              <div>
                <p className="text-xs text-brand-text-secondary mb-0.5">Return By</p>
                <p className="font-medium text-brand-text-primary">{formatDate(req.return_date)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-brand-text-secondary mb-0.5">Items</p>
              <p className="font-medium text-brand-text-primary">{req.items.length}</p>
            </div>
          </div>

          {/* Purpose */}
          <div className="mt-4 pt-4 border-t border-brand-border text-sm">
            <p className="text-xs text-brand-text-secondary mb-1">Purpose</p>
            <p className="text-brand-text-primary leading-relaxed">{req.purpose}</p>
          </div>

          {/* Rejection reason */}
          {req.rejection_reason && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs font-medium text-red-700 mb-1">Rejection Reason</p>
              <p className="text-sm text-red-600">{req.rejection_reason}</p>
            </div>
          )}
        </div>

        {/* ── Section 2: Line Items ────────────────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-border">
            <h2 className="text-sm font-semibold text-brand-text-primary">
              Requested Items ({req.items.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border bg-gray-50/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Asset Type</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {req.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <Package size={14} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-brand-text-primary">{item.asset_type?.name ?? "Unknown type"}</p>
                          {item.asset_type?.prefix && (
                            <p className="text-xs text-brand-text-secondary font-mono">{item.asset_type.prefix}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center text-brand-text-secondary">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Section 3: Approval Section (asset admin view) ──────────────── */}
        {isAdminView && (
          <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50">
              <h2 className="text-sm font-semibold text-brand-text-primary">Approval Section</h2>
              <p className="text-xs text-brand-text-secondary mt-0.5">
                Reviewing as <span className="font-medium text-brand-text-primary">Asset Admin</span>
              </p>
            </div>
            <div className="p-6">
            {canApprove ? (
              <>
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
                    <XCircle size={14} /> Reject
                  </button>
                  <button
                    onClick={() => setApprovalAction("approve")}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors"
                  >
                    <CheckCircle size={14} /> Approve
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-brand-border">
                {req.status === "approved" && <CheckCircle size={16} className="text-green-500 shrink-0" />}
                {req.status === "rejected" && <XCircle size={16} className="text-red-500 shrink-0" />}
                {(req.status === "returned" || req.status === "pending") && <Clock size={16} className="text-brand-text-secondary shrink-0" />}
                <p className="text-sm text-brand-text-secondary">
                  {req.status === "approved"  && "This request has already been approved."}
                  {req.status === "rejected"  && "This request has been rejected."}
                  {req.status === "returned"  && "This request was returned to the requester."}
                  {req.status === "pending"   && "Awaiting your review."}
                </p>
              </div>
            )}
            </div>
          </div>
        )}

        {/* ── Section 3: Approval Status (requester view) ──────────────────── */}
        {!isAdminView && (
          <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50">
              <h2 className="text-sm font-semibold text-brand-text-primary">Approval Status</h2>
            </div>
            <div className="p-6">
            <div className="flex items-start gap-4 p-4 rounded-xl border border-brand-border">
              <div className={`mt-0.5 flex items-center justify-center h-7 w-7 rounded-full border-2 shrink-0 ${
                req.status === "approved" || req.status === "returned"
                  ? "bg-green-50 border-green-500"
                  : req.status === "rejected"
                  ? "bg-red-50 border-red-400"
                  : "bg-brand-purple/10 border-brand-purple"
              }`}>
                {(req.status === "approved" || req.status === "returned") && <CheckCircle size={13} className="text-green-600" />}
                {req.status === "rejected" && <XCircle size={13} className="text-red-500" />}
                {req.status === "pending"  && <Clock size={13} className="text-brand-purple" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-brand-text-primary">Asset Admin</p>
                <p className="text-xs text-brand-text-secondary mt-1">
                  {req.status === "pending"  && "Your request is pending review by the asset admin."}
                  {req.status === "approved" && "Your request has been approved. Please collect your asset(s)."}
                  {req.status === "rejected" && "Your request was not approved. See the rejection reason above."}
                  {req.status === "returned" && "This loan has been marked as returned."}
                </p>
              </div>
              <span className="text-xs shrink-0">
                {req.status === "pending"  && <span className="text-brand-purple">In review</span>}
                {req.status === "approved" && <span className="text-green-600">{req.approved_at ? formatDate(req.approved_at) : "Approved"}</span>}
                {req.status === "rejected" && <span className="text-red-500">{req.approved_at ? formatDate(req.approved_at) : "Rejected"}</span>}
                {req.status === "returned" && <span className="text-gray-500">Returned</span>}
              </span>
            </div>

            {/* Mark as returned — requester action for approved loans */}
            {canReturn && (
              <div className="mt-4 pt-4 border-t border-brand-border flex items-center justify-between">
                <p className="text-xs text-brand-text-secondary">Have you returned the asset(s)?</p>
                <button
                  onClick={handleMarkReturned}
                  disabled={updateStatus.isPending}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-brand-border rounded-lg text-brand-text-primary hover:bg-gray-50 transition-colors disabled:opacity-60"
                >
                  <RotateCcw size={14} />
                  {updateStatus.isPending ? "Updating…" : "Mark as Returned"}
                </button>
              </div>
            )}
            </div>
          </div>
        )}

      </div>

      {/* ── Confirmation modal ───────────────────────────────────────────── */}
      {approvalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setApprovalAction(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-base font-semibold text-brand-text-primary">
              {approvalAction === "approve" ? "Approve Request" : approvalAction === "reject" ? "Reject Request" : "Return to Requester"}
            </h3>
            <p className="text-sm text-brand-text-secondary mt-2 mb-4">
              {approvalAction === "approve" && "Confirm that you are approving this asset request."}
              {approvalAction === "reject"  && "This will reject the request. The requester will be notified."}
              {approvalAction === "return"  && "The request will be sent back to the requester for modification."}
            </p>
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
                disabled={updateStatus.isPending}
                onClick={() => {
                  if (approvalAction === "approve") handleAction("approved", approvalComment || undefined);
                  else if (approvalAction === "reject") handleAction("rejected", approvalComment || undefined);
                  else handleAction("pending", approvalComment || undefined);
                }}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-60 ${
                  approvalAction === "reject" ? "bg-red-600 hover:bg-red-700" :
                  approvalAction === "return" ? "bg-amber-600 hover:bg-amber-700" :
                  "bg-brand-purple hover:bg-brand-purple-dark"
                }`}
              >
                {updateStatus.isPending ? "Submitting…" :
                  approvalAction === "approve" ? "Approve" :
                  approvalAction === "reject"  ? "Reject"  : "Return"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

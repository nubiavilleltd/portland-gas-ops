"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, AlertCircle, Package,
  CheckCircle, XCircle, Clock, Circle, RotateCcw, Boxes,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import FormTextarea from "@/components/forms/FormTextarea";
import { useAssetRequest, useUpdateAssetRequestStatus, useAssetAvailability } from "@/hooks/useAssets";
import { useToast } from "@/hooks/useToast";
import { formatDate, capitalize } from "@/lib/utils";
import type { AssetRequestStatus } from "@/types";

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    loan: "bg-blue-50 text-blue-700 border border-blue-200",
    requisition: "bg-purple-50 text-purple-700 border border-purple-200",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[type] ?? "bg-gray-100 text-gray-600"}`}>{capitalize(type)}</span>;
}

export default function AdminAssetRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const { data: req, isLoading, isError } = useAssetRequest(id);
  const updateStatus = useUpdateAssetRequestStatus(id);
  const availability = useAssetAvailability();

  const [approvalComment, setApprovalComment] = useState("");
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | "return" | null>(null);

  async function handleAction(status: AssetRequestStatus, reason?: string) {
    try {
      await updateStatus.mutateAsync({ status, rejection_reason: reason || undefined });
      toast.success(status === "approved" ? "Request approved" : status === "rejected" ? "Request rejected" : "Request returned to requester");
      setApprovalAction(null);
      setApprovalComment("");
    } catch { toast.error("Failed to update request"); }
  }

  if (isLoading) return <AppLayout pageTitle="Admin — Asset Requests"><div className="flex justify-center py-20"><LoadingSpinner /></div></AppLayout>;
  if (isError || !req) {
    return <AppLayout pageTitle="Admin — Asset Requests"><div className="flex flex-col items-center justify-center py-20 gap-3 text-brand-text-secondary"><AlertCircle size={32} /><p className="text-sm">Request not found.</p><button onClick={() => router.back()} className="text-brand-purple text-sm hover:underline">Go back</button></div></AppLayout>;
  }

  const canApprove = req.status === "pending";
  const canAllocate = req.status === "approved";

  const stockIssues = req.items.map((item) => ({ typeName: item.asset_type?.name ?? "Unknown type", requested: item.quantity, available: availability[item.asset_type_id] ?? 0 })).filter((issue) => issue.available < issue.requested);
  const hasStockIssues = stockIssues.length > 0;

  const approvalDialogConfig = {
    approve: { title: "Approve Request", message: "Confirm that you are approving this asset request.", confirmLabel: "Approve", destructive: false },
    reject:  { title: "Reject Request",  message: "This will reject the request. The requester will be notified.", confirmLabel: "Reject", destructive: true },
    return:  { title: "Return to Requester", message: "The request will be sent back to the requester for modification.", confirmLabel: "Return", destructive: false },
  } as const;

  return (
    <AppLayout pageTitle="Admin — Asset Requests">
      <div className="flex items-center justify-between mb-6">
        <Link href="/admin/assets/requests" className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors">
          <ArrowLeft size={14} /> Back to Requests
        </Link>
      </div>

      <div className="space-y-5">
        {/* Request Overview */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-mono text-brand-text-secondary mb-2">{req.reference}</p>
              <div className="flex items-center gap-2 flex-wrap"><TypeBadge type={req.request_type} /><ApprovalBadge status={req.status} /></div>
            </div>
            <div className="text-right text-sm">
              {req.requester_name && <p className="font-medium text-brand-text-primary">{req.requester_name}</p>}
              <p className="text-xs text-brand-text-secondary mt-0.5">Submitted {formatDate(req.created_at)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-brand-border pt-4 text-sm">
            {req.request_type === "loan" && req.return_date && <div><p className="text-xs text-brand-text-secondary mb-0.5">Return By</p><p className="font-medium text-brand-text-primary">{formatDate(req.return_date)}</p></div>}
            <div><p className="text-xs text-brand-text-secondary mb-0.5">Items</p><p className="font-medium text-brand-text-primary">{req.items.length}</p></div>
          </div>
          <div className="mt-4 pt-4 border-t border-brand-border text-sm"><p className="text-xs text-brand-text-secondary mb-1">Purpose</p><p className="text-brand-text-primary leading-relaxed">{req.purpose}</p></div>
          {req.rejection_reason && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-xs font-medium text-red-700 mb-1">Rejection Reason</p><p className="text-sm text-red-600">{req.rejection_reason}</p></div>}
        </div>

        {/* Requested Items */}
        <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-border"><h2 className="text-sm font-semibold text-brand-text-primary">Requested Items ({req.items.length})</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-brand-border bg-gray-50/60"><th className="px-5 py-3 text-left text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Asset Type</th><th className="px-5 py-3 text-center text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Qty</th><th className="px-5 py-3 text-center text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Available</th></tr></thead>
              <tbody className="divide-y divide-brand-border">
                {req.items.map((item) => {
                  const avail = availability[item.asset_type_id] ?? 0;
                  const insufficient = avail < item.quantity;
                  return (
                    <tr key={item.id}>
                      <td className="px-5 py-3.5"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"><Package size={14} className="text-gray-400" /></div><div><p className="font-medium text-brand-text-primary">{item.asset_type?.name ?? "Unknown type"}</p>{item.asset_type?.prefix && <p className="text-xs text-brand-text-secondary font-mono">{item.asset_type.prefix}</p>}</div></div></td>
                      <td className="px-5 py-3.5 text-center text-brand-text-secondary">{item.quantity}</td>
                      <td className="px-5 py-3.5 text-center"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${insufficient ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{avail}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Allocate banner */}
        {canAllocate && (
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex items-center justify-center h-8 w-8 rounded-full bg-teal-100 shrink-0"><Boxes size={15} className="text-teal-700" /></div>
              <div><p className="text-sm font-semibold text-teal-800">Request approved — allocate assets</p><p className="text-xs text-teal-700 mt-0.5">Pick specific assets from the registry to complete this request.</p></div>
            </div>
            <Link href={`/admin/assets/allocations/new?requestId=${id}`} className="shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors">Allocate Assets</Link>
          </div>
        )}

        {/* Allocated confirmation */}
        {req.status === "allocated" && (
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 flex items-start gap-3">
            <div className="mt-0.5 flex items-center justify-center h-8 w-8 rounded-full bg-teal-100 shrink-0"><CheckCircle size={15} className="text-teal-700" /></div>
            <div><p className="text-sm font-semibold text-teal-800">Assets allocated</p><p className="text-xs text-teal-700 mt-0.5">Allocated by {req.allocated_by_name ?? "Asset Admin"}{req.allocated_at ? ` on ${formatDate(req.allocated_at)}` : ""}.</p></div>
          </div>
        )}

        {/* Approval Decision */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-brand-text-primary mb-1">Approval Decision</h2>
          <p className="text-xs text-brand-text-secondary mb-5">Reviewing as <span className="font-medium text-brand-text-primary">Asset Admin</span></p>
          {canApprove ? (
            <>
              <FormTextarea label="Comment (optional)" placeholder="Add a comment before submitting your decision…" rows={3} value={approvalComment} onChange={(e) => setApprovalComment(e.target.value)} />
              <div className="flex items-center gap-2 justify-end mt-4">
                <button onClick={() => setApprovalAction("return")} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"><RotateCcw size={14} /> Return</button>
                <button onClick={() => setApprovalAction("reject")} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"><XCircle size={14} /> Reject</button>
                <button onClick={() => setApprovalAction("approve")} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${hasStockIssues ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-brand-purple text-white hover:bg-brand-purple-dark"}`} title={hasStockIssues ? "Insufficient stock — cannot approve" : undefined}>
                  <CheckCircle size={14} /> Approve{hasStockIssues ? " (blocked)" : ""}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              {[{ label: "Pending Review", status: "pending" }, { label: "Approved", status: "approved" }, { label: "Allocated", status: "allocated" }, { label: "Rejected", status: "rejected" }].map((step, idx) => {
                const statusOrder: Record<string, number> = { pending: 0, approved: 1, allocated: 2, returned: 2, rejected: 1 };
                const currentIdx = statusOrder[req.status] ?? 0;
                const stepIdx = idx < 3 ? idx : 99;
                const isRejected = req.status === "rejected" && step.status === "rejected";
                const isDone = !isRejected && stepIdx < currentIdx;
                const isCurrent = !isRejected && stepIdx === currentIdx;
                if (step.status === "rejected" && req.status !== "rejected") return null;
                return (
                  <div key={step.status} className="flex items-start gap-4 p-4 rounded-xl border border-brand-border">
                    <div className={`mt-0.5 flex items-center justify-center h-7 w-7 rounded-full border-2 shrink-0 ${isRejected ? "bg-red-50 border-red-400" : isDone ? "bg-green-50 border-green-500" : isCurrent ? "bg-brand-purple/10 border-brand-purple" : "bg-gray-50 border-gray-200"}`}>
                      {isRejected && <XCircle size={13} className="text-red-500" />}
                      {!isRejected && isDone && <CheckCircle size={13} className="text-green-600" />}
                      {!isRejected && isCurrent && <Clock size={13} className="text-brand-purple" />}
                      {!isRejected && !isDone && !isCurrent && <Circle size={13} className="text-gray-200" />}
                    </div>
                    <div className="flex-1"><p className="text-sm font-medium text-brand-text-primary">{step.label}</p><p className="text-xs text-brand-text-secondary mt-0.5">Asset Admin</p></div>
                    <span className="text-xs shrink-0">
                      {isDone && <span className="text-green-600">Done</span>}
                      {isCurrent && !isRejected && <span className="text-brand-purple">Current</span>}
                      {isRejected && <span className="text-red-500">Rejected</span>}
                      {!isDone && !isCurrent && !isRejected && <span className="text-gray-400">Pending</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation modal */}
      {approvalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setApprovalAction(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-base font-semibold text-brand-text-primary">{approvalDialogConfig[approvalAction].title}</h3>
            <p className="text-sm text-brand-text-secondary mt-2 mb-4">{approvalDialogConfig[approvalAction].message}</p>
            {approvalAction === "approve" && hasStockIssues && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 mb-4">
                <p className="text-sm font-semibold text-red-700 mb-2">Insufficient Stock — Cannot Approve</p>
                <div className="space-y-1">
                  {stockIssues.map((issue) => <div key={issue.typeName} className="flex items-center justify-between text-xs text-red-600"><span>{issue.typeName}</span><span className="font-mono">{issue.available} available / {issue.requested} requested</span></div>)}
                </div>
                <p className="text-xs text-red-500 mt-2">Procure or receive the missing items before approving this request.</p>
              </div>
            )}
            {approvalComment && <div className="bg-gray-50 border border-brand-border rounded-lg px-3 py-2 mb-4"><p className="text-xs text-brand-text-secondary">Your comment</p><p className="text-sm text-brand-text-primary mt-0.5">{approvalComment}</p></div>}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setApprovalAction(null)} className="px-4 py-2 text-sm font-medium text-brand-text-secondary border border-brand-border rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                disabled={updateStatus.isPending || (approvalAction === "approve" && hasStockIssues)}
                onClick={() => {
                  if (approvalAction === "approve") handleAction("approved", approvalComment || undefined);
                  else if (approvalAction === "reject") handleAction("rejected", approvalComment || undefined);
                  else handleAction("pending", approvalComment || undefined);
                }}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${approvalDialogConfig[approvalAction].destructive ? "bg-red-600 hover:bg-red-700" : "bg-brand-purple hover:bg-brand-purple-dark"}`}
              >
                {updateStatus.isPending ? "Submitting…" : approvalDialogConfig[approvalAction].confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

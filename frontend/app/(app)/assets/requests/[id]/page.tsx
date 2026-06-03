"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, AlertCircle, Package,
  CheckCircle, XCircle, Clock, RotateCcw,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import ApprovalPanel from "@/components/ui/ApprovalPanel";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAssetRequest, useUpdateAssetRequestStatus } from "@/hooks/useAssets";
import { useToast } from "@/hooks/useToast";
import { formatDate, capitalize } from "@/lib/utils";

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

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AssetRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const { data: req, isLoading, isError } = useAssetRequest(id);
  const updateStatus = useUpdateAssetRequestStatus(id);

  const canMarkReturn = (req?.status === "approved" || req?.status === "allocated") && req?.request_type === "loan";

  async function handleMarkReturned() {
    try {
      await updateStatus.mutateAsync({ status: "returned" });
      toast.success("Marked as returned");
    } catch {
      toast.error("Failed to update");
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

  return (
    <AppLayout pageTitle="Assets">

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/assets/requests"
          className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Back to Requests
        </Link>
      </div>

      <div className="space-y-5">

        {/* ── Section 1: Request Overview ──────────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
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

          <div className="mt-4 pt-4 border-t border-brand-border text-sm">
            <p className="text-xs text-brand-text-secondary mb-1">Purpose</p>
            <p className="text-brand-text-primary leading-relaxed">{req.purpose}</p>
          </div>

          {req.rejection_reason && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs font-medium text-red-700 mb-1">Rejection Reason</p>
              <p className="text-sm text-red-600">{req.rejection_reason}</p>
            </div>
          )}
        </div>

        {/* ── Section 2: Requested Items ───────────────────────────────────── */}
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

        {/* ── Approval Progress ─────────────────────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-brand-text-primary mb-5">Approval Progress</h2>
          <div className="flex items-start gap-4 p-4 rounded-xl border border-brand-border">
            <div className={`mt-0.5 flex items-center justify-center h-7 w-7 rounded-full border-2 shrink-0 ${
              req.status === "approved" || req.status === "allocated" || req.status === "returned" ? "bg-green-50 border-green-500" :
              req.status === "rejected" ? "bg-red-50 border-red-400" :
              "bg-brand-purple/10 border-brand-purple"
            }`}>
              {(req.status === "approved" || req.status === "allocated" || req.status === "returned") && <CheckCircle size={13} className="text-green-600" />}
              {req.status === "rejected" && <XCircle size={13} className="text-red-500" />}
              {req.status === "pending"  && <Clock size={13} className="text-brand-purple" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-brand-text-primary">Asset Admin</p>
                {req.status === "pending"  && <span className="text-xs text-brand-purple">In review</span>}
                {(req.status === "approved" || req.status === "returned") && <span className="text-xs text-green-600">{req.approved_at ? formatDate(req.approved_at) : "Approved"}</span>}
                {req.status === "allocated" && <span className="text-xs text-teal-600">{req.allocated_at ? formatDate(req.allocated_at) : "Allocated"}</span>}
                {req.status === "rejected" && <span className="text-xs text-red-500">{req.approved_at ? formatDate(req.approved_at) : "Rejected"}</span>}
              </div>
              <p className="text-xs text-brand-text-secondary mt-1">
                {req.status === "pending"   && "Your request is pending review by the asset admin."}
                {req.status === "approved"  && "Your request has been approved. Assets are being prepared for you."}
                {req.status === "allocated" && "Your assets have been allocated. Please collect them from the asset admin."}
                {req.status === "rejected"  && "Your request was not approved. See the rejection reason above."}
                {req.status === "returned"  && "This loan has been marked as returned."}
              </p>
            </div>
          </div>
        </div>

        {/* ── Mark as Returned ─────────────────────────────────────────────── */}
        {canMarkReturn && (
          <ApprovalPanel
            title="Return Asset"
            description="Confirm that the borrowed asset has been returned"
            showComment={false}
            showReturn={false}
            showReject={false}
            showApprove={false}
            extraActions={[{
              key: "mark_returned",
              label: updateStatus.isPending ? "Updating…" : "Mark as Returned",
              icon: <RotateCcw size={14} />,
              variant: "approve",
              onClick: () => handleMarkReturned(),
              loading: updateStatus.isPending,
            }]}
          />
        )}

      </div>
    </AppLayout>
  );
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Package, Boxes, RotateCcw, Tag } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import FormSection from "@/components/ui/FormSection";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import FormDatePicker from "@/components/forms/FormDatePicker";
import ApprovalPanel from "@/components/ui/ApprovalPanel";
import AuditTrail from "@/components/forms/AuditTrail";
import AssetRequestDetailSkeleton from "./AssetRequestDetailSkeleton";
import { useAssetRequest, useUpdateAssetRequestStatus } from "@/lib/modules/assets";
import { useMyApprovals, useAuditTrail } from "@/lib/modules/workflow/queries";
import {
  useWorkflowApprove,
  useWorkflowReject,
} from "@/lib/modules/workflow/mutations";
import { useToast } from "@/hooks/useToast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatDate, capitalize } from "@/lib/utils";

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AssetRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast  = useToast();

  const { data: req, isLoading, isFetching, isError } = useAssetRequest(id);
  const [isActioning, setIsActioning] = useState(false);

  // Clear isActioning once the background refetch triggered by the action completes
  useEffect(() => {
    if (isActioning && !isFetching) setIsActioning(false);
  }, [isFetching, isActioning]);
  const updateStatus = useUpdateAssetRequestStatus(id);

  // Workflow: check if logged-in user is the current step's approver
  const { data: myApprovals = [] } = useMyApprovals();
  const myApprovalEntry = myApprovals.find(
    (a) => a.request_type === "asset" && a.request_id === id
  );
  const approvalRequestId = myApprovalEntry?.approval_request_id ?? null;
  const isFinalStep =
    !!myApprovalEntry &&
    myApprovalEntry.current_step_number === myApprovalEntry.total_steps;

  const workflowApprove = useWorkflowApprove();
  const workflowReject  = useWorkflowReject();

  const { data: auditTrail = [] } = useAuditTrail("asset", id);
  const { user } = useCurrentUser();

  async function handleApprovalAction(action: "approve" | "reject", comment: string) {
    if (!approvalRequestId) return;
    setIsActioning(true);
    try {
      if (action === "approve") {
        await workflowApprove.mutateAsync({ approvalRequestId, comment: comment || undefined });
        toast.success("Request approved");
        if (isFinalStep) {
          router.push(`/assets/allocations/new?requestId=${id}`);
        }
      } else {
        await workflowReject.mutateAsync({ approvalRequestId, comment: comment || undefined });
        toast.success("Request denied");
      }
    } catch (err) {
      setIsActioning(false);
      toast.error((err as Error).message);
    }
  }

  async function handleMarkReturned() {
    try {
      await updateStatus.mutateAsync({ status: "returned" });
      toast.success("Marked as returned");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (isLoading || isActioning) {
    return (
      <AppLayout pageTitle="Assets">
        <AssetRequestDetailSkeleton />
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

  const isAdmin = ["admin", "super_admin", "asset_admin"].includes(user?.role ?? "");

  const showApprovalPanel  = !!approvalRequestId && req.status === "pending";
  const showAllocateBanner = req.status === "approved" && isAdmin;
  const canMarkReturn =
    req.status === "allocated" &&
    req.request_type === "loan" &&
    req.requested_by === user?.id;

  const isBusy =
    workflowApprove.isPending ||
    workflowReject.isPending  ||
    updateStatus.isPending;

  return (
    <AppLayout pageTitle="Assets">
      {/* ── Back ─────────────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <Link
          href="/assets/requests"
          className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Back to Requests
        </Link>
      </div>

      {/* ── Header card ───────────────────────────────────────────────────────── */}
      <div className="bg-white border border-brand-border rounded-2xl px-6 py-5 mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-text-secondary mb-1">
            Asset Request
          </p>
          <h1 className="text-2xl font-bold text-brand-text-primary">{req.reference}</h1>
          <p className="text-sm text-brand-text-secondary mt-0.5">
            {capitalize(req.request_type)}
          </p>
          <p className="text-xs text-brand-text-secondary mt-1">
            {capitalize(req.status)} · Submitted {formatDate(req.created_at)}
          </p>
          {req.next_actor_name && (
            <p className="text-xs text-brand-text-secondary mt-1">
              Next Actor: <span className="font-medium text-brand-text-primary">{req.next_actor_name}</span>
              {req.current_step_name && <span className="text-brand-text-secondary"> · {req.current_step_name}</span>}
            </p>
          )}
        </div>
        <div className="shrink-0 pt-1">
          <ApprovalBadge status={req.status} />
        </div>
      </div>

      <div className="space-y-5">

        {/* ── Requester Details ─────────────────────────────────────────────── */}
        <FormSection title="Requester Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormInput label="Requester Name" value={req.requester_name ?? "—"} disabled />
            <FormInput label="Department"     value={req.requester_department ?? "—"} disabled />
            <FormInput label="Job Title"      value={req.requester_job_title ?? "—"} disabled />
            <FormDatePicker label="Request Date" value={req.created_at.slice(0, 10)} disabled />
          </div>
        </FormSection>

        {/* ── Request Details ───────────────────────────────────────────────── */}
        <FormSection title="Request Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormInput label="Request Type" value={capitalize(req.request_type)} disabled />
            {req.request_type === "loan" && req.return_date && (
              <FormInput label="Return By" value={formatDate(req.return_date)} disabled />
            )}
          </div>
          <FormTextarea label="Purpose" value={req.purpose} rows={3} disabled />
        </FormSection>

        {/* ── Requested Items ───────────────────────────────────────────────── */}
        <FormSection title={`Requested Items (${req.items.length})`} bodyClassName="p-0">
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
                          <p className="font-medium text-brand-text-primary">
                            {item.asset_type?.name ?? item.asset?.name ?? "—"}
                          </p>
                          {(item.asset_type?.prefix ?? item.asset?.asset_tag) && (
                            <p className="text-xs text-brand-text-secondary font-mono">
                              {item.asset_type?.prefix ?? item.asset?.asset_tag}
                            </p>
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
        </FormSection>

        {/* ── Rejection reason ──────────────────────────────────────────────── */}
        {req.rejection_reason && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-xs font-medium text-red-700 mb-1">Rejection Reason</p>
            <p className="text-sm text-red-600">{req.rejection_reason}</p>
          </div>
        )}

        {/* ── Approval Panel (only visible to the current step's approver) ──── */}
        {showApprovalPanel && (
          <ApprovalPanel
            title="Approval Decision"
            description="Review the request details above and make your decision."
            showReturn={false}
            showReject
            showApprove
            rejectLabel="Reject"
            approveLabel="Approve"
            requireCommentForRejectReturn
            onReject={(comment)  => handleApprovalAction("reject",  comment)}
            onApprove={(comment) => handleApprovalAction("approve", comment)}
            rejectLoading={workflowReject.isPending}
            approveLoading={workflowApprove.isPending}
            disabled={isBusy}
          />
        )}

        {/* ── Asset Admin — Allocate Banner (after approval) ────────────────── */}
        {showAllocateBanner && (
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex items-center justify-center h-8 w-8 rounded-full bg-teal-100 shrink-0">
                <Boxes size={15} className="text-teal-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-teal-800">Request approved — allocate assets</p>
                <p className="text-xs text-teal-700 mt-0.5">Pick specific assets from the registry to complete this request.</p>
              </div>
            </div>
            <Link
              href={`/assets/allocations/new?requestId=${id}`}
              className="shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors"
            >
              Allocate Assets
            </Link>
          </div>
        )}

        {/* ── Allocated Assets ──────────────────────────────────────────────── */}
        {req.status === "allocated" && (() => {
          const allocatedItems = req.items.filter((item) => item.asset !== null);
          return (
            <FormSection
              title="Allocated Assets"
              description={
                req.allocated_by_name
                  ? `Allocated by ${req.allocated_by_name}${req.allocated_at ? ` on ${formatDate(req.allocated_at)}` : ""}`
                  : req.allocated_at ? `Allocated on ${formatDate(req.allocated_at)}` : undefined
              }
              bodyClassName="p-0"
            >
              {allocatedItems.length === 0 ? (
                <div className="px-5 py-4 text-sm text-brand-text-secondary">No asset details recorded.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-brand-border bg-gray-50/60">
                        <th className="px-5 py-3 text-left text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Asset</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Tag</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Condition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                      {allocatedItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              {item.asset!.attachment_url ? (
                                <img
                                  src={item.asset!.attachment_url}
                                  alt={item.asset!.name}
                                  className="h-8 w-8 rounded-lg object-cover shrink-0 border border-brand-border"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                  <Package size={14} className="text-gray-400" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-brand-text-primary">{item.asset!.name}</p>
                                {item.asset!.asset_type?.name && (
                                  <p className="text-xs text-brand-text-secondary">{item.asset!.asset_type.name}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            {item.asset!.asset_tag ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-mono font-medium text-brand-text-primary">
                                <Tag size={10} />
                                {item.asset!.asset_tag}
                              </span>
                            ) : (
                              <span className="text-brand-text-secondary">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-brand-text-secondary capitalize">
                            {item.asset!.condition ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </FormSection>
          );
        })()}

        {/* ── Requester — Mark as Returned (loan only) ──────────────────────── */}
        {canMarkReturn && (
          <ApprovalPanel
            title="Return Asset"
            description="Confirm that the borrowed asset has been returned to the asset admin."
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

        {/* ── Audit Trail ──────────────────────────────────────────────────── */}
        <AuditTrail
          title="Approval History"
          description="A full record of every action taken on this request."
          emptyMessage="No actions recorded yet."
          items={auditTrail.map((entry) => ({
            action:   entry.action.charAt(0).toUpperCase() + entry.action.slice(1).replace(/_/g, " "),
            actor:    entry.actor_name ?? "System",
            role:     entry.actor_role ?? "",
            dateTime: formatDate(entry.acted_at),
            comment:  entry.comment ?? "",
          }))}
        />

      </div>
    </AppLayout>
  );
}

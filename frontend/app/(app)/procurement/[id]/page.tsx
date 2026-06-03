"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Download, Paperclip, Building2, AlertCircle,
  CheckCircle, XCircle, Clock, Circle, FileText,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import ApprovalPanel from "@/components/ui/ApprovalPanel";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useUpdateProcurementStatus, useCancelProcurement, useProcurement } from "@/hooks/useProcurement";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/useToast";
import { formatDate, formatCurrency, capitalize } from "@/lib/utils";
import { generatePO } from "@/lib/generatePO";
import type { ProcurementStatus, ProcurementRequest } from "@/types";

type ApprovalAction = "approve" | "reject" | "return" | null;

// ── Role helpers ───────────────────────────────────────────────────────────────

function useRole() {
  const { user } = useCurrentUser();
  const role = user?.role;
  return {
    isLineManager:        role === "line_manager" || role === "approver_l1",
    isProcurementOfficer: role === "procurement_officer",
    isAdmin:              role === "super_admin" || role === "admin",
  };
}

// ── Status trail config ────────────────────────────────────────────────────────

const STATUS_STEPS: { status: ProcurementStatus; label: string; role: string }[] = [
  { status: "pending_line_manager", label: "Awaiting Operations Manager",   role: "Operations Manager" },
  { status: "pending_procurement",  label: "Awaiting Procurement Officer", role: "Procurement Officer" },
  { status: "awaiting_payment",     label: "Awaiting Payment",             role: "Finance" },
];

const STATUS_ORDER: ProcurementStatus[] = [
  "pending_line_manager",
  "pending_procurement",
  "awaiting_payment",
];

function statusIndex(s: ProcurementStatus): number {
  return STATUS_ORDER.indexOf(s);
}

// ── Download PO button ─────────────────────────────────────────────────────────

function DownloadPOButton({ req }: { req: ProcurementRequest }) {
  const [loading, setLoading] = useState(false);
  async function handleClick() {
    setLoading(true);
    try { await generatePO(req); } finally { setLoading(false); }
  }
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-brand-border rounded-lg hover:bg-gray-50 transition-colors text-brand-text-primary disabled:opacity-50"
    >
      <Download size={14} /> {loading ? "Generating…" : "Download PO"}
    </button>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ProcurementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const { data: req, isLoading, isError } = useProcurement(id);
  const updateStatus = useUpdateProcurementStatus(id);
  const cancelRequest = useCancelProcurement(id);

  const { isLineManager, isProcurementOfficer, isAdmin } = useRole();
  const { user } = useCurrentUser();
  const userName = user?.name;

  const [approvalAction, setApprovalAction] = useState<ApprovalAction>(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");

  const approvalDialogConfig: Record<NonNullable<ApprovalAction>, { title: string; message: string; confirmLabel: string; destructive: boolean }> = {
    approve: { title: "Approve Request",     message: "Confirm that you are approving this procurement request.",                       confirmLabel: "Approve",      destructive: false },
    reject:  { title: "Reject Request",      message: "This will reject the request. The requester will be notified.",                  confirmLabel: "Reject",       destructive: true  },
    return:  { title: "Return to Submitter", message: "The request will be sent back to the requester for revision.",                   confirmLabel: "Return",       destructive: false },
  };

  async function handleApprovalConfirm() {
    if (!req || !approvalAction) return;
    try {
      if (approvalAction === "approve") {
        const next: ProcurementStatus =
          req.status === "pending_line_manager" ? "pending_procurement" : "awaiting_payment";
        const terms = req.status === "pending_procurement" ? (paymentTerms || null) : undefined;
        const issuingPO = req.status === "pending_procurement";
        await updateStatus.mutateAsync({ status: next, paymentTerms: terms, poIssuedBy: issuingPO ? userName : undefined });

        // Procurement officer issuing PO → generate PDF immediately
        if (issuingPO) {
          const updated = { ...req, status: "awaiting_payment" as ProcurementStatus, payment_terms: terms ?? null, po_issued_by: userName ?? null };
          await generatePO(updated);
          toast.success("PO issued and downloaded — request is now awaiting payment");
        } else {
          toast.success("Request approved");
        }
      } else if (approvalAction === "reject") {
        await updateStatus.mutateAsync({ status: "rejected" as ProcurementStatus });
        toast.success("Request rejected");
      } else {
        // return — send back to pending_line_manager for revision
        await updateStatus.mutateAsync({ status: "pending_line_manager" });
        toast.success("Request returned for revision");
      }
    } catch {
      toast.error("Failed to submit decision");
    }
    setApprovalAction(null);
    setApprovalComment("");
    setPaymentTerms("");
  }

  function triggerAction(action: NonNullable<ApprovalAction>, comment: string) {
    setApprovalComment(comment);
    setApprovalAction(action);
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

  if (isLoading) return <AppLayout pageTitle="Procurement"><div className="flex justify-center py-20"><LoadingSpinner /></div></AppLayout>;

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
  const vendor = req.vendor ?? req.one_time_vendor;
  const isServices = req.category === "services";
  const currentIdx = statusIndex(req.status as ProcurementStatus);
  const hasPO = req.po_url != null || req.status === "awaiting_payment";

  // What action panel to show
  const showLineManagerPanel =
    (isLineManager || isAdmin) && req.status === "pending_line_manager";
  const showPOPanel =
    (isProcurementOfficer || isAdmin) && req.status === "pending_procurement";
  const canCancel =
    (isAdmin || isLineManager || isProcurementOfficer) &&
    req.status !== "awaiting_payment" && req.status !== "rejected";

  return (
    <AppLayout pageTitle="Procurement">

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors">
          <ArrowLeft size={14} /> Back to Procurement
        </button>
        <div className="flex items-center gap-2">
          {hasPO && <DownloadPOButton req={req} />}
          {canCancel && (
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

      <div className="space-y-5">

        {/* ── Section 1: Request Details ───────────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-mono text-brand-text-secondary mb-1">{req.reference}</p>
              <h1 className="text-xl font-semibold text-brand-text-primary capitalize">{req.category.replace(/_/g, " ")} Request</h1>
            </div>
            <ApprovalBadge status={req.status} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 border-t border-brand-border pt-5 text-sm">
            {[
              ["Category",    capitalize(req.category)],
              ["Required By", formatDate(req.required_by)],
              ["Submitted",   formatDate(req.created_at)],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-xs text-brand-text-secondary mb-0.5">{label}</p>
                <p className="font-medium text-brand-text-primary">{val}</p>
              </div>
            ))}
          </div>
          {req.payment_terms && (
            <div className="mt-4 pt-4 border-t border-brand-border">
              <p className="text-xs text-brand-text-secondary mb-0.5">Payment Terms</p>
              <p className="text-sm font-medium text-brand-text-primary">{req.payment_terms}</p>
            </div>
          )}
          {req.justification && (
            <div className="mt-5 pt-5 border-t border-brand-border text-sm">
              <p className="text-xs text-brand-text-secondary mb-1">Justification / Purpose</p>
              <p className="text-brand-text-primary leading-relaxed">{req.justification}</p>
            </div>
          )}
        </div>

        {/* ── Section 2: Line Items ────────────────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-border">
            <h2 className="text-sm font-semibold text-brand-text-primary">{isServices ? "Service Items" : "Line Items"}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border bg-gray-50/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Description</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">{isServices ? "Duration" : "Qty"}</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Unit</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">{isServices ? "Rate" : "Unit Cost"}</th>
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
                  <td colSpan={4} className="px-5 py-3.5 text-sm font-semibold text-brand-text-secondary text-right">Estimated Total</td>
                  <td className="px-5 py-3.5 text-right font-bold text-brand-purple text-base">{formatCurrency(grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ── Section 3: Vendor Information ───────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={14} className="text-brand-purple" />
            <h2 className="text-sm font-semibold text-brand-text-primary">Preferred Vendor</h2>
            {req.one_time_vendor && (
              <span className="text-[10px] font-medium px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">One-time</span>
            )}
          </div>
          {vendor ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 text-sm">
              <div><p className="text-xs text-brand-text-secondary mb-0.5">Vendor Name</p><p className="font-medium text-brand-text-primary">{vendor.name}</p></div>
              {vendor.contact_person && <div><p className="text-xs text-brand-text-secondary mb-0.5">Contact Person</p><p className="font-medium text-brand-text-primary">{vendor.contact_person}</p></div>}
              {vendor.address    && <div><p className="text-xs text-brand-text-secondary mb-0.5">Address</p><p className="font-medium text-brand-text-primary">{vendor.address}</p></div>}
              {vendor.phone      && <div><p className="text-xs text-brand-text-secondary mb-0.5">Phone</p><p className="font-medium text-brand-text-primary">{vendor.phone}</p></div>}
              {vendor.email      && <div><p className="text-xs text-brand-text-secondary mb-0.5">Email</p><p className="font-medium text-brand-text-primary">{vendor.email}</p></div>}
              {vendor.bank_name  && <div><p className="text-xs text-brand-text-secondary mb-0.5">Bank</p><p className="font-medium text-brand-text-primary">{vendor.bank_name}</p></div>}
              {vendor.account_name && <div><p className="text-xs text-brand-text-secondary mb-0.5">Account Name</p><p className="font-medium text-brand-text-primary">{vendor.account_name}</p></div>}
              {vendor.account_number && <div><p className="text-xs text-brand-text-secondary mb-0.5">Account Number</p><p className="font-medium text-brand-text-primary font-mono">{vendor.account_number}</p></div>}
            </div>
          ) : (
            <p className="text-sm text-brand-text-secondary">No vendor specified for this request.</p>
          )}
        </div>

        {/* ── Supporting Document ──────────────────────────────────────────── */}
        {req.attachment_url && (
          <div className="bg-white border border-brand-border rounded-2xl p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
              <Paperclip size={16} className="text-brand-purple" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-brand-text-primary truncate">{req.attachment_name ?? "Supporting document"}</p>
              <p className="text-xs text-brand-text-secondary">Attached file</p>
            </div>
            <a href={req.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-brand-purple hover:underline shrink-0">
              <Download size={13} /> View
            </a>
          </div>
        )}

        {/* ── PO Document card (once issued) ──────────────────────────────── */}
        {hasPO && (
          <div className="bg-white border border-brand-border rounded-2xl p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
              <FileText size={16} className="text-brand-purple" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-brand-text-primary">{req.reference}.pdf</p>
              <p className="text-xs text-brand-text-secondary">
                Purchase Order · Issued {req.po_issued_at ? formatDate(req.po_issued_at) : ""}
              </p>
            </div>
            <button
              onClick={() => void generatePO(req)}
              className="flex items-center gap-1.5 text-sm font-medium text-brand-purple hover:underline shrink-0"
            >
              <Download size={13} /> Download
            </button>
          </div>
        )}

        {/* ── Approval Progress (non-approver view) ───────────────────────── */}
        {!showLineManagerPanel && !showPOPanel && (
          <div className="bg-white border border-brand-border rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-brand-text-primary mb-5">Approval Progress</h2>
            <div className="space-y-3">
              {STATUS_STEPS.map((step, idx) => {
                const isDone    = currentIdx > idx;
                const isCurrent = currentIdx === idx && req.status !== "rejected";
                const isRejected = req.status === "rejected" && idx === Math.max(0, currentIdx);
                return (
                  <div key={step.status} className="flex items-start gap-4 p-4 rounded-xl border border-brand-border">
                    <div className={`mt-0.5 flex items-center justify-center h-7 w-7 rounded-full border-2 shrink-0 ${
                      isRejected  ? "bg-red-50 border-red-400" :
                      isDone      ? "bg-green-50 border-green-500" :
                      isCurrent   ? "bg-brand-purple/10 border-brand-purple" :
                      "bg-gray-50 border-gray-200"
                    }`}>
                      {isRejected  && <XCircle size={13} className="text-red-500" />}
                      {!isRejected && isDone    && <CheckCircle size={13} className="text-green-600" />}
                      {!isRejected && isCurrent && <Clock size={13} className="text-brand-purple" />}
                      {!isRejected && !isDone && !isCurrent && <Circle size={13} className="text-gray-200" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-brand-text-primary">{step.label}</p>
                        {isDone
                          ? <span className="text-xs text-green-600">Done</span>
                          : isCurrent
                            ? <span className="text-xs text-brand-purple">In review</span>
                            : <span className="text-xs text-gray-400">Pending</span>
                        }
                      </div>
                      <p className="text-xs text-brand-text-secondary mt-0.5">{step.role}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Line Manager — Approval Decision ────────────────────────────── */}
        {showLineManagerPanel && (
          <ApprovalPanel
            reviewingAs="Operations Manager"
            onReturn={(c) => triggerAction("return", c)}
            onReject={(c) => triggerAction("reject", c)}
            onApprove={(c) => triggerAction("approve", c)}
            disabled={updateStatus.isPending}
          />
        )}

        {/* ── Procurement Officer — Issue PO ───────────────────────────────── */}
        {showPOPanel && (
          <ApprovalPanel
            title="Issue Purchase Order"
            reviewingAs="Procurement Officer"
            showReturn={false}
            approveLabel="Issue PO"
            approveIcon={<FileText size={14} />}
            approveDisabled={!paymentTerms}
            extraFields={
              <>
                <div className="rounded-xl bg-purple-50 border border-purple-200 px-4 py-3 text-sm text-purple-800">
                  Clicking <strong>Issue PO</strong> will generate and download the Purchase Order PDF. Download and send it to the vendor outside the system.
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-text-secondary mb-1.5">
                    Payment Terms <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-brand-border rounded-lg bg-white text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                  >
                    <option value="">Select payment terms…</option>
                    <option value="Net 7">Net 7</option>
                    <option value="Net 14">Net 14</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                    <option value="50% upfront, 50% on delivery">50% upfront, 50% on delivery</option>
                    <option value="Payment on delivery">Payment on delivery</option>
                    <option value="Immediate payment">Immediate payment</option>
                  </select>
                </div>
              </>
            }
            onReject={(c) => triggerAction("reject", c)}
            onApprove={(c) => triggerAction("approve", c)}
            disabled={updateStatus.isPending}
          />
        )}

      </div>

      {/* ── Confirmation modal ───────────────────────────────────────────────── */}
      {approvalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setApprovalAction(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-base font-semibold text-brand-text-primary">{approvalDialogConfig[approvalAction].title}</h3>
            <p className="text-sm text-brand-text-secondary mt-2 mb-4">{approvalDialogConfig[approvalAction].message}</p>
            {approvalAction === "approve" && req.status === "pending_procurement" && (
              <div className="rounded-xl bg-purple-50 border border-purple-200 px-4 py-3 mb-4 text-sm text-purple-800">
                <p>The PO PDF will download automatically.</p>
                {paymentTerms && <p className="mt-1">Payment Terms: <strong>{paymentTerms}</strong></p>}
              </div>
            )}
            {approvalComment && (
              <div className="bg-gray-50 border border-brand-border rounded-lg px-3 py-2 mb-4">
                <p className="text-xs text-brand-text-secondary">Your comment</p>
                <p className="text-sm text-brand-text-primary mt-0.5">{approvalComment}</p>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setApprovalAction(null)} className="px-4 py-2 text-sm font-medium text-brand-text-secondary border border-brand-border rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleApprovalConfirm}
                disabled={updateStatus.isPending}
                className={approvalDialogConfig[approvalAction].destructive
                  ? "px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                  : "px-4 py-2 text-sm font-medium text-white bg-brand-purple rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60"
                }
              >
                {updateStatus.isPending ? "Processing…" : approvalDialogConfig[approvalAction].confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

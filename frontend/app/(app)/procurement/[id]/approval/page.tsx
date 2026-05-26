"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Building2, Paperclip, Download } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalTimeline from "@/components/approval/ApprovalTimeline";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import FormTextarea from "@/components/forms/FormTextarea";
import { useApprovalActions } from "@/hooks/useApprovals";
import type { ApprovalStep } from "@/types";

const MOCK_STEPS: ApprovalStep[] = [
  {
    id: "s1", request_id: "1", step_number: 1, step_type: "individual", group_rule: null,
    status: "approved", completed_at: "2024-05-11T09:30:00Z",
    assignees: [{ id: "a1", step_id: "s1", user_id: "u1", user_name: "Chinyere Okafor (Line Manager)", decision: "approved", decided_at: "2024-05-11T09:30:00Z", comment: "Budgeted and necessary." }],
  },
  {
    id: "s2", request_id: "1", step_number: 2, step_type: "individual", group_rule: null,
    status: "in_progress", completed_at: null,
    assignees: [{ id: "a2", step_id: "s2", user_id: "u2", user_name: "Emeka Nwosu (Procurement Officer)", decision: "pending", decided_at: null, comment: null }],
  },
];

const STEP_TITLES: Record<number, string> = {
  1: "Line Manager",
  2: "Procurement Officer",
};

type PendingAction = "approve" | "reject" | "return" | null;

// Mock request data — replace with real fetch when backend is wired
const MOCK_REQUEST = {
  reference: "PRQ-20240510-A1B2",
  title: "Generator Fuel Supply — Q3 2024",
  category: "Consumables",
  priority: "Urgent",
  required_by: "1 Jul 2024",
  submitted: "10 May 2024",
  justification: "Procurement of generator fuel (AGO) for Q3 operations across Apapa and Lekki depots to ensure uninterrupted power supply during the dry season.",
  items: [
    { id: "i1", description: "Diesel fuel (AGO)", quantity: 5000, unit: "Litres", unit_cost: "₦900", total: "₦4,500,000" },
  ],
  grand_total: "₦4,500,000",
  vendor: { name: "Total Energies Nigeria", address: "Victoria Island, Lagos", phone: "+234 802 345 6789", email: "supply@totalenergies.ng" },
  attachment: null,
};

export default function ProcurementApprovalPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { approve, reject, returnToSubmitter } = useApprovalActions(id);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [comment, setComment] = useState("");

  const currentStep = MOCK_STEPS.find((s) => s.status === "in_progress");
  const currentStepTitle = currentStep ? STEP_TITLES[currentStep.step_number] : null;
  const loading = approve.isPending || reject.isPending || returnToSubmitter.isPending;

  function handleConfirm() {
    if (pendingAction === "approve") approve.mutate(comment || undefined);
    if (pendingAction === "reject") reject.mutate(comment || undefined);
    if (pendingAction === "return") returnToSubmitter.mutate(comment || undefined);
    setPendingAction(null);
    setComment("");
  }

  const dialogConfig: Record<NonNullable<PendingAction>, { title: string; message: string; confirmLabel: string; destructive: boolean }> = {
    approve: { title: "Approve Request", message: "Confirm that you are approving this procurement request.", confirmLabel: "Approve", destructive: false },
    reject:  { title: "Deny Request", message: "This will deny the request. The requester will be notified and must resubmit.", confirmLabel: "Deny Request", destructive: true },
    return:  { title: "Return to Submitter", message: "The request will be sent back to the requester for revision.", confirmLabel: "Return", destructive: false },
  };

  return (
    <AppLayout pageTitle="Procurement">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Request
      </button>

      <div className="max-w-3xl space-y-5">

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-mono text-brand-text-secondary mb-1">{MOCK_REQUEST.reference}</p>
              <h1 className="text-xl font-semibold text-brand-text-primary capitalize">{MOCK_REQUEST.category} Request</h1>
              {currentStepTitle && (
                <p className="text-sm text-brand-text-secondary mt-1">
                  Awaiting <span className="font-medium text-brand-text-primary">{currentStepTitle}</span> review
                </p>
              )}
            </div>
            <ApprovalBadge status="in_progress" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 border-t border-brand-border pt-5 text-sm">
            {[
              ["Category",    MOCK_REQUEST.category],
              ["Priority",    MOCK_REQUEST.priority],
              ["Required By", MOCK_REQUEST.required_by],
              ["Submitted",   MOCK_REQUEST.submitted],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-xs text-brand-text-secondary mb-0.5">{label}</p>
                <p className="font-medium text-brand-text-primary">{val}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-5 border-t border-brand-border text-sm">
            <p className="text-xs text-brand-text-secondary mb-1">Justification</p>
            <p className="text-brand-text-primary leading-relaxed">{MOCK_REQUEST.justification}</p>
          </div>
        </div>

        {/* ── Line Items ───────────────────────────────────────────────────── */}
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
                {MOCK_REQUEST.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3.5 text-brand-text-primary">{item.description}</td>
                    <td className="px-5 py-3.5 text-center text-brand-text-secondary">{item.quantity}</td>
                    <td className="px-5 py-3.5 text-center text-brand-text-secondary">{item.unit}</td>
                    <td className="px-5 py-3.5 text-right text-brand-text-secondary">{item.unit_cost}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-brand-text-primary">{item.total}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-brand-border bg-gray-50/60">
                  <td colSpan={4} className="px-5 py-3.5 text-sm font-semibold text-brand-text-secondary text-right">
                    Estimated Total
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-brand-purple text-base">
                    {MOCK_REQUEST.grand_total}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ── Vendor Information ───────────────────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={14} className="text-brand-purple" />
            <h2 className="text-sm font-semibold text-brand-text-primary">Vendor Information</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 text-sm">
            <div>
              <p className="text-xs text-brand-text-secondary mb-0.5">Vendor Name</p>
              <p className="font-medium text-brand-text-primary">{MOCK_REQUEST.vendor.name}</p>
            </div>
            <div>
              <p className="text-xs text-brand-text-secondary mb-0.5">Address</p>
              <p className="font-medium text-brand-text-primary">{MOCK_REQUEST.vendor.address}</p>
            </div>
            <div>
              <p className="text-xs text-brand-text-secondary mb-0.5">Phone</p>
              <p className="font-medium text-brand-text-primary">{MOCK_REQUEST.vendor.phone}</p>
            </div>
            <div>
              <p className="text-xs text-brand-text-secondary mb-0.5">Email</p>
              <p className="font-medium text-brand-text-primary">{MOCK_REQUEST.vendor.email}</p>
            </div>
          </div>
        </div>

        {/* ── Supporting Document ──────────────────────────────────────────── */}
        {MOCK_REQUEST.attachment && (
          <div className="bg-white border border-brand-border rounded-2xl p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
              <Paperclip size={16} className="text-brand-purple" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-brand-text-primary truncate">Supporting document</p>
              <p className="text-xs text-brand-text-secondary">Attached file</p>
            </div>
            <button className="flex items-center gap-1.5 text-sm font-medium text-brand-purple hover:underline shrink-0">
              <Download size={13} /> View
            </button>
          </div>
        )}

        {/* ── Approval History ─────────────────────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-brand-text-primary mb-5">Approval Progress</h2>
          <ApprovalTimeline steps={MOCK_STEPS} />
        </div>

        {/* ── Your Action (last section) ───────────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-brand-text-primary mb-1">Your Decision</h2>
          {currentStepTitle && (
            <p className="text-xs text-brand-text-secondary mb-5">
              You are reviewing as <span className="font-medium text-brand-text-primary">{currentStepTitle}</span>
            </p>
          )}

          <FormTextarea
            label="Comment (optional)"
            placeholder="Add a comment or note before submitting your decision…"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <div className="flex items-center gap-3 mt-4 justify-end">
            <button
              disabled={loading}
              onClick={() => setPendingAction("return")}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              <RotateCcw size={14} />
              Return to Submitter
            </button>
            <button
              disabled={loading}
              onClick={() => setPendingAction("reject")}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <XCircle size={14} />
              Deny Request
            </button>
            <button
              disabled={loading}
              onClick={() => setPendingAction("approve")}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-50"
            >
              <CheckCircle size={14} />
              Approve
            </button>
          </div>
        </div>

      </div>

      {/* ── Confirmation modal ───────────────────────────────────────────── */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPendingAction(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-base font-semibold text-brand-text-primary">{dialogConfig[pendingAction].title}</h3>
            <p className="text-sm text-brand-text-secondary mt-2 mb-4">{dialogConfig[pendingAction].message}</p>
            {comment && (
              <div className="bg-gray-50 border border-brand-border rounded-lg px-3 py-2 mb-4">
                <p className="text-xs text-brand-text-secondary">Your comment</p>
                <p className="text-sm text-brand-text-primary mt-0.5">{comment}</p>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setPendingAction(null)}
                className="px-4 py-2 text-sm font-medium text-brand-text-secondary border border-brand-border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={
                  dialogConfig[pendingAction].destructive
                    ? "px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    : "px-4 py-2 text-sm font-medium text-white bg-brand-purple rounded-lg hover:bg-brand-purple-dark transition-colors"
                }
              >
                {dialogConfig[pendingAction].confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

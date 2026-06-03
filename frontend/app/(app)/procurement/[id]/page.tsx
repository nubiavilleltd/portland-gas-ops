"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Download, Paperclip, AlertCircle, FileText,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import ApprovalPanel from "@/components/ui/ApprovalPanel";
import RoleBasedRecordHeader from "@/components/ui/RoleBasedRecordHeader";
import FormSection from "@/components/ui/FormSection";
import FormInput from "@/components/forms/FormInput";
import FormDatePicker from "@/components/forms/FormDatePicker";
import AuditTrail from "@/components/forms/AuditTrail";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  useUpdateProcurementStatus,
  useCancelProcurement,
  useProcurement,
  useUpdatePaymentStatus,
} from "@/hooks/useProcurement";
import { useToast } from "@/hooks/useToast";
import { formatDate, formatCurrency, capitalize } from "@/lib/utils";
import { generatePO } from "@/lib/generatePO";
import type {
  ProcurementStatus,
  ProcurementRequest,
  PaymentStatus,
  RequestAuditEntry,
} from "@/types";

// ── Types ──────────────────────────────────────────────────────────────────────

type ProcurementRole = "requester" | "line_manager" | "procurement_officer" | "finance";
type ApprovalAction  = "approve" | "reject" | "return" | null;

// ── Role options ───────────────────────────────────────────────────────────────

const ROLES: { value: ProcurementRole; label: string }[] = [
  { value: "requester",           label: "Requester" },
  { value: "line_manager",        label: "Operations Manager" },
  { value: "procurement_officer", label: "Procurement Officer" },
  { value: "finance",             label: "Finance" },
];

function getRoleLabel(role: ProcurementRole) {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

// ── Status → default role ──────────────────────────────────────────────────────

function getDefaultRole(status: ProcurementStatus): ProcurementRole {
  if (status === "pending_line_manager")  return "line_manager";
  if (status === "pending_procurement")   return "procurement_officer";
  if (status === "awaiting_payment")      return "finance";
  if (status === "awaiting_confirmation") return "procurement_officer";
  return "requester";
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

// ── Status gate notice ─────────────────────────────────────────────────────────

function StatusGateNotice({ role, req }: { role: ProcurementRole; req: ProcurementRequest }) {
  const { status, payment_status } = req;
  let message: string | null = null;

  if (role === "line_manager" && status !== "pending_line_manager") {
    if (status === "returned" || status === "rejected" || status === "completed") return null;
    message = "Operations Manager has already reviewed this request.";
  }
  if (role === "procurement_officer") {
    if (status === "pending_line_manager") {
      message = "This request is awaiting Operations Manager approval before it reaches Procurement.";
    } else if (status === "awaiting_payment") {
      message = "Awaiting payment confirmation from Finance before goods receipt can be confirmed.";
    }
  }
  if (role === "finance") {
    if (status === "pending_line_manager" || status === "pending_procurement") {
      message = "Awaiting the Procurement Officer to issue a Purchase Order.";
    } else if (status === "awaiting_confirmation") {
      message = "Payment has already been confirmed. Awaiting goods receipt confirmation from Procurement Officer.";
    }
  }

  if (!message) return null;
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      {message}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ProcurementDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const toast    = useToast();

  const { data: req, isLoading, isError } = useProcurement(id);
  const updateStatus  = useUpdateProcurementStatus(id);
  const updatePayment = useUpdatePaymentStatus(id);
  const cancelRequest = useCancelProcurement(id);

  const [currentRole,        setCurrentRole]        = useState<ProcurementRole>("requester");
  const [approvalAction,     setApprovalAction]     = useState<ApprovalAction>(null);
  const [approvalComment,    setApprovalComment]    = useState("");
  const [paymentTerms,       setPaymentTerms]       = useState("");
  const [paymentInput,       setPaymentInput]       = useState<PaymentStatus>("unpaid");
  const [receiptConfirmed,   setReceiptConfirmed]   = useState(false);

  // Sync paymentInput with actual payment status when data loads
  useEffect(() => {
    if (req) setPaymentInput(req.payment_status);
  }, [req?.payment_status]);

  function triggerAction(action: NonNullable<ApprovalAction>, comment: string) {
    setApprovalComment(comment);
    setApprovalAction(action);
  }

  function nowStr() {
    return new Date().toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  async function handleApprovalConfirm() {
    if (!req || !approvalAction) return;
    try {
      if (approvalAction === "approve") {
        const issuingPO = req.status === "pending_procurement";
        const next: ProcurementStatus = issuingPO ? "awaiting_payment" : "pending_procurement";
        const terms = issuingPO ? (paymentTerms || null) : undefined;
        const auditEntry: RequestAuditEntry = issuingPO
          ? { action: "PO Issued", actor: "Emeka Nwosu", role: "Procurement Officer", dateTime: nowStr(), comment: approvalComment || `PO issued.${paymentTerms ? ` Payment terms: ${paymentTerms}.` : ""}` }
          : { action: "Approved",  actor: "Joseph Chika",  role: "Operations Manager",  dateTime: nowStr(), comment: approvalComment || "Request approved." };
        await updateStatus.mutateAsync({ status: next, paymentTerms: terms, poIssuedBy: issuingPO ? "Emeka Nwosu" : undefined, auditEntry });
        if (issuingPO) {
          await generatePO({ ...req, status: "awaiting_payment" as ProcurementStatus, payment_terms: terms ?? null, po_issued_by: "Emeka Nwosu" });
          toast.success("PO issued and downloaded");
        } else {
          toast.success("Request approved");
        }
        setCurrentRole(getDefaultRole(next));
      } else if (approvalAction === "reject") {
        const auditEntry: RequestAuditEntry = { action: "Rejected", actor: "Joseph Chika", role: getRoleLabel(currentRole), dateTime: nowStr(), comment: approvalComment || "Request rejected." };
        await updateStatus.mutateAsync({ status: "rejected", auditEntry });
        toast.success("Request rejected");
        setCurrentRole("requester");
      } else {
        const auditEntry: RequestAuditEntry = { action: "Returned", actor: "Joseph Chika", role: "Operations Manager", dateTime: nowStr(), comment: approvalComment || "Returned to requester for revision." };
        await updateStatus.mutateAsync({ status: "returned", auditEntry });
        toast.success("Returned to requester for revision");
        setCurrentRole("requester");
      }
    } catch {
      toast.error("Failed to submit decision");
    }
    setApprovalAction(null);
    setApprovalComment("");
    setPaymentTerms("");
  }

  async function handleMarkPaid() {
    if (!req) return;
    const auditEntry: RequestAuditEntry = {
      action: paymentInput === "paid" ? "Payment Confirmed" : "Payment Partially Updated",
      actor: "Finance Team",
      role: "Finance",
      dateTime: nowStr(),
      comment: `Payment status updated to ${paymentInput.replace(/_/g, " ")}.`,
    };
    try {
      await updatePayment.mutateAsync({ paymentStatus: paymentInput, auditEntry });
      if (paymentInput === "paid") {
        await updateStatus.mutateAsync({
          status: "awaiting_confirmation",
          auditEntry: {
            action: "Awaiting Confirmation",
            actor: "Finance Team",
            role: "Finance",
            dateTime: nowStr(),
            comment: "Payment confirmed. Awaiting goods receipt confirmation from Procurement Officer.",
          },
        });
        toast.success("Payment confirmed — request moved to Awaiting Confirmation");
        setCurrentRole("procurement_officer");
      } else {
        toast.success("Payment status updated");
      }
    } catch {
      toast.error("Failed to update payment status");
    }
  }

  async function handleConfirmReceipt() {
    if (!req || !receiptConfirmed) return;
    const auditEntry: RequestAuditEntry = {
      action: "Goods Received",
      actor: "Emeka Nwosu",
      role: "Procurement Officer",
      dateTime: nowStr(),
      comment: "Goods/services confirmed as received. Request closed.",
    };
    try {
      await updateStatus.mutateAsync({ status: "completed", auditEntry });
      toast.success("Request closed — goods receipt confirmed");
      setCurrentRole("requester");
      setReceiptConfirmed(false);
    } catch {
      toast.error("Failed to confirm receipt");
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
    return <AppLayout pageTitle="Procurement"><div className="flex justify-center py-20"><LoadingSpinner /></div></AppLayout>;
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

  const grandTotal = req.items.reduce((sum, i) => sum + Number(i.total_cost), 0);
  const vendor     = req.vendor ?? req.one_time_vendor;
  const isServices = req.category === "services";
  const hasPO      = req.po_url != null || req.status === "awaiting_payment" || req.status === "completed";
  const canCancel  = req.status !== "awaiting_payment" && req.status !== "completed" && req.status !== "rejected";

  const showLineManagerPanel = currentRole === "line_manager"        && req.status === "pending_line_manager";
  const showPOPanel          = currentRole === "procurement_officer" && req.status === "pending_procurement";
  const showFinancePanel     = currentRole === "finance"             && req.status === "awaiting_payment";
  const showReceiptPanel     = currentRole === "procurement_officer" && req.status === "awaiting_confirmation";

  const statusBadge = <ApprovalBadge status={
    req.status === "pending_line_manager" || req.status === "pending_procurement"
      ? "pending" : req.status
  } />;

  return (
    <AppLayout pageTitle="Procurement">

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors"
        >
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

        {/* ── Role switcher + record header ─────────────────────────────────── */}
        <RoleBasedRecordHeader
          id={req.reference}
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          roleLabel={getRoleLabel(currentRole)}
          roles={ROLES}
          status={statusBadge}
          recordLabel="Purchase & Service Request"
          title={`${capitalize(req.category.replace(/_/g, " "))} Request`}
          nextActor={
            req.status === "pending_line_manager"  ? "Operations Manager" :
            req.status === "pending_procurement"   ? "Procurement Officer" :
            req.status === "awaiting_payment"      ? "Finance" :
            req.status === "awaiting_confirmation" ? "Procurement Officer" :
            undefined
          }
          switcherDescription="Switch roles to preview how each approver sees and acts on this request."
        />

        {/* ── Status gate notice ────────────────────────────────────────────── */}
        <StatusGateNotice role={currentRole} req={req} />

        {/* ── Requester Details ─────────────────────────────────────────────── */}
        <FormSection title="Requester Details" description="Employee information for the person who raised this request.">
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput label="Requester Name"  value={req.requester.name}       disabled />
            <FormInput label="Department"      value={req.requester.department} disabled />
            <FormInput label="Job Title / Role" value={req.requester.job_title}  disabled />
            <FormDatePicker label="Request Date" value={req.created_at.slice(0, 10)} disabled />
          </div>
        </FormSection>

        {/* ── Request Details ───────────────────────────────────────────────── */}
        <FormSection title="Request Details" description="Core information about this procurement request.">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <FormInput label="Reference"   value={req.reference}                                      disabled />
            <FormInput label="Category"    value={capitalize(req.category.replace(/_/g, " "))}        disabled />
            <FormInput label="Required By" value={formatDate(req.required_by)}                        disabled />
            {req.payment_terms && (
              <FormInput label="Payment Terms" value={req.payment_terms} disabled />
            )}
          </div>
          {req.justification && (
            <div>
              <p className="text-xs font-medium text-brand-text-secondary mb-1.5">Justification / Purpose</p>
              <p className="text-sm text-brand-text-primary leading-relaxed bg-gray-50 border border-brand-border rounded-lg px-3 py-2.5">
                {req.justification}
              </p>
            </div>
          )}
        </FormSection>

        {/* ── Line Items ────────────────────────────────────────────────────── */}
        <FormSection title={isServices ? "Service Items" : "Line Items"}>
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border bg-gray-50/60">
                  <th className="px-6 py-3 text-left   text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Description</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">{isServices ? "Duration" : "Qty"}</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Unit</th>
                  <th className="px-4 py-3 text-right  text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">{isServices ? "Rate" : "Unit Cost"}</th>
                  <th className="px-6 py-3 text-right  text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {req.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-3.5 text-brand-text-primary">{item.description}</td>
                    <td className="px-4 py-3.5 text-center text-brand-text-secondary">{item.quantity}</td>
                    <td className="px-4 py-3.5 text-center text-brand-text-secondary capitalize">{item.unit}</td>
                    <td className="px-4 py-3.5 text-right text-brand-text-secondary">{formatCurrency(Number(item.unit_cost))}</td>
                    <td className="px-6 py-3.5 text-right font-medium text-brand-text-primary">{formatCurrency(Number(item.total_cost))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-brand-border bg-gray-50/60">
                  <td colSpan={4} className="px-6 py-3.5 text-sm font-semibold text-brand-text-secondary text-right">Estimated Total</td>
                  <td className="px-6 py-3.5 text-right font-bold text-brand-purple text-base">{formatCurrency(grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </FormSection>

        {/* ── Preferred Vendor ──────────────────────────────────────────────── */}
        <FormSection
          title="Preferred Vendor"
          description={req.one_time_vendor ? "One-time vendor — not in the vendor register." : undefined}
        >
          {vendor ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <FormInput label="Vendor Name"     value={vendor.name}                  disabled />
              {vendor.contact_person && <FormInput label="Contact Person"  value={vendor.contact_person}  disabled />}
              {vendor.address        && <FormInput label="Address"          value={vendor.address}         disabled />}
              {vendor.phone          && <FormInput label="Phone"            value={vendor.phone}           disabled />}
              {vendor.email          && <FormInput label="Email"            value={vendor.email}           disabled />}
              {vendor.bank_name      && <FormInput label="Bank"             value={vendor.bank_name}       disabled />}
              {vendor.account_name   && <FormInput label="Account Name"     value={vendor.account_name}    disabled />}
              {vendor.account_number && <FormInput label="Account Number"   value={vendor.account_number}  disabled />}
            </div>
          ) : (
            <p className="text-sm text-brand-text-secondary">No vendor specified for this request.</p>
          )}
        </FormSection>

        {/* ── Supporting Document ───────────────────────────────────────────── */}
        {req.attachment_url && (
          <FormSection title="Supporting Document">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-brand-border">
              <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <Paperclip size={16} className="text-brand-purple" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brand-text-primary truncate">{req.attachment_name ?? "Supporting document"}</p>
                <p className="text-xs text-brand-text-secondary">Attached file</p>
              </div>
              <a href={req.attachment_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-brand-purple hover:underline shrink-0">
                <Download size={13} /> View
              </a>
            </div>
          </FormSection>
        )}

        {/* ── Purchase Order ────────────────────────────────────────────────── */}
        {hasPO && (
          <FormSection title="Purchase Order">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-brand-border">
              <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <FileText size={16} className="text-brand-purple" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brand-text-primary">{req.reference}.pdf</p>
                <p className="text-xs text-brand-text-secondary">
                  Purchase Order{req.po_issued_at ? ` · Issued ${formatDate(req.po_issued_at)}` : ""}
                  {req.po_issued_by ? ` by ${req.po_issued_by}` : ""}
                </p>
              </div>
              <button
                onClick={() => void generatePO(req)}
                className="flex items-center gap-1.5 text-sm font-medium text-brand-purple hover:underline shrink-0"
              >
                <Download size={13} /> Download
              </button>
            </div>
          </FormSection>
        )}


        {/* ── Operations Manager — Approval Decision ────────────────────────── */}
        {showLineManagerPanel && (
          <ApprovalPanel
            reviewingAs="Operations Manager"
            onReturn={(c) => triggerAction("return", c)}
            onReject={(c) => triggerAction("reject", c)}
            onApprove={(c) => triggerAction("approve", c)}
            disabled={updateStatus.isPending}
          />
        )}

        {/* ── Procurement Officer — Issue PO ────────────────────────────────── */}
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
                  Clicking <strong>Issue PO</strong> will generate and download the Purchase Order PDF. Send it to the vendor outside the system.
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

        {/* ── Finance — Payment Confirmation ────────────────────────────────── */}
        {showFinancePanel && (
          <FormSection
            title="Finance — Payment Confirmation"
            description="Update the payment status for this purchase order."
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <FormInput label="PO Reference"  value={req.reference}             disabled />
              <FormInput label="Payment Terms" value={req.payment_terms ?? "—"}   disabled />
              <FormInput label="Vendor"        value={vendor?.name ?? "—"}        disabled />
              <FormInput label="Amount Due"    value={formatCurrency(grandTotal)} disabled />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text-secondary mb-1.5">
                Payment Status
              </label>
              <select
                value={paymentInput}
                onChange={(e) => setPaymentInput(e.target.value as PaymentStatus)}
                className="w-52 px-3 py-2 text-sm border border-brand-border rounded-lg bg-white text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
              >
                <option value="unpaid">Unpaid</option>
                <option value="part_paid">Part Paid</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={handleMarkPaid}
                disabled={updatePayment.isPending || paymentInput === req.payment_status}
                className="px-4 py-2.5 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60"
              >
                {updatePayment.isPending ? "Updating…" : "Update Payment Status"}
              </button>
            </div>
          </FormSection>
        )}

        {/* ── Procurement Officer — Confirm Receipt ─────────────────────────── */}
        {showReceiptPanel && (
          <FormSection
            title="Confirm Goods Receipt"
            description="Confirm that the goods or services have been received before closing this request."
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <FormInput label="PO Reference"   value={req.reference}            disabled />
              <FormInput label="Payment Terms"  value={req.payment_terms ?? "—"}  disabled />
              <FormInput label="Payment Status" value="Paid"                      disabled />
            </div>
            <label className="flex items-start gap-3 p-4 rounded-xl border border-brand-border bg-gray-50 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={receiptConfirmed}
                onChange={(e) => setReceiptConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-purple focus:ring-brand-purple"
              />
              <span className="text-sm text-brand-text-primary">
                I confirm I have received the goods/services for this purchase order and the request can be closed.
              </span>
            </label>
            <div className="flex justify-end pt-1">
              <button
                onClick={handleConfirmReceipt}
                disabled={!receiptConfirmed || updateStatus.isPending}
                className="px-4 py-2.5 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60"
              >
                {updateStatus.isPending ? "Closing…" : "Close Request"}
              </button>
            </div>
          </FormSection>
        )}

        {/* ── Audit Trail ───────────────────────────────────────────────────── */}
        <AuditTrail
          items={req.auditTrail ?? []}
          description="A log of all actions taken on this request."
        />

      </div>

      {/* ── Confirmation modal ─────────────────────────────────────────────────── */}
      {approvalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setApprovalAction(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-base font-semibold text-brand-text-primary">
              {{ approve: "Approve Request", reject: "Reject Request", return: "Return to Requester" }[approvalAction]}
            </h3>
            <p className="text-sm text-brand-text-secondary mt-2 mb-4">
              {{ approve: "Confirm that you are approving this procurement request.", reject: "This will reject the request. The requester will be notified.", return: "The request will be sent back to the requester for revision." }[approvalAction]}
            </p>
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
              <button
                onClick={() => setApprovalAction(null)}
                className="px-4 py-2 text-sm font-medium text-brand-text-secondary border border-brand-border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprovalConfirm}
                disabled={updateStatus.isPending}
                className={
                  approvalAction === "reject"
                    ? "px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                    : "px-4 py-2 text-sm font-medium text-white bg-brand-purple rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60"
                }
              >
                {updateStatus.isPending ? "Processing…" : { approve: "Approve", reject: "Reject", return: "Return" }[approvalAction]}
              </button>
            </div>
          </div>
        </div>
      )}

    </AppLayout>
  );
}

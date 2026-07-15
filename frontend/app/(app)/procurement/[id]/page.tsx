"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, FileText, Download } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import ApprovalPanel from "@/components/ui/ApprovalPanel";
import FormSection from "@/components/ui/FormSection";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ProcurementDetailSkeleton from "./ProcurementDetailSkeleton";
import AuditTrail from "@/components/forms/AuditTrail";
import { getErrorMessage } from "@/lib/errors";
import { PROCUREMENT_ERRORS } from "@/lib/modules/procurement";
import {
  useProcurement,
  useApproveAndIssuePO,
  useConfirmDelivery,
  useRegeneratePOPDF,
} from "@/lib/modules/procurement";
import {
  useMyApprovals,
  useAuditTrail,
} from "@/lib/modules/workflow/queries";
import {
  useWorkflowApprove,
  useWorkflowReject,
  useWorkflowReturn,
} from "@/lib/modules/workflow/mutations";
import { useToast } from "@/hooks/useToast";
import { formatDate, formatDateTime, formatCurrency, capitalize } from "@/lib/utils";
import type { ProcurementStatus } from "@/types";

// ── Status badge colours ───────────────────────────────────────────────────────

const STATUS_LABELS: Record<ProcurementStatus, string> = {
  draft:     "Draft",
  pending:   "Pending Approval",
  approved:  "Approved",
  rejected:  "Rejected",
  returned:  "Returned",
  awaiting_confirmation: "Awaiting Confirmation",
  completed: "Completed",
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ProcurementDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const toast   = useToast();

  const { data: req, isLoading, isError } = useProcurement(id);
  const approveAndIssuePO  = useApproveAndIssuePO();
  const confirmDelivery    = useConfirmDelivery();
  const regeneratePOPDF    = useRegeneratePOPDF();

  // Workflow: check if I'm the current step's approver for this request
  const { data: myApprovals = [] } = useMyApprovals();
  const myApprovalEntry = myApprovals.find(
    (a) => a.request_type === "procurement" && a.request_id === id
  );
  const approvalRequestId = myApprovalEntry?.approval_request_id ?? null;
  // The Issue PO step is always the second-to-last step in the procurement
  // workflow (the last step is Confirm Delivery). Using total_steps from the
  // backend means this stays correct if the admin adds or removes steps.
  const isIssuePOStep =
    myApprovalEntry?.request_type === "procurement" &&
    myApprovalEntry.current_step_number === myApprovalEntry.total_steps - 1;

  // Workflow approval actions (wired to engine, not direct admin bypass)
  const workflowApprove = useWorkflowApprove();
  const workflowReject  = useWorkflowReject();
  const workflowReturn  = useWorkflowReturn();

  // Audit trail
  const { data: auditTrail = [] } = useAuditTrail("procurement", id);

  // Goods received confirmation state
  const [goodsConfirmed, setGoodsConfirmed] = useState(false);

  function raiserName() {
    if (!req?.raiser?.user) return "—";
    const { first_name, last_name } = req.raiser.user;
    return [first_name, last_name].filter(Boolean).join(" ") || req.raiser.user.email;
  }

  const grandTotal = req?.items.reduce(
    (sum, item) => sum + (Number(item.total_price) || 0),
    0
  ) ?? 0;

  async function handleAction(action: "approve" | "reject" | "return", comment: string) {
    if (!approvalRequestId) return;
    try {
      if (action === "approve") {
        await workflowApprove.mutateAsync({ approvalRequestId, comment: comment || undefined });
        toast.success("Request approved");
      } else if (action === "reject") {
        await workflowReject.mutateAsync({ approvalRequestId, comment: comment || undefined });
        toast.success("Request rejected");
      } else {
        await workflowReturn.mutateAsync({ approvalRequestId, comment: comment || undefined });
        toast.success("Returned to requester for revision");
      }
    } catch (err) {
      toast.error(getErrorMessage(err, PROCUREMENT_ERRORS));
    }
  }

  const isBusy =
    workflowApprove.isPending   ||
    workflowReject.isPending    ||
    workflowReturn.isPending    ||
    approveAndIssuePO.isPending ||
    confirmDelivery.isPending;


  if (isLoading) {
    return (
      <AppLayout pageTitle="Procurement">
        <ProcurementDetailSkeleton />
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

  return (
    <AppLayout pageTitle="Procurement">

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Back to Procurement
        </button>
      </div>

      {/* ── Header card ───────────────────────────────────────────────────────── */}
      <div className="bg-white border border-brand-border rounded-2xl px-6 py-5 mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-text-secondary mb-1">
            Purchase &amp; Service Request
          </p>
          <h1 className="text-2xl font-bold text-brand-text-primary">{req.reference}</h1>
          {req.category && (
            <p className="text-sm text-brand-text-secondary mt-0.5">
              {capitalize(req.category.replace(/_/g, " "))}
            </p>
          )}
          <p className="text-xs text-brand-text-secondary mt-1">
            {STATUS_LABELS[req.status] ?? req.status} · Raised {formatDate(req.created_at)}
          </p>
          {req.next_actor_name && (
            <p className="text-xs text-brand-text-secondary mt-1">
              Next Actor: <span className="font-medium text-brand-text-primary">{req.next_actor_name}</span>
              {req.current_step_name && <span className="text-brand-text-secondary"> · {req.current_step_name}</span>}
            </p>
          )}
        </div>
        <div className="shrink-0 pt-1 flex flex-col items-end gap-2">
          <ApprovalBadge status={req.status} />
          {req.status === "returned" && (
            <button
              onClick={() => router.push(`/procurement/new?edit=${id}`)}
              className="px-4 py-2 text-xs font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors"
            >
              Edit &amp; Resubmit
            </button>
          )}
        </div>
      </div>

      <div className="space-y-5">

        {/* ── Requester Details ─────────────────────────────────────────────── */}
        <FormSection
          title="Requester Details"
          description="Employee information for the person who raised this request."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Requester Name" value={raiserName()}                    disabled />
            <FormInput label="Department"     value={req.raiser?.department  ?? "—"} disabled />
            <FormInput label="Job Title / Role" value={req.raiser?.job_title ?? "—"} disabled />
            <FormInput label="Request Date"   value={formatDate(req.created_at)}      disabled />
          </div>
        </FormSection>

        {/* ── Request Details ───────────────────────────────────────────────── */}
        <FormSection
          title="Request Details"
          description="Core information about this procurement request."
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInput label="Reference"   value={req.reference}                                           disabled />
            <FormInput label="Category"    value={req.category ? capitalize(req.category.replace(/_/g, " ")) : "—"} disabled />
            <FormInput label="Required By" value={req.required_by ? formatDate(req.required_by) : "—"}    disabled />
            {req.estimated_amount != null && (
              <FormInput
                label="Estimated Amount"
                value={formatCurrency(Number(req.estimated_amount))}
                disabled
              />
            )}
          </div>
          {req.description && (
            <FormTextarea
              label="Justification / Purpose"
              value={req.description}
              rows={3}
              disabled
            />
          )}
        </FormSection>

        {/* ── Line Items ────────────────────────────────────────────────────── */}
        <FormSection title="Line Items">
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border bg-gray-50/60">
                  <th className="px-6 py-3 text-left   text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Description</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Qty</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Unit</th>
                  <th className="px-4 py-3 text-right  text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Unit Cost</th>
                  <th className="px-6 py-3 text-right  text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {req.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-3.5 text-brand-text-primary">{item.description}</td>
                    <td className="px-4 py-3.5 text-center text-brand-text-secondary">{item.quantity}</td>
                    <td className="px-4 py-3.5 text-center text-brand-text-secondary">{item.unit ?? "—"}</td>
                    <td className="px-4 py-3.5 text-right text-brand-text-secondary">
                      {item.unit_price != null ? formatCurrency(Number(item.unit_price)) : "—"}
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium text-brand-text-primary">
                      {item.total_price != null ? formatCurrency(Number(item.total_price)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              {grandTotal > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-brand-border bg-gray-50/60">
                    <td colSpan={4} className="px-6 py-3.5 text-sm font-semibold text-brand-text-secondary text-right">Estimated Total</td>
                    <td className="px-6 py-3.5 text-right font-bold text-brand-purple text-base">{formatCurrency(grandTotal)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </FormSection>

        {/* ── Supporting Document ───────────────────────────────────────────── */}
        {req.attachment && (
          <FormSection title="Supporting Document" description="Attachment submitted with this request.">
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border bg-gray-50/60">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Document Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Size</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-6 py-4 text-brand-text-primary font-medium">{req.attachment.name}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {req.attachment.mime_type
                          ? req.attachment.mime_type === "application/pdf" ? "PDF"
                          : req.attachment.mime_type.includes("word") ? "Word"
                          : req.attachment.mime_type.includes("excel") || req.attachment.mime_type.includes("spreadsheet") ? "Excel"
                          : req.attachment.mime_type.startsWith("image/") ? "Image"
                          : "File"
                          : "File"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-brand-text-secondary">
                      {req.attachment.file_size != null
                        ? req.attachment.file_size >= 1024 * 1024
                          ? `${(req.attachment.file_size / (1024 * 1024)).toFixed(1)} MB`
                          : `${Math.round(req.attachment.file_size / 1024)} KB`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={req.attachment.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-purple hover:underline"
                      >
                        <Download size={12} /> Open
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </FormSection>
        )}

        {/* ── Preferred Vendor ──────────────────────────────────────────────── */}
        {req.vendor && (
          <FormSection title="Preferred Vendor">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput label="Vendor Name"     value={req.vendor.name}                         disabled />
              {req.vendor.contact_person && <FormInput label="Contact Person" value={req.vendor.contact_person} disabled />}
              {req.vendor.address        && <FormInput label="Address"        value={req.vendor.address}        disabled />}
              {req.vendor.phone          && <FormInput label="Phone"          value={req.vendor.phone}          disabled />}
              {req.vendor.email          && <FormInput label="Email"          value={req.vendor.email}          disabled />}
              {req.vendor.bank_name      && <FormInput label="Bank"           value={req.vendor.bank_name}      disabled />}
              {req.vendor.account_name   && <FormInput label="Account Name"   value={req.vendor.account_name}   disabled />}
              {req.vendor.account_number && <FormInput label="Account Number" value={req.vendor.account_number} disabled />}
            </div>
          </FormSection>
        )}

        {/* ── Purchase Orders ───────────────────────────────────────────────── */}
        {req.purchase_orders.length > 0 && (
          <FormSection title="Purchase Orders">
            <div className="space-y-3">
              {req.purchase_orders.map((p) => (
                <div key={p.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-brand-border">
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-brand-purple" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-text-primary">{p.po_number}</p>
                    <p className="text-xs text-brand-text-secondary">
                      {capitalize(p.status)} · Issued {formatDate(p.issued_at)}
                      {p.vendor && ` · ${p.vendor.name}`}
                      {p.total_amount && ` · ${formatCurrency(Number(p.total_amount))}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      p.status === "issued"    ? "bg-blue-50 text-blue-700 border border-blue-200" :
                      p.status === "delivered" ? "bg-green-50 text-green-700 border border-green-200" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {capitalize(p.status)}
                    </span>
                    {p.document?.file_path ? (
                      <a
                        href={p.document.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-brand-purple hover:underline"
                      >
                        <Download size={12} /> Download PO
                      </a>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            const result = await regeneratePOPDF.mutateAsync({ requestId: id, poId: p.id });
                            const updatedPO = result.purchase_orders?.find((x) => x.id === p.id);
                            const poUrl = updatedPO?.document?.file_path;
                            if (poUrl) {
                              window.open(poUrl, "_blank", "noopener,noreferrer");
                              toast.success("PDF generated — opened in a new tab");
                            } else {
                              toast.error("PDF generation failed. Check Cloudinary configuration.");
                            }
                          } catch {
                            toast.error("Failed to generate PDF. Check Cloudinary configuration.");
                          }
                        }}
                        disabled={regeneratePOPDF.isPending}
                        className="flex items-center gap-1 text-xs text-amber-600 hover:underline disabled:opacity-50"
                      >
                        {regeneratePOPDF.isPending ? (
                          <span>Generating…</span>
                        ) : (
                          <><FileText size={12} /> Generate PDF</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </FormSection>
        )}

        {/* ── Awaiting confirmation — info banner for non-assigned viewers ─── */}
        {!approvalRequestId && req.status === "awaiting_confirmation" && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <p className="text-sm font-semibold text-blue-800">Awaiting delivery confirmation</p>
            <p className="text-xs text-blue-700 mt-0.5">
              The purchase order has been issued. The assigned officer must confirm goods received to complete this request.
            </p>
          </div>
        )}

        {/* ── Step 5: Delivery Confirmation (procurement officer assigned to step 5) ── */}
        {approvalRequestId && req.status === "awaiting_confirmation" && (
          <ApprovalPanel
            title="Goods Received Confirmation"
            description="Confirm that the goods or services have been received in full to close this request."
            showReturn={false}
            showReject={false}
            showApprove
            approveLabel="Confirm Goods Received"
            onApprove={async () => {
              if (!goodsConfirmed) {
                toast.error("Please check the confirmation box before proceeding.");
                return;
              }
              try {
                await confirmDelivery.mutateAsync(id);
                toast.success("Goods confirmed — request completed");
              } catch (err) {
                toast.error(getErrorMessage(err, PROCUREMENT_ERRORS));
              }
            }}
            approveLoading={confirmDelivery.isPending}
            disabled={isBusy}
            extraFields={
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={goodsConfirmed}
                  onChange={(e) => setGoodsConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-brand-border accent-brand-purple"
                />
                <span className="text-sm text-brand-text-primary">
                  I confirm that the goods/services for this purchase order have been received in full and are satisfactory.
                </span>
              </label>
            }
          />
        )}

        {/* ── Steps 1–4: Approval Panel ─────────────────────────────────────── */}
        {approvalRequestId && req.status === "pending" && (
          <ApprovalPanel
            title="Approval Decision"
            description="Review the request details above and make your decision."
            showReturn
            showReject
            showApprove
            returnLabel="Return for Revision"
            approveLabel={isIssuePOStep ? "Issue PO" : "Approve"}
            onReturn={(comment)  => handleAction("return",  comment)}
            onReject={(comment)  => handleAction("reject",  comment)}
            onApprove={async (comment) => {
              if (isIssuePOStep) {
                try {
                  const result = await approveAndIssuePO.mutateAsync({ id });
                  const poUrl = result.purchase_orders?.[0]?.document?.file_path;
                  if (poUrl) {
                    window.open(poUrl, "_blank", "noopener,noreferrer");
                    toast.success("PO issued — PDF opened in a new tab");
                  } else {
                    toast.success("PO issued — awaiting delivery confirmation");
                  }
                } catch (err) {
                  toast.error(getErrorMessage(err, PROCUREMENT_ERRORS));
                }
              } else {
                handleAction("approve", comment);
              }
            }}
            returnLoading={workflowReturn.isPending}
            rejectLoading={workflowReject.isPending}
            approveLoading={workflowApprove.isPending || approveAndIssuePO.isPending}
            disabled={isBusy}
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
            dateTime: formatDateTime(entry.acted_at),
            comment:  entry.comment ?? "",
          }))}
        />

      </div>


    </AppLayout>
  );
}

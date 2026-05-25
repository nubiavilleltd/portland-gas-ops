"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Paperclip, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import { formatCurrency, formatDate } from "@/lib/utils";
import ApprovalStepper from "../../_components/ApprovalStepper";
import WorkflowPath from "../../_components/WorkflowPath";
import ActivityHistory from "../../_components/ActivityHistory";
import { INVOICE_STORE, type InvoiceRequest } from "../../_components/_data";

const STATUS_STEP: Record<string, number> = {
  draft:       0,
  pending:     1,
  in_progress: 2,
  approved:    3,
  rejected:    1,
};

const ACTIONABLE = new Set(["pending", "in_progress"]);

type ActionResult = "approved" | "rejected" | "draft";

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [record, setRecord] = useState<InvoiceRequest | undefined>(
    () => INVOICE_STORE.find((r) => r.id === id)
  );
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [actionDone, setActionDone] = useState<ActionResult | null>(null);

  const currentStep = STATUS_STEP[record?.status ?? ""] ?? 0;

  function handleAction(action: ActionResult) {
    if ((action === "rejected" || action === "draft") && !comment.trim()) {
      setCommentError("A comment is required when returning or denying.");
      return;
    }
    setCommentError("");
    setRecord((prev) => (prev ? { ...prev, status: action } : prev));
    setActionDone(action);
  }

  return (
    <AppLayout pageTitle="Invoice Processing">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5"
      >
        <ArrowLeft size={16} />
        Back to Invoices
      </button>

      {!record ? (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-8 text-center max-w-lg">
          <p className="text-brand-text-primary font-semibold">Record not found</p>
          <p className="text-brand-text-secondary text-sm mt-1">
            No invoice found for ID <span className="font-mono">{id}</span>.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Header */}
          <div className="bg-brand-card border border-brand-border rounded-2xl shadow-sm">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-brand-text-secondary">{record.ref}</p>
                  <h1 className="text-lg font-semibold text-brand-text-primary mt-1">{record.title}</h1>
                </div>
                <ApprovalBadge status={record.status} className="self-start" />
              </div>
            </div>
          </div>

          {/* Requester Details */}
          <ViewSection title="Requester Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput label="Requester Name"  value={record.requester} />
              <FormInput label="Department"       value={record.department} />
              <FormInput label="Job Title / Role" value={record.jobTitle ?? "—"} />
              <FormInput label="Request Date"     value={formatDate(record.date)} />
            </div>
          </ViewSection>

          {/* Request Details */}
          <ViewSection title="Request Details">
            <div className="space-y-6">

              {/* Vendor Details sub-section */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-4">Vendor Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput label="Vendor / Supplier Name" value={record.vendor} />
                  <FormInput label="Purchase Order Number"  value={record.poNumber ?? "—"} />
                  <FormInput label="Invoice Number"         value={record.invoiceNo} />
                  <FormInput label="Invoice ID"             value={record.invoiceId ?? "—"} />
                </div>
              </div>

              {/* Invoice Details sub-section */}
              <div className="border-t border-brand-border pt-6">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-4">Invoice Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <FormInput label="Title / Purpose" value={record.title} />
                  </div>
                  <FormInput label="Currency"         value={record.currency ?? "—"} />
                  <FormInput label="Gross Amount"     value={record.grossAmount != null ? formatCurrency(record.grossAmount, record.currency) : "—"} />
                  <FormInput label="VAT / WHT Amount" value={record.taxAmount != null ? formatCurrency(record.taxAmount, record.currency) : "—"} />
                  <FormInput label="Net Payable"      value={formatCurrency(record.amount, record.currency)} />
                  <div className="sm:col-span-2">
                    <FormTextarea
                      label="Description of Goods / Services"
                      value={record.description ?? ""}
                      rows={3}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-brand-text-primary mb-2">Supporting Documents</p>
                    {record.supportingDocuments && record.supportingDocuments.length > 0 ? (
                      <ul className="space-y-2">
                        {record.supportingDocuments.map((name) => (
                          <li key={name} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-brand-border bg-gray-50">
                            <Paperclip size={14} className="text-brand-text-secondary shrink-0" />
                            <span className="text-sm text-brand-text-primary truncate">{name}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-brand-text-secondary">No documents attached.</p>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </ViewSection>

          {/* Approval Action */}
          {ACTIONABLE.has(record.status) && !actionDone && (
            <ViewSection title="Approval Action">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-brand-text-primary block mb-1">
                    Comment
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => { setComment(e.target.value); setCommentError(""); }}
                    placeholder="Add a comment..."
                    className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-text-primary placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent transition-shadow resize-none"
                  />
                  {commentError ? (
                    <p className="text-xs text-red-600 mt-1">{commentError}</p>
                  ) : (
                    <p className="text-xs text-brand-text-secondary mt-1">
                      Comment is required when returning or denying.
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAction("approved")}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    <CheckCircle2 size={15} />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction("draft")}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium border border-amber-400 text-amber-600 bg-white hover:bg-amber-50 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                  >
                    <RotateCcw size={15} />
                    Return for Revision
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction("rejected")}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium border border-red-400 text-red-600 bg-white hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                  >
                    <XCircle size={15} />
                    Deny
                  </button>
                </div>
              </div>
            </ViewSection>
          )}

          {/* Action confirmation banner */}
          {actionDone && (
            <div className={`rounded-2xl p-4 flex items-start gap-3 border ${
              actionDone === "approved"
                ? "bg-green-50 border-green-200"
                : actionDone === "rejected"
                ? "bg-red-50 border-red-200"
                : "bg-amber-50 border-amber-200"
            }`}>
              {actionDone === "approved" ? (
                <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
              ) : actionDone === "rejected" ? (
                <XCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
              ) : (
                <RotateCcw size={18} className="text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-semibold ${
                  actionDone === "approved" ? "text-green-800" :
                  actionDone === "rejected" ? "text-red-800" : "text-amber-800"
                }`}>
                  {actionDone === "approved"
                    ? "Invoice Approved"
                    : actionDone === "rejected"
                    ? "Invoice Denied"
                    : "Returned for Revision"}
                </p>
                {comment.trim() && (
                  <p className={`text-xs mt-0.5 ${
                    actionDone === "approved" ? "text-green-700" :
                    actionDone === "rejected" ? "text-red-700" : "text-amber-700"
                  }`}>
                    Comment: {comment}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Workflow */}
          <ApprovalStepper currentStep={currentStep} />
          <WorkflowPath
            initiator={record.requester}
            department={record.department}
            currentStep={currentStep}
          />
          <ActivityHistory
            initiator={record.requester}
            department={record.department}
            submittedAt={new Date(record.date)}
          />
        </div>
      )}
    </AppLayout>
  );
}

function ViewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-5">
        {title}
      </p>
      {children}
    </div>
  );
}

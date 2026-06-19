"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Paperclip, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import RoleBasedRecordHeader from "@/components/ui/RoleBasedRecordHeader";
import ApprovalPanel from "@/components/ui/ApprovalPanel";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import { formatCurrency, formatDate } from "@/lib/utils";
import AuditTrail from "@/components/forms/AuditTrail";
import { useToast } from "@/hooks/useToast";
import { INVOICE_STORE, type InvoiceRequest } from "../../_components/_data";

const STATUS_STEP: Record<string, number> = {
  draft:       0,
  pending:     1,
  in_progress: 2,
  approved:    3,
  denied:      1,
};

const ACTIONABLE = new Set(["pending", "in_progress"]);

type ActionResult = "approved" | "denied" | "draft";
type PageRole = "requester" | "approver" | "admin";

const ROLE_OPTIONS: { value: PageRole; label: string }[] = [
  { value: "requester", label: "Requester" },
  { value: "approver", label: "Operations Manager/Finance" },
];

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
  const [actionDone, setActionDone] = useState<ActionResult | null>(null);
  const [actionComment, setActionComment] = useState<string>("");
  const [currentRole, setCurrentRole] = useState<PageRole>("requester");
  const toast = useToast();

  function handleApprovalAction(action: ActionResult, comment: string) {
    setRecord((prev) => (prev ? { ...prev, status: action } : prev));
    setActionDone(action);
    setActionComment(comment);
    if (action === "approved") toast.success("Invoice approved successfully");
    else if (action === "denied") toast.error("Invoice denied");
    else toast.info("Invoice returned to requester");
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
          <RoleBasedRecordHeader
            id={record.ref}
            currentRole={currentRole}
            onRoleChange={setCurrentRole}
            roleLabel={currentRole === "approver" ? "Operations Manager/Finance" : currentRole === "admin" ? "Admin" : "Requester"}
            roles={ROLE_OPTIONS}
            status={<ApprovalBadge status={record.status} />}
            recordLabel="Invoice"
            title={record.title}
          />

          {/* Requester Details */}
          <ViewSection title="Requester Details" description="Your employee information for this invoice request.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput label="Requester Name"  value={record.requester} />
              <FormInput label="Department"       value={record.department} />
              <FormInput label="Job Title / Role" value={record.jobTitle ?? "—"} />
              <FormInput label="Request Date"     value={formatDate(record.date)} />
            </div>
          </ViewSection>

          {/* Request Details */}
          <ViewSection title="Request Details" description="Vendor and invoice details for this payment request.">
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
          {ACTIONABLE.has(record.status) && !actionDone && currentRole !== "requester" && (
            <ApprovalPanel
              reviewingAs={currentRole === "approver" ? "Operations Manager/Finance" : "Requester"}
              showReturn
              showReject
              showApprove
              returnLabel="Return"
              rejectLabel="Deny"
              approveLabel="Approve"
              requireCommentForRejectReturn
              onReturn={(comment) => handleApprovalAction("draft", comment)}
              onReject={(comment) => handleApprovalAction("denied", comment)}
              onApprove={(comment) => handleApprovalAction("approved", comment)}
            />
          )}

          {/* Action confirmation banner */}
          {actionDone && (
            <div className={`rounded-2xl p-4 flex items-start gap-3 border ${
              actionDone === "approved"
                ? "bg-green-50 border-green-200"
                : actionDone === "denied"
                ? "bg-red-50 border-red-200"
                : "bg-amber-50 border-amber-200"
            }`}>
              {actionDone === "approved" ? (
                <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
              ) : actionDone === "denied" ? (
                <XCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
              ) : (
                <RotateCcw size={18} className="text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-semibold ${
                  actionDone === "approved" ? "text-green-800" :
                  actionDone === "denied" ? "text-red-800" : "text-amber-800"
                }`}>
                  {actionDone === "approved"
                    ? "Invoice Approved"
                    : actionDone === "denied"
                    ? "Invoice Denied"
                    : "Returned"}
                </p>
                {actionComment.trim() && (
                  <p className={`text-xs mt-0.5 ${
                    actionDone === "approved" ? "text-green-700" :
                    actionDone === "denied" ? "text-red-700" : "text-amber-700"
                  }`}>
                    Comment: {actionComment}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Activity */}
          <AuditTrail
            items={[
              {
                action: "Submitted",
                actor: record.requester,
                role: "Requester",
                dateTime: formatDate(record.date),
                comment: "Request submitted",
              },
            ]}
          />
        </div>
      )}
    </AppLayout>
  );
}

function ViewSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl shadow-sm">
      <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-6 py-4">
        <h2 className="text-base font-semibold text-brand-text-primary">{title}</h2>
        {description && (
          <p className="text-sm text-brand-text-secondary mt-0.5">{description}</p>
        )}
      </div>
      <div className="px-6 pt-5 pb-6">
        {children}
      </div>
    </div>
  );
}

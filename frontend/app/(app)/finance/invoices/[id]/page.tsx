"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Paperclip, CheckCircle2, XCircle, RotateCcw, ExternalLink } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import RoleBasedRecordHeader from "@/components/ui/RoleBasedRecordHeader";
import ApprovalPanel from "@/components/ui/ApprovalPanel";
import Button from "@/components/ui/Button";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import FormSelect from "@/components/forms/FormSelect";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import AuditTrail from "@/components/forms/AuditTrail";
import { useToast } from "@/hooks/useToast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMyApprovals, useAuditTrail } from "@/lib/modules/workflow/queries";
import { useWorkflowApprove, useWorkflowReject, useWorkflowReturn } from "@/lib/modules/workflow/mutations";
import { useInvoice, usePoOptions, useVendorOptions } from "@/lib/modules/invoices-processing/hooks";
import invoicesApi from "@/lib/modules/invoices-processing/api";
import { CURRENCY_OPTIONS } from "../../_components/_data";

const WORKFLOW_STEPS = [
  { step: 1, name: "Operations Manager" },
  { step: 2, name: "Finance Manager" },
];

const AUDIT_ACTION_LABELS: Record<string, string> = {
  submitted: "Submitted", approved: "Approved", rejected: "Rejected", returned: "Returned",
};

type PageRole = "requester" | "approver";
const ROLE_OPTIONS: { value: PageRole; label: string }[] = [
  { value: "requester", label: "Requester" },
  { value: "approver",  label: "Operations Manager/Finance" },
];

type ResubmitForm = {
  invoice_number: string;
  title: string;
  description: string;
  vendor: string;
  po_number: string;
  gross_amount: string;
  tax_amount: string;
  amount: string;
  currency: string;
};

function errMsg(err: unknown): string {
  return (
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
    (err instanceof Error ? err.message : "Something went wrong")
  );
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: apiRecord, isLoading } = useInvoice(id);
  const { user: currentUser } = useCurrentUser();
  const { data: myApprovals = [] } = useMyApprovals();
  const { data: auditEntries = [] } = useAuditTrail("invoice", apiRecord?.id ?? "");
  const queryClient = useQueryClient();
  const toast = useToast();

  const approveMut = useWorkflowApprove();
  const rejectMut = useWorkflowReject();
  const returnMut = useWorkflowReturn();
  const isBusy = approveMut.isPending || rejectMut.isPending || returnMut.isPending;

  const status = (apiRecord?.status || "").toLowerCase();

  const myApproval = apiRecord
    ? myApprovals.find((a) => a.request_type === "invoice" && a.request_id === apiRecord.id)
    : undefined;
  const canActNow = Boolean(myApproval);
  const currentStepName = WORKFLOW_STEPS.find((s) => s.step === myApproval?.current_step_number)?.name ?? "Approver";

  const isRequester = apiRecord && currentUser ? apiRecord.requester_id === currentUser.id : false;
  const canResubmit = isRequester && status === "returned";

  const viewingAsLabel = canActNow ? currentStepName : isRequester ? "Requester" : "Viewer";
  const currentRole: PageRole = canActNow ? "approver" : "requester";

  const terminalStatus: "approved" | "denied" | "returned" | null =
    status === "approved" ? "approved" : status === "denied" ? "denied" : status === "returned" ? "returned" : null;

  async function handleAction(action: "approve" | "reject" | "return", comment: string) {
    const approvalRequestId = myApproval?.approval_request_id ?? apiRecord?.approval_request_id;
    if (!approvalRequestId) {
      toast.error("Cannot process approval: request not in workflow");
      return;
    }
    try {
      const args = { approvalRequestId, comment: comment || undefined };
      if (action === "approve") await approveMut.mutateAsync(args);
      else if (action === "reject") await rejectMut.mutateAsync(args);
      else await returnMut.mutateAsync(args);
      queryClient.invalidateQueries({ queryKey: ["invoices-processing"] });
      toast.success(
        action === "approve" ? "Invoice approved" : action === "reject" ? "Invoice rejected" : "Returned to requester"
      );
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  // ── Inline edit & resubmit (returned invoice) ─────────────────────────────
  const [resubmitFiles, setResubmitFiles] = useState<File[]>([]);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const resubmitForm = useForm<ResubmitForm>();
  const rWatch = resubmitForm.watch;
  const { data: vendors = [] } = useVendorOptions();
  const { data: poOptions = [] } = usePoOptions();
  const vendorOptions = vendors.map((v) => ({ value: v.name, label: v.name }));
  const poOptionsList = poOptions.map((p) => ({ value: p.reference, label: p.reference }));

  useEffect(() => {
    if (canResubmit && apiRecord) {
      resubmitForm.reset({
        invoice_number: apiRecord.invoice_number || "",
        title: apiRecord.title || "",
        description: apiRecord.description || "",
        vendor: apiRecord.vendor || "",
        po_number: apiRecord.po_number || "",
        gross_amount: String(apiRecord.gross_amount ?? ""),
        tax_amount: String(apiRecord.tax_amount ?? ""),
        amount: String(apiRecord.amount ?? ""),
        currency: apiRecord.currency || "NGN",
      });
      setResubmitFiles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canResubmit, apiRecord?.id]);

  async function handleResubmit(data: ResubmitForm) {
    const amount = parseFloat(String(data.amount).replace(/,/g, ""));
    if (!amount || amount <= 0) {
      toast.error("Enter a valid net amount");
      return;
    }
    setIsResubmitting(true);
    try {
      const updated = await invoicesApi.resubmit(id, {
        invoice_number: data.invoice_number || undefined,
        title: data.title,
        description: data.description,
        vendor: data.vendor,
        po_number: data.po_number || undefined,
        gross_amount: parseFloat(String(data.gross_amount).replace(/,/g, "")) || 0,
        tax_amount: parseFloat(String(data.tax_amount).replace(/,/g, "")) || 0,
        amount,
        currency: data.currency,
      });
      if (resubmitFiles.length > 0 && updated?.id) {
        for (const file of resubmitFiles) {
          try {
            await invoicesApi.uploadDocument(updated.id, file);
          } catch {
            toast.info(`Could not upload ${file.name}. Invoice was still resubmitted.`);
          }
        }
      }
      toast.success("Invoice resubmitted for approval!");
      queryClient.invalidateQueries({ queryKey: ["invoices-processing"] });
      queryClient.invalidateQueries({ queryKey: ["my-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["audit-trail"] });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setIsResubmitting(false);
    }
  }

  return (
    <AppLayout pageTitle="Invoice">
      <Link
        href="/finance/invoices"
        className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5"
      >
        <ArrowLeft size={16} />
        Back to Invoice Processing
      </Link>

      {!apiRecord ? (
        isLoading ? (
          <InvoiceDetailSkeleton />
        ) : (
          <div className="bg-brand-card border border-brand-border rounded-2xl p-8 text-center max-w-lg">
            <p className="text-brand-text-primary font-semibold">Record not found</p>
            <p className="text-brand-text-secondary text-sm mt-1">
              No invoice found for <span className="font-mono">{id}</span>.
            </p>
          </div>
        )
      ) : (
        <div className="space-y-5">
          <RoleBasedRecordHeader
            id={apiRecord.reference}
            showCurrentAccess={false}
            currentRole={currentRole}
            onRoleChange={() => undefined}
            roleLabel={viewingAsLabel}
            roles={ROLE_OPTIONS}
            status={<ApprovalBadge status={status === "in_progress" ? "pending" : status} />}
            recordLabel="Invoice"
            title={apiRecord.title}
            nextApproverName={
              status === "returned" ? (apiRecord.requester_name ?? undefined) : (apiRecord.next_actor_name ?? undefined)
            }
            nextApproverRole={status === "returned" ? "Requester" : (apiRecord.current_step_name ?? undefined)}
            showRoleSwitcher={false}
          />


          {canResubmit && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
              <RotateCcw size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">This invoice was returned to you</p>
                <p className="text-xs text-amber-700 mt-0.5">Review the details, make the necessary changes below, and resubmit for approval.</p>
              </div>
            </div>
          )}

          <ViewSection title="Requester Details" description="Employee information for this invoice.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput label="Requester Name"  value={apiRecord.requester_name ?? "—"} />
              <FormInput label="Department"       value={apiRecord.department ?? "—"} />
              <FormInput label="Job Title / Role" value={apiRecord.requester_job_title ?? "—"} />
              <FormInput label="Request Date"     value={formatDateTime(apiRecord.created_at)} />
            </div>
          </ViewSection>

          {canResubmit ? (
            <ViewSection title="Invoice Details" description="Update the details and resubmit for approval.">
              <form onSubmit={resubmitForm.handleSubmit(handleResubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormSelect
                    label="Vendor / Supplier Name" required options={vendorOptions} sortOptions={false}
                    placeholder="Select vendor" {...resubmitForm.register("vendor")} value={rWatch("vendor") ?? ""}
                  />
                  <FormSelect
                    label="Purchase Order Number" options={poOptionsList} sortOptions={false}
                    placeholder="Select PO (optional)" {...resubmitForm.register("po_number")} value={rWatch("po_number") ?? ""}
                  />
                  <FormInput label="Invoice Number" {...resubmitForm.register("invoice_number")} />
                  <div className="sm:col-span-2">
                    <FormInput label="Title / Purpose" required {...resubmitForm.register("title")} />
                  </div>
                  <FormSelect
                    label="Currency" required options={CURRENCY_OPTIONS} sortOptions={false}
                    placeholder="Select currency" {...resubmitForm.register("currency")} value={rWatch("currency") ?? ""}
                  />
                  <FormInput label="Gross Amount" {...resubmitForm.register("gross_amount")} />
                  <FormInput label="VAT / WHT Amount" {...resubmitForm.register("tax_amount")} />
                  <FormInput label="Net Payable" required placeholder="0.00" {...resubmitForm.register("amount")} />
                  <div className="sm:col-span-2">
                    <FormTextarea label="Description of Goods / Services" rows={3} {...resubmitForm.register("description")} />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <Button type="submit" loading={isResubmitting} loadingText="Resubmitting...">
                    Resubmit for Approval
                  </Button>
                </div>
              </form>
            </ViewSection>
          ) : (
            <ViewSection title="Invoice Details" description="Vendor and invoice details.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput label="Vendor / Supplier"  value={apiRecord.vendor ?? "—"} />
                <FormInput label="Invoice Number"      value={apiRecord.invoice_number ?? "—"} />
                <FormInput label="Invoice ID"          value={apiRecord.invoice_id ?? "—"} />
                <FormInput label="Purchase Order"      value={apiRecord.po_number ?? "—"} />
                <FormInput label="Currency"            value={apiRecord.currency ?? "—"} />
                <FormInput label="Gross Amount"        value={formatCurrency(Number(apiRecord.gross_amount ?? 0))} />
                <FormInput label="VAT / WHT"           value={formatCurrency(Number(apiRecord.tax_amount ?? 0))} />
                <FormInput label="Net Payable"         value={formatCurrency(Number(apiRecord.amount))} />
                <div className="sm:col-span-2">
                  <FormTextarea label="Description of Goods / Services" value={apiRecord.description ?? ""} rows={3} />
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-brand-text-primary mb-2">Supporting Documents</p>
                  {apiRecord.document ? (
                    <a
                      href={apiRecord.document.file_path || "#"}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-brand-border bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                      <Paperclip size={14} className="text-brand-text-secondary shrink-0" />
                      <span className="text-sm text-brand-text-primary truncate group-hover:text-brand-purple">{apiRecord.document.name}</span>
                      <ExternalLink size={14} className="text-brand-text-secondary shrink-0 ml-auto group-hover:text-brand-purple" />
                    </a>
                  ) : (
                    <p className="text-sm text-brand-text-secondary px-3 py-2.5 rounded-lg border border-brand-border bg-gray-50">
                      No documents attached
                    </p>
                  )}
                </div>
              </div>
            </ViewSection>
          )}

          {canActNow && (
            <ApprovalPanel
              reviewingAs={currentStepName}
              showReturn showReject showApprove
              returnLabel="Return" rejectLabel="Reject" approveLabel="Approve"
              requireCommentForRejectReturn
              disabled={isBusy}
              onReturn={(comment) => handleAction("return", comment)}
              onReject={(comment) => handleAction("reject", comment)}
              onApprove={(comment) => handleAction("approve", comment)}
            />
          )}

          {terminalStatus && (
            <div className={`rounded-2xl p-4 flex items-start gap-3 border ${
              terminalStatus === "approved" ? "bg-green-50 border-green-200"
              : terminalStatus === "denied" ? "bg-red-50 border-red-200"
              : "bg-amber-50 border-amber-200"
            }`}>
              {terminalStatus === "approved" ? (
                <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
              ) : terminalStatus === "denied" ? (
                <XCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
              ) : (
                <RotateCcw size={18} className="text-amber-600 shrink-0 mt-0.5" />
              )}
              <p className={`text-sm font-semibold ${
                terminalStatus === "approved" ? "text-green-800"
                : terminalStatus === "denied" ? "text-red-800"
                : "text-amber-800"
              }`}>
                {terminalStatus === "approved" ? "Invoice Approved"
                  : terminalStatus === "denied" ? "Invoice Rejected"
                  : "Returned to Requester"}
              </p>
            </div>
          )}

          <AuditTrail
            items={auditEntries.map((entry) => ({
              action: AUDIT_ACTION_LABELS[entry.action] ?? entry.action,
              actor: entry.actor_name ?? "—",
              role: entry.actor_role ?? "—",
              dateTime: formatDateTime(entry.acted_at),
              comment: entry.comment?.trim() || "—",
            }))}
            emptyMessage="No workflow actions recorded yet."
          />
        </div>
      )}
    </AppLayout>
  );
}

function InvoiceDetailSkeleton() {
  return (
    <div className="w-full space-y-5 animate-pulse">
      <div className="rounded-2xl border border-brand-border bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-gray-100" />
            <div className="h-5 w-40 rounded bg-gray-200" />
            <div className="h-3 w-56 rounded bg-gray-100" />
          </div>
          <div className="h-6 w-20 rounded-full bg-gray-100" />
        </div>
      </div>
      <div className="rounded-2xl border border-brand-border bg-white p-4">
        <div className="h-3 w-2/3 rounded bg-gray-100" />
      </div>
      {Array.from({ length: 2 }).map((_, sectionIndex) => (
        <section key={sectionIndex} className="overflow-hidden rounded-2xl border border-brand-border bg-white">
          <div className="border-b border-brand-border bg-gray-50 px-5 py-4 md:px-6">
            <div className="h-4 w-44 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-2/3 rounded bg-gray-100" />
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
            {Array.from({ length: sectionIndex === 0 ? 4 : 8 }).map((__, fieldIndex) => (
              <div key={fieldIndex}>
                <div className="mb-2 h-3 w-32 rounded bg-gray-200" />
                <div className="h-11 rounded-xl bg-gray-100" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
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

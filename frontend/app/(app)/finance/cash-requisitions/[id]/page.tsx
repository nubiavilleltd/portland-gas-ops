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
// import FormDatePicker from "@/components/forms/FormDatePicker"; // hidden with Expected Retirement
import { formatCurrency, formatDateTime } from "@/lib/utils"; // formatDate: re-add with Expected Retirement
import AuditTrail from "@/components/forms/AuditTrail";
import { useToast } from "@/hooks/useToast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMyApprovals, useAuditTrail } from "@/lib/modules/workflow/queries";
import { useWorkflowApprove, useWorkflowReject, useWorkflowReturn } from "@/lib/modules/workflow/mutations";
import { useCashRequisition } from "@/lib/modules/cash-requisitions/hooks";
import cashRequisitionsApi from "@/lib/modules/cash-requisitions/api";
import { CURRENCY_OPTIONS } from "../../_components/_data";

// const TODAY = new Date().toISOString().split("T")[0]; // hidden with Expected Retirement

const WORKFLOW_STEPS = [
  { step: 1, name: "Operations Manager" },
  { step: 2, name: "Finance Manager" },
];

const AUDIT_ACTION_LABELS: Record<string, string> = {
  submitted: "Submitted",
  approved:  "Approved",
  rejected:  "Denied",
  returned:  "Returned",
};

type PageRole = "requester" | "approver";
const ROLE_OPTIONS: { value: PageRole; label: string }[] = [
  { value: "requester", label: "Requester" },
  { value: "approver",  label: "Operations Manager/Finance" },
];

type ResubmitForm = {
  title: string;
  description: string;
  amount: string;
  currency: string;
  expected_retirement: string;
};

function errMsg(err: unknown): string {
  return (
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
    (err instanceof Error ? err.message : "Something went wrong")
  );
}

export default function CashRequisitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: apiRecord, isLoading } = useCashRequisition(id);
  const { user: currentUser } = useCurrentUser();
  const { data: myApprovals = [], isLoading: isApprovalsLoading } = useMyApprovals();
  const { data: auditEntries = [] } = useAuditTrail("cash_requisition", apiRecord?.id ?? "");
  const queryClient = useQueryClient();
  const toast = useToast();

  const approveMut = useWorkflowApprove();
  const rejectMut = useWorkflowReject();
  const returnMut = useWorkflowReturn();
  const isBusy = approveMut.isPending || rejectMut.isPending || returnMut.isPending;

  const status = (apiRecord?.status || "").toLowerCase();

  // Source of truth for "can I act now": my-approvals returns this request only if
  // the logged-in user is the assignee of the CURRENT step.
  const myApproval = apiRecord
    ? myApprovals.find((a) => a.request_type === "cash_requisition" && a.request_id === apiRecord.id)
    : undefined;
  const canActNow = Boolean(myApproval);
  const currentStepName =
    WORKFLOW_STEPS.find((s) => s.step === myApproval?.current_step_number)?.name ?? "Approver";

  // requester_id stores the User id.
  const isRequester = apiRecord && currentUser ? apiRecord.requester_id === currentUser.id : false;
  const canResubmit = isRequester && status === "returned";
  const hasWorkflowAccess = canActNow || isRequester;

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
      // Generic mutations don't invalidate cash-requisitions — refresh this record.
      queryClient.invalidateQueries({ queryKey: ["cash-requisitions"] });
      toast.success(
        action === "approve" ? "Request approved" : action === "reject" ? "Request denied" : "Returned to requester"
      );
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  // ── Inline edit & resubmit (returned request) ─────────────────────────────
  const [resubmitFiles, setResubmitFiles] = useState<File[]>([]);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const resubmitForm = useForm<ResubmitForm>();
  const rWatch = resubmitForm.watch;

  useEffect(() => {
    if (canResubmit && apiRecord) {
      resubmitForm.reset({
        title: apiRecord.title || "",
        description: apiRecord.description || "",
        amount: String(apiRecord.amount ?? ""),
        currency: apiRecord.currency || "NGN",
        expected_retirement: apiRecord.expected_retirement || "",
      });
      setResubmitFiles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canResubmit, apiRecord?.id]);

  async function handleResubmit(data: ResubmitForm) {
    const amount = parseFloat(String(data.amount).replace(/,/g, ""));
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setIsResubmitting(true);
    try {
      const updated = await cashRequisitionsApi.resubmit(id, {
        title: data.title,
        description: data.description,
        amount,
        currency: data.currency,
        expected_retirement: data.expected_retirement || undefined,
      });
      if (resubmitFiles.length > 0 && updated?.id) {
        for (const file of resubmitFiles) {
          try {
            await cashRequisitionsApi.uploadDocument(updated.id, file);
          } catch {
            toast.info(`Could not upload ${file.name}. Request was still resubmitted.`);
          }
        }
      }
      toast.success("Request resubmitted for approval!");
      queryClient.invalidateQueries({ queryKey: ["cash-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["my-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["audit-trail"] });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setIsResubmitting(false);
    }
  }

  return (
    <AppLayout pageTitle="Cash Requisition">
      <Link
        href="/finance/cash-requisitions"
        className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5"
      >
        <ArrowLeft size={16} />
        Back to Cash Requisitions
      </Link>

      {!apiRecord ? (
        isLoading ? (
          <CashRequisitionDetailSkeleton />
        ) : (
          <div className="bg-brand-card border border-brand-border rounded-2xl p-8 text-center max-w-lg">
            <p className="text-brand-text-primary font-semibold">Record not found</p>
            <p className="text-brand-text-secondary text-sm mt-1">
              No cash requisition found for <span className="font-mono">{id}</span>.
            </p>
          </div>
        )
      ) : (
        <div className="space-y-5">
          {/* Header */}
          <RoleBasedRecordHeader
            id={apiRecord.reference}
            showCurrentAccess={false}
            currentRole={currentRole}
            onRoleChange={() => undefined}
            roleLabel={viewingAsLabel}
            roles={ROLE_OPTIONS}
            status={<ApprovalBadge status={status} />}
            recordLabel="Cash Requisition"
            title={apiRecord.title}
            nextApproverName={
              status === "returned"
                ? (apiRecord.requester_name ?? undefined)
                : (apiRecord.next_actor_name ?? undefined)
            }
            nextApproverRole={
              status === "returned" ? "Requester" : (apiRecord.current_step_name ?? undefined)
            }
            showRoleSwitcher={false}
          />

          {/* Access note */}
          {status !== "approved" && status !== "denied" && (
            <div className="rounded-2xl border border-brand-border bg-brand-card p-4">
              {isApprovalsLoading ? (
                <div className="h-4 w-1/2 rounded bg-gray-100 animate-pulse" />
              ) : (
                <p className="text-sm text-brand-text-secondary">
                  {canActNow
                    ? `You are the current approver for this request (${currentStepName}). Review and make your decision below.`
                    : hasWorkflowAccess
                    ? `Viewing as ${viewingAsLabel}`
                    : "You do not have direct access to this request."}
                </p>
              )}
            </div>
          )}

          {/* Returned — requester edits inline and resubmits */}
          {canResubmit && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
              <RotateCcw size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">This request was returned to you</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Review the details, make the necessary changes below, and resubmit for approval.
                </p>
              </div>
            </div>
          )}

          {/* Requester Details */}
          <ViewSection title="Requester Details" description="Employee information for this cash requisition.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput label="Requester Name"  value={apiRecord.requester_name ?? "—"} />
              <FormInput label="Department"       value={apiRecord.department ?? "—"} />
              <FormInput label="Job Title / Role" value={apiRecord.requester_job_title ?? "—"} />
              <FormInput label="Request Date"     value={formatDateTime(apiRecord.created_at)} />
            </div>
          </ViewSection>

          {/* Request Details — editable inline when returned to the requester */}
          {canResubmit ? (
            <ViewSection title="Request Details" description="Update the details and resubmit for approval.">
              <form onSubmit={resubmitForm.handleSubmit(handleResubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput label="Title / Purpose" required {...resubmitForm.register("title")} />
                  <FormSelect
                    label="Currency" required options={CURRENCY_OPTIONS} sortOptions={false}
                    placeholder="Select currency"
                    {...resubmitForm.register("currency")} value={rWatch("currency") ?? ""}
                  />
                  <FormInput label="Amount Requested" required placeholder="0.00" {...resubmitForm.register("amount")} />
                  {/* Expected Retirement Date — hidden for now
                  <FormDatePicker
                    label="Expected Retirement Date" min={TODAY}
                    {...resubmitForm.register("expected_retirement")} value={rWatch("expected_retirement") ?? ""}
                  /> */}
                  <div className="sm:col-span-2">
                    <FormTextarea label="Description / Justification" rows={4} {...resubmitForm.register("description")} />
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
            <ViewSection title="Request Details" description="Details about the cash being requested.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput label="Title / Purpose"   value={apiRecord.title} />
                <FormInput label="Currency"          value={apiRecord.currency ?? "—"} />
                <FormInput label="Amount Requested"  value={formatCurrency(Number(apiRecord.amount))} />
                {/* Expected Retirement — hidden for now
                <FormInput label="Expected Retirement" value={apiRecord.expected_retirement ? formatDate(apiRecord.expected_retirement) : "—"} /> */}
                <div className="sm:col-span-2">
                  <FormTextarea label="Description / Justification" value={apiRecord.description ?? ""} rows={4} />
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-brand-text-primary mb-2">Supporting Documents</p>
                  {apiRecord.document ? (
                    <a
                      href={apiRecord.document.file_path || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
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

          {/* Approval panel — only when the logged-in user is the current step's assignee */}
          {canActNow && (
            <ApprovalPanel
              reviewingAs={currentStepName}
              showReturn
              showReject
              showApprove
              returnLabel="Return"
              rejectLabel="Deny"
              approveLabel="Approve"
              requireCommentForRejectReturn
              disabled={isBusy}
              onReturn={(comment) => handleAction("return", comment)}
              onReject={(comment) => handleAction("reject", comment)}
              onApprove={(comment) => handleAction("approve", comment)}
            />
          )}

          {/* Terminal banner */}
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
                {terminalStatus === "approved" ? "Request Approved"
                  : terminalStatus === "denied" ? "Request Denied"
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

function CashRequisitionDetailSkeleton() {
  return (
    <div className="w-full space-y-5 animate-pulse">
      {/* Header card */}
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

      {/* Access note */}
      <div className="rounded-2xl border border-brand-border bg-white p-4">
        <div className="h-3 w-2/3 rounded bg-gray-100" />
      </div>

      {/* Detail sections */}
      {Array.from({ length: 2 }).map((_, sectionIndex) => (
        <section
          key={sectionIndex}
          className="overflow-hidden rounded-2xl border border-brand-border bg-white"
        >
          <div className="border-b border-brand-border bg-gray-50 px-5 py-4 md:px-6">
            <div className="h-4 w-44 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-2/3 rounded bg-gray-100" />
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
            {Array.from({ length: sectionIndex === 0 ? 4 : 6 }).map((__, fieldIndex) => (
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

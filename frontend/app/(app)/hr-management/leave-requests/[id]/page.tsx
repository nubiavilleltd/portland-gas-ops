"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Paperclip, CheckCircle2, XCircle, RotateCcw, ExternalLink, Trash2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import RoleBasedRecordHeader from "@/components/ui/RoleBasedRecordHeader";
import ApprovalPanel from "@/components/ui/ApprovalPanel";
import Button from "@/components/ui/Button";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import FormSelect from "@/components/forms/FormSelect";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FileDropzone from "@/components/ui/FileDropzone";
import { formatDate, formatDateTime } from "@/lib/utils";
import AuditTrail from "@/components/forms/AuditTrail";
import { useToast } from "@/hooks/useToast";
import { useLeaveRequest, useCurrentEmployee, useApproveLeaveRequest } from "@/lib/modules/leave-requests/hooks";
import { useLeaveTypes } from "@/lib/modules/leave-types/hooks";
import { useEmployees } from "@/lib/modules/employees/hooks";
import leaveRequestsApi from "@/lib/modules/leave-requests/api";
import { useMyApprovals, useAuditTrail } from "@/lib/modules/workflow/queries";
import LeaveRequestDetailSkeleton from "../_components/LeaveRequestDetailSkeleton";
import { LEAVE_STORE, type LeaveRequest } from "../../_components/_data";

type ResubmitForm = {
  request_type: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reliever_id: string;
  reason: string;
};

const CURRENT_USER = {
  name: "Joseph Chika",
  department: "Operations",
  title: "Operations Manager",
};

const STATUS_STEP: Record<string, number> = {
  draft:       0,
  pending:     1,
  in_progress: 2,
  approved:    4,
  denied:      1,
};

const WORKFLOW_STEPS = [
  { step: 1, name: "Reliever", description: "Approval from reliever" },
  { step: 2, name: "Operations Manager", description: "Approval from operations manager" },
  { step: 3, name: "Human Resource", description: "Final approval from HR" },
];

type PageRole = "requester" | "reliever" | "approver" | "admin";

const ROLE_OPTIONS: { value: PageRole; label: string }[] = [
  { value: "requester", label: "Requester" },
  { value: "reliever",  label: "Reliever"  },
  { value: "approver",  label: "Operations Manager/HR"  },
];

// Maps backend workflow audit actions to friendly labels for the Audit Trail
const AUDIT_ACTION_LABELS: Record<string, string> = {
  submitted: "Submitted",
  approved:  "Approved",
  rejected:  "Denied",
  returned:  "Returned",
};

export default function LeaveRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: apiRecord, isLoading } = useLeaveRequest(id);
  const { data: currentEmployee } = useCurrentEmployee();
  const { data: myApprovals = [] } = useMyApprovals();
  const { data: auditEntries = [] } = useAuditTrail("leave_request", apiRecord?.id ?? "");

  const [record, setRecord] = useState<LeaveRequest | undefined>(
    () => LEAVE_STORE.find((r) => r.id === id)
  );

  // Update record when API data loads
  useEffect(() => {
    if (apiRecord) {
      // Adapt API response to LeaveRequest format
      const adaptedRecord: LeaveRequest = {
        id: apiRecord.id,
        ref: apiRecord.reference,
        employee: apiRecord.employee_name || "—",
        requester: apiRecord.requester_name || "—",
        requesterJobTitle: apiRecord.requester_job_title,
        type: apiRecord.leave_type_name || "—",
        department: apiRecord.department || "—",
        startDate: apiRecord.start_date,
        endDate: apiRecord.end_date,
        days: apiRecord.days,
        reliever: apiRecord.reliever_name || "—",
        reason: apiRecord.reason,
        status: (apiRecord.status.toLowerCase() as any) || "draft",
        date: formatDateTime(apiRecord.created_at),
        requestType: apiRecord.request_type || "self",
        jobTitle: apiRecord.job_title,
        supportingDocuments: apiRecord.document ? [apiRecord.document.name] : [],
      };
      setRecord(adaptedRecord);
    }
  }, [apiRecord]);

  // Role detection (matching Safety & Compliance pattern):
  // - my-approvals returns THIS request only if the logged-in user is the assignee
  //   of the CURRENT active step. This is the source of truth for "can I act now?".
  // - It correctly handles a user who holds multiple roles (e.g. both reliever and
  //   operations manager): after they approve step 1, my-approvals returns the
  //   request again for step 2 so they can act again in the new role.
  const myApproval = apiRecord
    ? myApprovals.find(
        (a) => a.request_type === "leave_request" && a.request_id === apiRecord.id
      )
    : undefined;
  const canActNow = Boolean(myApproval);

  // Human-readable label for the step the user is currently acting on
  const currentStepName =
    WORKFLOW_STEPS.find((s) => s.step === myApproval?.current_step_number)?.name ??
    "Approver";

  // requester_id stores the User id (by backend design), so match against user_id;
  // also accept employee id for forward-compatibility. reliever_id is an employee id.
  const isRequester = apiRecord && currentEmployee
    ? apiRecord.requester_id === currentEmployee.user_id ||
      apiRecord.requester_id === currentEmployee.id
    : false;
  const isReliever = apiRecord && currentEmployee ? apiRecord.reliever_id === currentEmployee.id : false;
  const hasWorkflowAccess = canActNow || isRequester || isReliever;

  // A returned request can be edited and resubmitted by its requester
  const canResubmit = isRequester && record?.status === "returned";

  // Label shown in the header / access note
  const viewingAsLabel = canActNow
    ? currentStepName
    : isReliever
    ? "Reliever"
    : isRequester
    ? "Requester"
    : "Viewer";
  const currentRole: PageRole = canActNow ? "approver" : isReliever ? "reliever" : "requester";
  const toast = useToast();
  const approveMutation = useApproveLeaveRequest();

  const isOthers = record?.requestType === "others";

  // Terminal outcome derived from server state (not local optimistic state).
  // After an action the mutation invalidates the queries, apiRecord refetches,
  // and record.status reflects the new server truth — so a multi-role approver
  // sees the next step's panel instead of a stale confirmation banner.
  const terminalStatus: "approved" | "denied" | "returned" | null =
    record?.status === "approved"
      ? "approved"
      : record?.status === "denied"
      ? "denied"
      : record?.status === "returned"
      ? "returned"
      : null;

  async function submitApprovalAction(
    action: "approve" | "reject" | "return",
    comment: string
  ) {
    // Act on the approval request the CURRENT step is assigned to (from my-approvals).
    // After a resubmit there are multiple attempts; the record's approval_request_id
    // may point at an old (returned) attempt, so prefer my-approvals' id.
    const approvalRequestId =
      myApproval?.approval_request_id ?? apiRecord?.approval_request_id;
    if (!approvalRequestId) {
      toast.error("Cannot process approval: request not in workflow");
      return;
    }

    // Server is the source of truth — the mutation invalidates leave-request and
    // my-approvals queries, which refetch and drive the UI (panel / banner).
    await approveMutation.mutateAsync({
      approvalRequestId,
      action,
      comment,
    });
  }

  // ── Inline edit & resubmit (returned request, Safety pattern) ─────────────
  const queryClient = useQueryClient();
  const [resubmitFiles, setResubmitFiles] = useState<File[]>([]);
  const [removedDoc, setRemovedDoc] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);

  const { data: leaveTypesResponse } = useLeaveTypes({ limit: 100, is_active: true });
  const { data: employeesForResubmit = [] } = useEmployees({ limit: 200 });

  const resubmitForm = useForm<ResubmitForm>();
  const rWatch = resubmitForm.watch;
  const rIsOthers = rWatch("request_type") === "others";

  // Load the request into the edit form once (when it becomes editable)
  useEffect(() => {
    if (canResubmit && apiRecord) {
      resubmitForm.reset({
        request_type: apiRecord.request_type || "self",
        employee_id: apiRecord.employee_id,
        leave_type: String(apiRecord.leave_type_id),
        start_date: apiRecord.start_date,
        end_date: apiRecord.end_date,
        reliever_id: apiRecord.reliever_id || "",
        reason: apiRecord.reason || "",
      });
      setRemovedDoc(false);
      setResubmitFiles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canResubmit, apiRecord?.id]);

  const leaveTypeOptions = (leaveTypesResponse?.data || []).map((lt: any) => ({
    value: String(lt.id),
    label: lt.leave_type_name,
  }));
  const employeeOptions = employeesForResubmit.map((e: any) => ({
    value: e.id,
    label: `${e.user?.first_name ?? ""} ${e.user?.last_name ?? ""}`.trim() || e.employee_no,
  }));
  const relieverOptions = employeeOptions.filter((o) => o.value !== currentEmployee?.id);

  const rDays = (() => {
    const s = rWatch("start_date");
    const e = rWatch("end_date");
    if (!s || !e) return 0;
    const diff = new Date(e).getTime() - new Date(s).getTime();
    return diff < 0 ? 0 : Math.floor(diff / 86400000) + 1;
  })();

  async function handleResubmit(data: ResubmitForm) {
    const employeeId = rIsOthers ? data.employee_id : currentEmployee?.id;
    if (!employeeId || !data.reliever_id || !data.leave_type || !data.start_date || !data.end_date) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsResubmitting(true);
    try {
      const updated = await leaveRequestsApi.resubmit(id, {
        employee_id: employeeId,
        leave_type_id: parseInt(data.leave_type, 10),
        reliever_id: data.reliever_id,
        start_date: new Date(data.start_date).toISOString().split("T")[0],
        end_date: new Date(data.end_date).toISOString().split("T")[0],
        request_type: data.request_type,
        reason: data.reason,
      });

      if (resubmitFiles.length > 0 && updated?.id) {
        for (const file of resubmitFiles) {
          try {
            await leaveRequestsApi.uploadDocument(updated.id, file);
          } catch {
            toast.warning(`Could not upload ${file.name}. Request was still resubmitted.`);
          }
        }
      }

      toast.success("Request resubmitted for approval!");
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["audit-trail"] });
    } catch (err) {
      const message = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      toast.error(message || "Failed to resubmit request");
    } finally {
      setIsResubmitting(false);
    }
  }

  return (
    <AppLayout pageTitle="Leave Request">
      <Link
        href="/hr-management/leave-requests"
        className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5"
      >
        <ArrowLeft size={16} />
        Back to Leave Requests
      </Link>

      {!record ? (
        isLoading ? (
          <LeaveRequestDetailSkeleton />
        ) : (
          <div className="bg-brand-card border border-brand-border rounded-2xl p-8 text-center max-w-lg">
            <p className="text-brand-text-primary font-semibold">Record not found</p>
            <p className="text-brand-text-secondary text-sm mt-1">
              No leave request found for <span className="font-mono">{id}</span>.
            </p>
          </div>
        )
      ) : (
        <div className="space-y-5">

          {/* Header — matches Safety & Compliance (Current Access + Next Approver) */}
          <RoleBasedRecordHeader
            id={record.ref}
            currentRole={currentRole}
            onRoleChange={() => undefined}
            roleLabel={viewingAsLabel}
            roles={ROLE_OPTIONS}
            status={<ApprovalBadge status={record.status} />}
            recordLabel="Leave Request"
            title={`${record.employee} — ${record.type}`}
            nextApproverName={
              record.status === "returned"
                ? (record.requester ?? record.employee)
                : (apiRecord?.next_actor_name ?? undefined)
            }
            nextApproverRole={
              record.status === "returned"
                ? "Requester"
                : (apiRecord?.current_step_name ?? undefined)
            }
            showRoleSwitcher={false}
          />

          {/* Access note — hidden once the request reaches a terminal state
              (approved / denied); the status badge + outcome banner cover it. */}
          {record.status !== "approved" && record.status !== "denied" && (
            <div className="rounded-2xl border border-brand-border bg-brand-card p-4">
              <p className="text-sm text-brand-text-secondary">
                {canActNow
                  ? `You are the current approver for this request (${currentStepName}). Review and make your decision below.`
                  : hasWorkflowAccess
                  ? `Viewing as ${viewingAsLabel}`
                  : "You do not have direct access to this request. Available actions are based on the current employee profile and record assignment."}
              </p>
            </div>
          )}

          {/* Returned — requester edits inline below and resubmits */}
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

          {/* Workflow Progress */}
          {/* COMMENTED OUT FOR NOW
          {record.status !== "draft" && (
            <div className="rounded-2xl border border-brand-border bg-white p-5">
              <p className="text-sm font-semibold text-brand-text-primary mb-4">Approval Progress</p>
              <div className="space-y-3">
                {WORKFLOW_STEPS.map((step, idx) => {
                  const isCompleted = record.status === "approved" ||
                    (record.status === "in_progress" && step.step < 2) ||
                    (record.status === "pending" && step.step === 1);
                  const isCurrent = (record.status === "pending" && step.step === 1) ||
                    (record.status === "in_progress" && step.step === 2);

                  return (
                    <div key={step.step} className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full font-semibold text-sm shrink-0 ${
                        isCompleted ? "bg-green-100 text-green-700" :
                        isCurrent ? "bg-brand-purple text-white" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {isCompleted ? "✓" : step.step}
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className={`text-sm font-medium ${
                          isCompleted ? "text-green-700" :
                          isCurrent ? "text-brand-purple" :
                          "text-brand-text-secondary"
                        }`}>
                          {step.name}
                        </p>
                        <p className="text-xs text-brand-text-secondary">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          */}

          {/* Requester Details — mirrors form Requester Details section */}
          <ViewSection title="Requester Details" description="Your employee information for this leave request.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput label="Requester Name"  value={record.requester ?? record.employee} />
              <FormInput label="Department"       value={record.department} />
              <FormInput label="Job Title / Role" value={record.requesterJobTitle || "—"}      />
              <FormInput label="Request Date"     value={record.date}             />
            </div>
          </ViewSection>

          {/* Leave Details — editable inline when returned to the requester (Safety pattern) */}
          {canResubmit ? (
            <ViewSection title="Leave Details" description="Update the details and resubmit for approval.">
              <form onSubmit={resubmitForm.handleSubmit(handleResubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormSelect
                    label="Leave Type" required options={leaveTypeOptions} sortOptions={false}
                    placeholder="Select leave type"
                    {...resubmitForm.register("leave_type")} value={rWatch("leave_type") ?? ""}
                  />
                  <FormSelect
                    label="Raise For" required
                    options={[{ value: "self", label: "Self" }, { value: "others", label: "Others" }]}
                    sortOptions={false} placeholder="Select Raise For"
                    {...resubmitForm.register("request_type")} value={rWatch("request_type") ?? ""}
                  />
                  {rIsOthers && (
                    <FormSelect
                      label="Employee Name" required options={employeeOptions} sortOptions={false}
                      placeholder="Select employee"
                      {...resubmitForm.register("employee_id")} value={rWatch("employee_id") ?? ""}
                    />
                  )}
                  <FormDatePicker
                    label="Start Date" required
                    {...resubmitForm.register("start_date")} value={rWatch("start_date") ?? ""}
                  />
                  <FormDatePicker
                    label="End Date" required
                    {...resubmitForm.register("end_date")} value={rWatch("end_date") ?? ""}
                  />
                  <FormInput label="Number of Days" value={rDays > 0 ? String(rDays) : ""} disabled placeholder="Auto-calculated" />
                  <FormSelect
                    label="Reliever" required options={relieverOptions} sortOptions={false}
                    placeholder="Select reliever"
                    {...resubmitForm.register("reliever_id")} value={rWatch("reliever_id") ?? ""}
                  />
                  <div className="sm:col-span-2">
                    <FormTextarea label="Reason / Notes" rows={3} placeholder="Brief reason for this leave request…" {...resubmitForm.register("reason")} />
                  </div>

                  {/* Current document */}
                  {apiRecord?.document && !removedDoc && (
                    <div className="sm:col-span-2">
                      <p className="text-sm font-medium text-brand-text-primary mb-2">Current Document</p>
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-brand-border bg-gray-50">
                        <Paperclip size={14} className="text-brand-text-secondary shrink-0" />
                        <span className="text-sm text-brand-text-primary truncate flex-1">{apiRecord.document.name}</span>
                        {apiRecord.document.file_path && (
                          <a href={apiRecord.document.file_path} target="_blank" rel="noopener noreferrer" className="text-brand-text-secondary hover:text-brand-purple shrink-0" title="View">
                            <ExternalLink size={14} />
                          </a>
                        )}
                        <button type="button" onClick={() => setRemovedDoc(true)} className="text-red-500 hover:text-red-700 shrink-0" title="Remove">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <FileDropzone
                      label={apiRecord?.document && !removedDoc ? "Replace / Add Document" : "Supporting Document"}
                      value={resubmitFiles} onChange={setResubmitFiles}
                      accept="image/*,.pdf,.doc,.docx" maxFiles={5}
                      hint="Medical certificate, approval letter (optional)"
                    />
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
          <ViewSection title="Leave Details" description="Details about the leave being requested.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Row 1: Leave Type | Raise For */}
              <FormInput label="Leave Type"   value={record.type} />
              <FormInput
                label="Raise For"
                value={record.requestType === "self" ? "Self" : record.requestType === "others" ? "Others" : "—"}
              />

              {/* Rows for "Others": Employee Name | Department, Job Title | Start Date, End Date | Number of Days, Reliever */}
              {isOthers && (
                <>
                  <FormInput label="Employee Name"    value={record.employee}        />
                  <FormInput label="Employee Department"       value={record.department}       />
                  <FormInput label="Employee Job Title / Role" value={record.jobTitle ?? "—"} />
                  <FormInput label="Start Date"       value={formatDate(record.startDate)} />
                  <FormInput label="End Date"         value={formatDate(record.endDate)}   />
                  <FormInput label="Number of Days"   value={String(record.days)}         />
                  <FormInput label="Reliever"         value={record.reliever}              />
                </>
              )}

              {/* Rows for "Self": Start Date | End Date, Number of Days | Reliever */}
              {!isOthers && (
                <>
                  <FormInput label="Start Date"     value={formatDate(record.startDate)} />
                  <FormInput label="End Date"       value={formatDate(record.endDate)}   />
                  <FormInput label="Number of Days" value={String(record.days)}          />
                  <FormInput label="Reliever"       value={record.reliever}              />
                </>
              )}

              {/* Reason / Notes */}
              <div className="sm:col-span-2">
                <FormTextarea label="Reason / Notes" value={record.reason ?? ""} rows={3} />
              </div>

              {/* Supporting Documents */}
              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-brand-text-primary mb-2">Supporting Documents</p>
                {apiRecord?.document ? (
                  <a
                    href={apiRecord.document.file_path || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-brand-border bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
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

          {/* Approval action panel — shown only when the logged-in user is the
              assignee of the CURRENT step (source of truth: my-approvals).
              The reviewingAs label reflects the step they are acting on, so a
              user who is both reliever and operations manager sees the correct
              role at each step. */}
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
              disabled={approveMutation.isPending}
              onReturn={(comment) => submitApprovalAction("return", comment)}
              onReject={(comment) => submitApprovalAction("reject", comment)}
              onApprove={(comment) => submitApprovalAction("approve", comment)}
            />
          )}

          {/* Terminal status banner — shown only for final outcomes (server state) */}
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
              <div>
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

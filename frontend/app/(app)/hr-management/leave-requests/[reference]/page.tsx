"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Paperclip, CheckCircle2, XCircle, RotateCcw, ExternalLink } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import RoleBasedRecordHeader from "@/components/ui/RoleBasedRecordHeader";
import ApprovalPanel from "@/components/ui/ApprovalPanel";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import { formatDate, formatDateTime } from "@/lib/utils";
import AuditTrail from "@/components/forms/AuditTrail";
import { useToast } from "@/hooks/useToast";
import { useLeaveRequest } from "@/lib/modules/leave-requests/hooks";
import { LEAVE_STORE, type LeaveRequest } from "../../_components/_data";

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

type ActionResult = "approved" | "denied" | "draft" | "in_progress";
type PageRole = "requester" | "reliever" | "approver" | "admin";

const ROLE_OPTIONS: { value: PageRole; label: string }[] = [
  { value: "requester", label: "Requester" },
  { value: "reliever",  label: "Reliever"  },
  { value: "approver",  label: "Operations Manager/HR"  },
];

export default function LeaveRequestDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = use(params);
  const { data: apiRecord, isLoading } = useLeaveRequest(reference);

  const [record, setRecord] = useState<LeaveRequest | undefined>(
    () => LEAVE_STORE.find((r) => r.ref === reference)
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
  const [actionDone, setActionDone] = useState<ActionResult | null>(null);
  const [actionComment, setActionComment] = useState<string>("");
  const [currentRole, setCurrentRole] = useState<PageRole>("requester");
  const toast = useToast();

  const isOthers = record?.requestType === "others";

  function handleApprovalAction(action: ActionResult, comment: string) {
    setRecord((prev) => (prev ? { ...prev, status: action } : prev));
    setActionDone(action);
    setActionComment(comment);
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
        <div className="bg-brand-card border border-brand-border rounded-2xl p-8 text-center max-w-lg">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border border-brand-purple border-t-transparent"></div>
              <p className="text-brand-text-secondary text-sm mt-4">Loading leave request...</p>
            </div>
          ) : (
            <>
              <p className="text-brand-text-primary font-semibold">Record not found</p>
              <p className="text-brand-text-secondary text-sm mt-1">
                No leave request found for <span className="font-mono">{reference}</span>.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-5">

          {/* Header */}
          <RoleBasedRecordHeader
            id={record.ref}
            currentRole={currentRole}
            onRoleChange={setCurrentRole}
            roleLabel={currentRole === "approver" ? "Operations Manager/HR" : currentRole === "admin" ? "Admin" : "Requester"}
            roles={ROLE_OPTIONS}
            status={<ApprovalBadge status={record.status} />}
            recordLabel="Leave Request"
            title={`${record.employee} — ${record.type}`}
          />

          {/* Workflow Progress */}
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

          {/* Requester Details — mirrors form Requester Details section */}
          <ViewSection title="Requester Details" description="Your employee information for this leave request.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput label="Requester Name"  value={record.requester ?? record.employee} />
              <FormInput label="Department"       value={record.department} />
              <FormInput label="Job Title / Role" value={record.requesterJobTitle || "—"}      />
              <FormInput label="Request Date"     value={record.date}             />
            </div>
          </ViewSection>

          {/* Leave Details — mirrors form Leave Details grid exactly */}
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

          {/* Gate notice: approver waiting for reliever */}
          {currentRole === "approver" && record.status === "pending" && !actionDone && (
            <div className="rounded-2xl p-4 flex items-start gap-3 border bg-amber-50 border-amber-200">
              <RotateCcw size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Awaiting Reliever Confirmation</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {record.reliever} must accept the reliever role before this request can be approved.
                </p>
              </div>
            </div>
          )}

          {/* Reliever action panel — acts when status is "pending" */}
          {record.status === "pending" && !actionDone && currentRole === "reliever" && (
            <ApprovalPanel
              reviewingAs="Reliever"
              showReturn={false}
              showReject
              showApprove
              rejectLabel="Decline"
              approveLabel="Accept"
              requireCommentForRejectReturn
              onReject={(comment) => { toast.error("Reliever declined the request"); handleApprovalAction("draft", comment); }}
              onApprove={(comment) => { toast.success("Reliever accepted — awaiting manager approval"); handleApprovalAction("in_progress", comment); }}
            />
          )}

          {/* Approver action panel — acts when reliever has accepted (status is "in_progress") */}
          {record.status === "in_progress" && !actionDone && currentRole === "approver" && (
            <ApprovalPanel
              reviewingAs="Operations Manager/HR"
              showReturn
              showReject
              showApprove
              returnLabel="Return"
              rejectLabel="Deny"
              approveLabel="Approve"
              requireCommentForRejectReturn
              onReturn={(comment) => { toast.info("Leave request returned to requester"); handleApprovalAction("draft", comment); }}
              onReject={(comment) => { toast.error("Leave request denied"); handleApprovalAction("denied", comment); }}
              onApprove={(comment) => { toast.success("Leave request approved successfully"); handleApprovalAction("approved", comment); }}
            />
          )}

          {/* Action confirmation banner */}
          {actionDone && (
            <div className={`rounded-2xl p-4 flex items-start gap-3 border ${
              actionDone === "approved"    ? "bg-green-50 border-green-200"
              : actionDone === "denied"   ? "bg-red-50 border-red-200"
              : actionDone === "in_progress" ? "bg-teal-50 border-teal-200"
              : "bg-amber-50 border-amber-200"
            }`}>
              {actionDone === "approved" ? (
                <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
              ) : actionDone === "denied" ? (
                <XCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
              ) : actionDone === "in_progress" ? (
                <CheckCircle2 size={18} className="text-teal-600 shrink-0 mt-0.5" />
              ) : (
                <RotateCcw size={18} className="text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-semibold ${
                  actionDone === "approved"       ? "text-green-800"
                  : actionDone === "denied"       ? "text-red-800"
                  : actionDone === "in_progress"  ? "text-teal-800"
                  : "text-amber-800"
                }`}>
                  {actionDone === "approved"      ? "Request Approved"
                    : actionDone === "denied"     ? "Request Denied"
                    : actionDone === "in_progress" ? "Reliever Accepted — Awaiting Approver"
                    : "Returned to Requester"}
                </p>
                {actionComment.trim() && (
                  <p className={`text-xs mt-0.5 ${
                    actionDone === "approved"      ? "text-green-700"
                    : actionDone === "denied"      ? "text-red-700"
                    : actionDone === "in_progress" ? "text-teal-700"
                    : "text-amber-700"
                  }`}>
                    Comment: {actionComment}
                  </p>
                )}
              </div>
            </div>
          )}

          <AuditTrail
            items={[
              {
                action: "Submitted",
                actor: record.requester ?? record.employee,
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

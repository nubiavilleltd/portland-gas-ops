"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Paperclip, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import RoleBasedRecordHeader from "@/components/ui/RoleBasedRecordHeader";
import ApprovalPanel from "@/components/ui/ApprovalPanel";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import { formatDate } from "@/lib/utils";
import AuditTrail from "@/components/forms/AuditTrail";
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
  rejected:    1,
};

const ACTIONABLE = new Set(["pending", "in_progress"]);
type ActionResult = "approved" | "rejected" | "draft";
type PageRole = "requester" | "approver" | "admin";

const ROLE_OPTIONS: { value: PageRole; label: string }[] = [
  { value: "requester", label: "Requester" },
  { value: "approver", label: "Approver" },
];

export default function LeaveRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [record, setRecord] = useState<LeaveRequest | undefined>(
    () => LEAVE_STORE.find((r) => r.id === id)
  );
  const [actionDone, setActionDone] = useState<ActionResult | null>(null);
  const [actionComment, setActionComment] = useState<string>("");
  const [currentRole, setCurrentRole] = useState<PageRole>("requester");

  const isOthers = record?.requestType === "others";

  function handleApprovalAction(action: ActionResult, comment: string) {
    setRecord((prev) => (prev ? { ...prev, status: action } : prev));
    setActionDone(action);
    setActionComment(comment);
  }

  return (
    <AppLayout pageTitle="Leave Request">
      <Link
        href="/admin/leave-requests"
        className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5"
      >
        <ArrowLeft size={16} />
        Back to Leave Requests
      </Link>

      {!record ? (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-8 text-center max-w-lg">
          <p className="text-brand-text-primary font-semibold">Record not found</p>
          <p className="text-brand-text-secondary text-sm mt-1">
            No leave request found for ID <span className="font-mono">{id}</span>.
          </p>
        </div>
      ) : (
        <div className="space-y-5">

          {/* Header */}
          <RoleBasedRecordHeader
            id={record.ref}
            currentRole={currentRole}
            onRoleChange={setCurrentRole}
            roleLabel={currentRole === "approver" ? "Approver" : currentRole === "admin" ? "Admin" : "Requester"}
            roles={ROLE_OPTIONS}
            status={<ApprovalBadge status={record.status} />}
            recordLabel="Leave Request"
            title={`${record.employee} — ${record.type}`}
          />

          {/* Requester Details — mirrors form Requester Details section */}
          <ViewSection title="Requester Details" description="Your employee information for this leave request.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput label="Requester Name"  value={record.requester ?? record.employee} />
              <FormInput label="Department"       value={CURRENT_USER.department} />
              <FormInput label="Job Title / Role" value={CURRENT_USER.title}      />
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
                  <p className="text-sm text-brand-text-secondary px-3 py-2.5 rounded-lg border border-brand-border bg-gray-50">
                    No documents attached
                  </p>
                )}
              </div>
            </div>
          </ViewSection>

          {/* Approval Action */}
          {ACTIONABLE.has(record.status) && !actionDone && currentRole !== "requester" && (
            <ApprovalPanel
              reviewingAs={currentRole === "approver" ? "Approver" : "Requester"}
              showReturn
              showReject
              showApprove
              returnLabel="Return"
              rejectLabel="Deny"
              approveLabel="Approve"
              requireCommentForRejectReturn
              onReturn={(comment) => handleApprovalAction("draft", comment)}
              onReject={(comment) => handleApprovalAction("rejected", comment)}
              onApprove={(comment) => handleApprovalAction("approved", comment)}
            />
          )}

          {/* Action confirmation banner */}
          {actionDone && (
            <div className={`rounded-2xl p-4 flex items-start gap-3 border ${
              actionDone === "approved" ? "bg-green-50 border-green-200"
              : actionDone === "rejected" ? "bg-red-50 border-red-200"
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
                  actionDone === "approved" ? "text-green-800"
                  : actionDone === "rejected" ? "text-red-800"
                  : "text-amber-800"
                }`}>
                  {actionDone === "approved" ? "Request Approved"
                    : actionDone === "rejected" ? "Request Denied"
                    : "Returned"}
                </p>
                {actionComment.trim() && (
                  <p className={`text-xs mt-0.5 ${
                    actionDone === "approved" ? "text-green-700"
                    : actionDone === "rejected" ? "text-red-700"
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

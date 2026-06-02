"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, FileText, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import IncidentHazardRoleSwitcher from "./IncidentHazardRoleSwitcher";
import SafetyChoiceTable from "./SafetyChoiceTable";
import {
  getMockIncidentHazardReport,
  incidentSeverityOptions,
  reportTypeOptions,
} from "@/lib/mock/incident-hazard";
import {
  closeResolvedIncident,
  getApprovedCloseOutForIncident,
  resolveIncidentWithCompletedWork,
  updateIncidentHazardReport,
  useSafetyDemoData,
} from "@/lib/safety-demo-store";
import type {
  IncidentHazardAttachment,
  IncidentHazardHseReview,
  IncidentHazardReport,
  IncidentHazardRole,
  IncidentHazardStatus,
  WorkAuthorizationAuditTrailItem,
} from "@/types/safety";

const toOptions = (items: string[]) => items.map((item) => ({ value: item, label: item }));
const yesNoOptions = toOptions(["Yes", "No"]);
const actionOwnerOptions = toOptions(["Workshop Supervisor", "Mary James", "Daniel Okoro", "Ibrahim Musa"]);
const departmentOptions = toOptions(["Engineering", "Maintenance", "Operations", "Logistics", "HSE", "Admin"]);

export default function IncidentHazardDetailsView({ reportId }: { reportId: string }) {
  const router = useRouter();
  const initialReport = getMockIncidentHazardReport(reportId);
  const { incidentHazards } = useSafetyDemoData();
  const report = incidentHazards.find((item) => item.id === reportId) ?? initialReport;
  const completedWork = report ? getApprovedCloseOutForIncident(report.id) : null;
  const [currentRole, setCurrentRole] = useState<IncidentHazardRole>("reporter");
  const [hseComment, setHseComment] = useState("");
  const [correctiveActionRequired, setCorrectiveActionRequired] = useState("");
  const [assignedDepartment, setAssignedDepartment] = useState("");
  const [actionOwner, setActionOwner] = useState("");

  const permissions = useMemo(() => {
    const isDraft = report?.status === "draft";
    const isSubmitted = report?.status === "submitted";
    const isRecommended = report?.status === "recommended";
    const isResolved = report?.status === "resolved";
    const isClosed = report?.status === "closed";
    return {
      canReporterEdit: currentRole === "reporter" && isDraft,
      canHseReview: currentRole === "hse" && isSubmitted,
      canActionOwnerResolve:
        currentRole === "action_owner" && isRecommended && Boolean(completedWork),
      canHseClose: currentRole === "hse" && isResolved,
      showActionOwnerSection: Boolean(isRecommended || isResolved || isClosed),
      showHseReview: Boolean(
        (currentRole === "hse" && isSubmitted) ||
        Boolean(report?.hseReview)
      ),
      showAuditTrail: Boolean(!isDraft),
    };
  }, [completedWork, currentRole, report?.hseReview, report?.status]);

  if (!report) {
    return (
      <div className="rounded-2xl border border-brand-border bg-white p-6">
        <p className="text-sm text-brand-text-secondary">Incident/hazard report not found.</p>
      </div>
    );
  }
  const persistedReportId = report.id;

  function persistUpdate(
    update: (current: IncidentHazardReport) => IncidentHazardReport,
  ) {
    updateIncidentHazardReport(persistedReportId, update);
  }

  function submitReport() {
    if (!report) return;

    const audit: WorkAuthorizationAuditTrailItem = {
      action: "Submitted",
      actor: report.reporter.name,
      role: "Reporter",
      dateTime: "2026-05-18 08:30 AM",
      comment: "Incident/hazard report submitted for HSE review.",
    };
    persistUpdate((current) => ({
      ...current,
      status: "submitted",
      auditTrail: [...current.auditTrail, audit],
    }));
  }

  function buildHseReview(decision: "Resolved" | "Not Resolved" | "Recommended" | ""): IncidentHazardHseReview {
    return {
      inspector: "Samuel Bassey",
      confirmedReportType: report?.reportType || "Hazard",
      confirmedSeverity: report?.severityEstimate || "Medium",
      findings: "HSE reviewed the report and confirmed the reported condition.",
      rootCause: "Initial mock root cause pending deeper investigation.",
      correctiveActionRequired: correctiveActionRequired === "Yes",
      correctiveActionDetails:
        correctiveActionRequired === "Yes"
          ? "Corrective action required. Recommended for Work Initiation."
          : "",
      actionOwner: correctiveActionRequired === "Yes" ? actionOwner : "",
      assignedDepartment: correctiveActionRequired === "Yes" ? assignedDepartment : "",
      targetCompletionDate: correctiveActionRequired === "Yes" ? "2026-05-22" : "",
      decision,
      comment:
        hseComment ||
        (decision === "Resolved"
          ? "HSE reviewed and resolved the report."
          : decision === "Not Resolved"
            ? "HSE reviewed the report and marked it not resolved."
            : "HSE acknowledged the report and recommended corrective work to the assigned department."),
      reviewDateTime: "2026-05-18 10:00 AM",
    };
  }

  function recommendToDepartment() {
    if (!assignedDepartment || !actionOwner) return;
    const review = buildHseReview("Recommended");
    const audit: WorkAuthorizationAuditTrailItem = {
      action: `Recommended to ${review.assignedDepartment}`,
      actor: review.inspector,
      role: "HSE Inspector",
      dateTime: review.reviewDateTime,
      comment: `Corrective action required. Recommended to ${review.assignedDepartment} and assigned to ${review.actionOwner}.`,
    };
    persistUpdate((current) => ({
      ...current,
      status: "recommended",
      hseReview: review,
      auditTrail: [...current.auditTrail, audit],
    }));
  }

  function resolveRecommendedIncident() {
    resolveIncidentWithCompletedWork(persistedReportId);
  }

  function closeIncident() {
    closeResolvedIncident(persistedReportId);
  }

  function hseFinalDecision(decision: "Resolved" | "Not Resolved") {
    const previousReview = report?.hseReview;
    const review: IncidentHazardHseReview = {
      ...(previousReview ?? buildHseReview(decision)),
      decision,
      comment:
        hseComment ||
        (decision === "Resolved"
          ? "HSE verified the corrective action and resolved the report."
          : "HSE reviewed the corrective action and marked the report not resolved."),
      reviewDateTime: "2026-05-18 01:00 PM",
    };

    const audit: WorkAuthorizationAuditTrailItem = {
      action: decision === "Resolved" ? "Resolved by HSE" : "Marked Not Resolved by HSE",
      actor: review.inspector,
      role: "HSE Inspector",
      dateTime: review.reviewDateTime,
      comment: review.comment,
    };
    persistUpdate((current) => ({
      ...current,
      status: decision === "Resolved" ? "resolved" : "not_resolved",
      hseReview: review,
      auditTrail: [...current.auditTrail, audit],
    }));
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => router.push("/safety/incidents")}
        className="flex items-center gap-2 text-sm text-brand-text-secondary transition-colors hover:text-brand-text-primary"
      >
        <ArrowLeft size={14} />
        Back to Incident & Hazard Reports
      </button>

      <IncidentHazardRoleSwitcher value={currentRole} onChange={setCurrentRole} />

      <section className="rounded-2xl border border-brand-border bg-white p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-text-secondary">
              Incident & Hazard Report
            </p>
            <h2 className="mt-1 text-xl font-semibold text-brand-text-primary">{report.id}</h2>
            <p className="mt-1 text-sm text-brand-text-secondary">
              Viewing as {getIncidentHazardRoleLabel(currentRole)}
            </p>
          </div>
          <IncidentHazardStatusBadge status={report.status} />
        </div>
      </section>

      <StatusNote report={report} currentRole={currentRole} />
      <ReporterDetails report={report} />
      <ReportDetails report={report} editable={permissions.canReporterEdit} />
      <IncidentDetails report={report} editable={permissions.canReporterEdit} />
      <EvidenceSection report={report} />

      {permissions.canReporterEdit ? (
        <div className="flex justify-end">
          <Button type="button" onClick={submitReport}>Submit Report</Button>
        </div>
      ) : null}

      {permissions.showHseReview ? (
        permissions.canHseReview ? (
          <HseReviewAction
            comment={hseComment}
            onCommentChange={setHseComment}
            correctiveActionRequired={correctiveActionRequired}
            onCorrectiveActionRequiredChange={setCorrectiveActionRequired}
            assignedDepartment={assignedDepartment}
            onAssignedDepartmentChange={setAssignedDepartment}
            actionOwner={actionOwner}
            onActionOwnerChange={setActionOwner}
            onForward={recommendToDepartment}
            onDecision={hseFinalDecision}
          />
        ) : report.hseReview ? (
          <HseReviewResult review={report.hseReview} />
        ) : null
      ) : null}

      {permissions.showActionOwnerSection ? (
        report.hseReview?.correctiveActionRequired ? (
          <CorrectiveWorkResolution
            report={report}
            completedWorkReference={
              completedWork
                ? `${completedWork.id} - ${completedWork.title} | ${completedWork.requester.name} | ${completedWork.requester.requestDate}`
                : report.resolutionWorkCompletionId || ""
            }
            canResolve={permissions.canActionOwnerResolve}
            onResolve={resolveRecommendedIncident}
          />
        ) : null
      ) : null}

      {permissions.canHseClose ? (
        <HseClosureAction report={report} onClose={closeIncident} />
      ) : null}

      {permissions.showAuditTrail ? <AuditTrail items={report.auditTrail} /> : null}
    </div>
  );
}

function ReporterDetails({ report }: { report: IncidentHazardReport }) {
  return (
    <FormSection title="Reporter Details" description="Employee information for the person who raised this report.">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Reporter Name" value={report.reporter.name} disabled />
        <FormInput label="Department" value={report.reporter.department} disabled />
        <FormInput label="Job Title / Role" value={report.reporter.role} disabled />
        <FormInput label="Report Date" value={report.reporter.reportDate} disabled />
      </div>
    </FormSection>
  );
}

function ReportDetails({ report, editable }: { report: IncidentHazardReport; editable: boolean }) {
  return (
    <FormSection title="Report Details" description="Basic information about the reported incident or hazard.">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Report Reference" value={report.id} disabled />
        <FormInput label="Report Title" defaultValue={report.title} disabled={!editable} />
        <FormInput label="Report Type" defaultValue={report.reportType} disabled={!editable} />
        <FormInput label="Location" defaultValue={report.location} disabled={!editable} />
        <FormInput label="Date/Time Observed" defaultValue={report.dateTimeObserved} disabled={!editable} />
        <FormInput label="Related Work Authorization" defaultValue={report.relatedWorkAuthorization} disabled={!editable} />
      </div>
    </FormSection>
  );
}

function IncidentDetails({ report, editable }: { report: IncidentHazardReport; editable: boolean }) {
  return (
    <FormSection title="Incident / Hazard Details" description="Observed impact, risk level, and immediate actions recorded.">
      <div className="grid gap-4 md:grid-cols-2">
        <FormTextarea label="Description" defaultValue={report.description} disabled={!editable} className="md:col-span-2" />
        <FormInput label="Severity Estimate" defaultValue={report.severityEstimate} disabled={!editable} />
        <div className="md:col-span-2">
          <SafetyChoiceTable
            options={yesNoOptions}
            disabled={!editable}
            rows={[
              { label: "Was anyone injured?", value: nullableBooleanToYesNo(report.anyoneInjured) },
              { label: "Was equipment/property damaged?", value: nullableBooleanToYesNo(report.propertyDamaged) },
              { label: "Is there gas/fire/environmental concern?", value: nullableBooleanToYesNo(report.gasFireEnvironmentalConcern) },
            ]}
          />
        </div>
        <FormTextarea label="Immediate Action Taken" defaultValue={report.immediateActionTaken} disabled={!editable} className="md:col-span-2" />
        <FormTextarea label="People Involved / Witnesses" defaultValue={report.peopleInvolved} disabled={!editable} />
        <FormTextarea label="Additional Notes" defaultValue={report.additionalNotes} disabled={!editable} />
      </div>
    </FormSection>
  );
}

function EvidenceSection({ report }: { report: IncidentHazardReport }) {
  return (
    <FormSection title="Evidence / Attachments" description="Supporting photos, videos, or documents for this report.">
      <AttachmentList attachments={report.attachments} />
    </FormSection>
  );
}

function HseReviewAction({
  comment,
  onCommentChange,
  correctiveActionRequired,
  onCorrectiveActionRequiredChange,
  assignedDepartment,
  onAssignedDepartmentChange,
  actionOwner,
  onActionOwnerChange,
  onForward,
  onDecision,
}: {
  comment: string;
  onCommentChange: (comment: string) => void;
  correctiveActionRequired: string;
  onCorrectiveActionRequiredChange: (value: string) => void;
  assignedDepartment: string;
  onAssignedDepartmentChange: (value: string) => void;
  actionOwner: string;
  onActionOwnerChange: (value: string) => void;
  onForward: () => void;
  onDecision: (decision: "Resolved" | "Not Resolved") => void;
}) {
  const requiresCorrectiveWork = correctiveActionRequired === "Yes";
  const canRecommendCorrectiveWork = requiresCorrectiveWork && Boolean(assignedDepartment && actionOwner);
  const canResolveWithoutCorrectiveWork = correctiveActionRequired === "No";
  const canDenyWithoutCorrectiveWork = canResolveWithoutCorrectiveWork && Boolean(comment.trim());

  return (
    <FormSection title="HSE Review & Corrective Action" description="Assess the report and determine whether corrective work is required.">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="HSE Inspector" value="Samuel Bassey" disabled />
        <FormSelect label="Confirmed Report Type" required options={toOptions(reportTypeOptions)} placeholder="Select confirmed report type" />
        <FormSelect label="Confirmed Severity" required options={toOptions(incidentSeverityOptions)} placeholder="Select confirmed severity" />
        <FormTextarea label="HSE Findings" required placeholder="Add HSE findings" />
        {/* <FormTextarea label="Root Cause / Likely Cause" placeholder="Optional" /> */}
        <div className="md:col-span-2">
          <SafetyChoiceTable
            options={yesNoOptions}
            rows={[
              {
                label: "Corrective Action Required?",
                required: true,
                value: correctiveActionRequired,
                onValueChange: onCorrectiveActionRequiredChange,
              },
            ]}
          />
        </div>
        {correctiveActionRequired === "Yes" ? (
          <>
            <FormTextarea label="Corrective Action Details" required placeholder="Describe corrective action" />
            <FormSelect
              label="Assigned Department"
              required
              searchable
              options={departmentOptions}
              placeholder="Select department"
              value={assignedDepartment}
              onValueChange={onAssignedDepartmentChange}
            />
            <FormSelect
              label="Action Owner"
              required
              searchable
              options={actionOwnerOptions}
              placeholder="Select action owner"
              value={actionOwner}
              onValueChange={onActionOwnerChange}
            />
            <FormDatePicker label="Target Completion Date" required />
          </>
        ) : null}
        <FormTextarea
          label="HSE Comment"
          value={comment}
          onChange={(event) => onCommentChange(event.target.value)}
          placeholder="Add HSE comment"
        />
        <FormInput label="HSE Review Date/Time" value="2026-05-18 10:00 AM" disabled />
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {requiresCorrectiveWork ? (
          <Button type="button" disabled={!canRecommendCorrectiveWork} onClick={onForward}>
            Recommend Corrective Action
          </Button>
        ) : (
          <>
            <Button
              type="button"
              disabled={!canResolveWithoutCorrectiveWork}
              onClick={() => onDecision("Resolved")}
            >
              Approve
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={!canDenyWithoutCorrectiveWork}
              onClick={() => onDecision("Not Resolved")}
            >
              Deny
            </Button>
          </>
        )}
      </div>
      {correctiveActionRequired === "Yes" ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Approval is disabled because corrective action is required.
        </p>
      ) : null}
      {correctiveActionRequired === "No" && !comment.trim() ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Add an HSE comment before denying this report.
        </p>
      ) : null}
    </FormSection>
  );
}

function HseReviewResult({ review }: { review: IncidentHazardHseReview }) {
  return (
    <FormSection title="HSE Review & Corrective Action" description="Recorded HSE findings and corrective action outcome.">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="HSE Inspector" value={review.inspector} disabled />
        <FormInput label="Confirmed Report Type" value={review.confirmedReportType} disabled />
        <FormInput label="Confirmed Severity" value={review.confirmedSeverity} disabled />
        <FormTextarea label="HSE Findings" value={review.findings} disabled />
        {/* <FormTextarea label="Root Cause / Likely Cause" value={review.rootCause} disabled /> */}
        <div className="md:col-span-2">
          <SafetyChoiceTable
            options={yesNoOptions}
            disabled
            rows={[
              {
                label: "Corrective Action Required?",
                value: nullableBooleanToYesNo(review.correctiveActionRequired),
              },
            ]}
          />
        </div>
        {review.correctiveActionRequired ? (
          <>
            <FormTextarea label="Corrective Action Details" value={review.correctiveActionDetails} disabled />
            <FormInput label="Assigned Department" value={review.assignedDepartment} disabled />
            <FormInput label="Action Owner" value={review.actionOwner} disabled />
            <FormInput label="Target Completion Date" value={review.targetCompletionDate} disabled />
          </>
        ) : null}
        <FormInput
          label="HSE Resolution"
          value={review.decision || "Pending final HSE resolution"}
          disabled
        />
        <FormTextarea label="HSE Comment" value={review.comment} disabled />
        <FormInput label="HSE Review Date/Time" value={review.reviewDateTime} disabled />
      </div>
    </FormSection>
  );
}

function CorrectiveWorkResolution({
  report,
  completedWorkReference,
  canResolve,
  onResolve,
}: {
  report: IncidentHazardReport;
  completedWorkReference: string;
  canResolve: boolean;
  onResolve: () => void;
}) {
  return (
    <FormSection title="Corrective Work Resolution" description="Track linked corrective work through completion before closure.">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Assigned Department" value={report.hseReview?.assignedDepartment || ""} disabled />
        <FormInput label="Action Owner" value={report.hseReview?.actionOwner || ""} disabled />
        <FormInput
          label="Related Completed Work Request"
          value={completedWorkReference || "No approved linked work completion available yet"}
          disabled
          className="md:col-span-2"
        />
      </div>
      {report.status === "recommended" && !completedWorkReference ? (
        <p className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Create and complete linked work using this incident before it can be marked resolved.
        </p>
      ) : null}
      {canResolve ? (
        <div className="mt-4">
          <Button type="button" onClick={onResolve}>
            Mark Incident Resolved
          </Button>
        </div>
      ) : null}
    </FormSection>
  );
}

function HseClosureAction({
  report,
  onClose,
}: {
  report: IncidentHazardReport;
  onClose: () => void;
}) {
  return (
    <FormSection title="HSE Final Closure" description="Verify the completed corrective work and close this report.">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="HSE Inspector" value={report.hseReview?.inspector || "Samuel Bassey"} disabled />
        <FormInput
          label="Verified Work Completion"
          value={report.resolutionWorkCompletionId || "No linked completion required"}
          disabled
        />
      </div>
      <p className="mt-4 text-sm text-brand-text-secondary">
        Confirm the reported issue has been resolved and close this incident record.
      </p>
      <div className="mt-4">
        <Button type="button" onClick={onClose}>Close Incident</Button>
      </div>
    </FormSection>
  );
}

function nullableBooleanToYesNo(value: boolean | null) {
  if (value === null) return "";
  return value ? "Yes" : "No";
}

function AttachmentList({ attachments }: { attachments: IncidentHazardAttachment[] }) {
  if (attachments.length === 0) {
    return <p className="text-sm text-brand-text-secondary">No attachments.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {attachments.map((attachment) => (
        <div key={attachment.name} className="flex items-center gap-3 rounded-xl border border-brand-border bg-gray-50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-brand-purple">
            {attachment.type === "image" ? <ImageIcon size={18} /> : <FileText size={18} />}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-brand-text-primary">{attachment.name}</p>
            <p className="text-xs capitalize text-brand-text-secondary">{attachment.type}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AuditTrail({ items }: { items: WorkAuthorizationAuditTrailItem[] }) {
  return (
    <FormSection title="Audit Trail" description="Recorded workflow actions and comments for this report.">
      {items.length === 0 ? (
        <p className="text-sm text-brand-text-secondary">No audit actions yet.</p>
      ) : (
        <div className="divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border">
          {items.map((item, index) => (
            <div key={`${item.action}-${index}`} className="grid gap-2 bg-white p-4 md:grid-cols-[1fr_1fr_1fr_1.2fr_2fr]">
              <AuditCell label="Action" value={item.action} />
              <AuditCell label="Actor" value={item.actor} />
              <AuditCell label="Role" value={item.role} />
              <AuditCell label="Date/Time" value={item.dateTime} />
              <AuditCell label="Comment" value={item.comment} />
            </div>
          ))}
        </div>
      )}
    </FormSection>
  );
}

function StatusNote({ report, currentRole }: { report: IncidentHazardReport; currentRole: IncidentHazardRole }) {
  let note = "";
  if (report.status === "submitted") {
    note =
      currentRole === "hse"
        ? "This report is waiting for your HSE review."
        : "Submitted. Waiting for HSE review.";
  } else if (report.status === "draft" && currentRole !== "reporter") {
    note = "This report is still in draft and has not been submitted.";
  } else if (report.status === "recommended") {
    note =
      currentRole === "action_owner"
        ? `Corrective work has been recommended to you in ${report.hseReview?.assignedDepartment || "the assigned department"}. Raise linked Work Initiation to continue.`
        : `Corrective action recommended to ${report.hseReview?.actionOwner || "the action owner"} in ${report.hseReview?.assignedDepartment || "the assigned department"}.`;
  } else if (report.status === "resolved") {
    note =
      currentRole === "hse"
        ? "The action owner marked this incident resolved. Verify the completed work and close it."
        : "This incident has been marked resolved and is awaiting HSE closure.";
  } else if (report.status === "closed") {
    note = "This report has been verified and closed by HSE.";
  } else if (report.status === "not_resolved") {
    note = "This report has been marked not resolved by HSE.";
  }
  if (!note) return null;
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      {note}
    </div>
  );
}

function IncidentHazardStatusBadge({ status }: { status: IncidentHazardStatus }) {
  const labelByStatus: Record<IncidentHazardStatus, string> = {
    draft: "Draft",
    submitted: "Submitted",
    recommended: "Recommended",
    resolved: "Resolved",
    closed: "Closed",
    not_resolved: "Not Resolved",
  };

  const classByStatus: Record<IncidentHazardStatus, string> = {
    draft: "bg-gray-100 text-gray-600",
    submitted: "bg-amber-100 text-amber-700",
    recommended: "bg-blue-100 text-blue-700",
    resolved: "bg-green-100 text-green-700",
    closed: "bg-slate-100 text-slate-700",
    not_resolved: "bg-red-100 text-red-700",
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${classByStatus[status]}`}>
      {labelByStatus[status]}
    </span>
  );
}

function getIncidentHazardRoleLabel(role: IncidentHazardRole) {
  const labelByRole: Record<IncidentHazardRole, string> = {
    reporter: "Reporter",
    hse: "HSE Inspector",
    action_owner: "Action Owner",
  };

  return labelByRole[role];
}

function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="overflow-visible rounded-2xl border border-brand-border bg-white">
      <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-5 py-4 md:px-6">
        <h3 className="text-base font-semibold text-brand-text-primary">{title}</h3>
        {description ? <p className="mt-1 text-sm text-brand-text-secondary">{description}</p> : null}
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

function AuditCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-brand-text-secondary">{label}</p>
      <p className="mt-1 text-sm text-brand-text-primary">{value || "-"}</p>
    </div>
  );
}

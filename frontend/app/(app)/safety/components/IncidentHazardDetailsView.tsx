"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, FileText, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import FormToggleGroup from "@/components/forms/FormToggleGroup";
import IncidentHazardRoleSwitcher from "./IncidentHazardRoleSwitcher";
import {
  cloneIncidentHazardReport,
  getMockIncidentHazardReport,
  incidentPriorityOptions,
  reportTypeOptions,
} from "@/lib/mock/incident-hazard";
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
const hseDecisionOptions = toOptions(["Resolved", "Not Resolved"]);
const employeeOptions = toOptions(["Workshop Supervisor", "Mary James", "Daniel Okoro", "Ibrahim Musa"]);

export default function IncidentHazardDetailsView({ reportId }: { reportId: string }) {
  const router = useRouter();
  const initialReport = getMockIncidentHazardReport(reportId);
  const [currentRole, setCurrentRole] = useState<IncidentHazardRole>("reporter");
  const [report, setReport] = useState<IncidentHazardReport | null>(
    initialReport ? cloneIncidentHazardReport(initialReport) : null
  );
  const [hseComment, setHseComment] = useState("");
  const [correctiveActionRequired, setCorrectiveActionRequired] = useState("Yes");

  const permissions = useMemo(() => {
    const isDraft = report?.status === "draft";
    const isSubmitted = report?.status === "submitted";
    const isApproved = report?.status === "approved";
    return {
      canReporterEdit: currentRole === "reporter" && isDraft,
      canHseReview: currentRole === "hse" && isSubmitted,
      showHseReview: Boolean((currentRole === "hse" && isSubmitted) || isApproved),
      showAuditTrail: Boolean(!isDraft || isApproved),
    };
  }, [currentRole, report?.status]);

  if (!report) {
    return (
      <div className="rounded-2xl border border-brand-border bg-white p-6">
        <p className="text-sm text-brand-text-secondary">Incident/hazard report not found.</p>
      </div>
    );
  }

  function addAudit(item: WorkAuthorizationAuditTrailItem) {
    setReport((current) =>
      current ? { ...current, auditTrail: [...current.auditTrail, item] } : current
    );
  }

  function submitReport() {
    if (!report) return;

    setReport((current) => (current ? { ...current, status: "submitted" } : current));
    addAudit({
      action: "Submitted",
      actor: report.reporter.name,
      role: "Reporter",
      dateTime: "2026-05-18 08:30 AM",
      comment: "Incident/hazard report submitted to HSE.",
    });
  }

  function hseDecision(decision: "Resolved" | "Not Resolved") {
    const review: IncidentHazardHseReview = {
      inspector: "Samuel Bassey",
      confirmedReportType: report?.reportType || "Hazard",
      confirmedSeverity: report?.severityEstimate || "Medium",
      findings: "HSE reviewed the report and confirmed the reported condition.",
      rootCause: "Initial mock root cause pending deeper investigation.",
      correctiveActionRequired: correctiveActionRequired === "Yes",
      correctiveActionDetails:
        correctiveActionRequired === "Yes"
          ? "Assign owner to complete corrective action and confirm closure."
          : "",
      actionOwner: correctiveActionRequired === "Yes" ? "Workshop Supervisor" : "",
      targetCompletionDate: correctiveActionRequired === "Yes" ? "2026-05-22" : "",
      decision,
      comment:
        hseComment ||
        (decision === "Resolved"
          ? "HSE reviewed and resolved the report."
          : "HSE reviewed the report and marked it not resolved."),
      reviewDateTime: "2026-05-18 10:00 AM",
    };
    setReport((current) =>
      current
        ? {
            ...current,
            status: decision === "Resolved" ? "approved" : current.status,
            hseReview: review,
          }
        : current
    );
    addAudit({
      action: decision === "Resolved" ? "Resolved by HSE" : "Marked Not Resolved by HSE",
      actor: review.inspector,
      role: "HSE Inspector",
      dateTime: review.reviewDateTime,
      comment: review.comment,
    });
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
              Viewing as {currentRole === "hse" ? "HSE Inspector" : "Reporter"}
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
            onDecision={hseDecision}
          />
        ) : report.hseReview ? (
          <HseReviewResult review={report.hseReview} />
        ) : null
      ) : null}

      {permissions.showAuditTrail ? <AuditTrail items={report.auditTrail} /> : null}
    </div>
  );
}

function ReporterDetails({ report }: { report: IncidentHazardReport }) {
  return (
    <FormSection title="Reporter Details">
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
    <FormSection title="Report Details">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Report Reference" value={report.id} disabled />
        <FormInput label="Report Type" defaultValue={report.reportType} disabled={!editable} />
        <FormInput label="Location" defaultValue={report.location} disabled={!editable} />
        <FormInput label="Date/Time Observed" defaultValue={report.dateTimeObserved} disabled={!editable} />
        <FormInput label="Related Work Authorization" defaultValue={report.relatedWorkAuthorization} disabled={!editable} />
        <FormInput label="Priority/Urgency" defaultValue={report.priority} disabled={!editable} />
      </div>
    </FormSection>
  );
}

function IncidentDetails({ report, editable }: { report: IncidentHazardReport; editable: boolean }) {
  return (
    <FormSection title="Incident / Hazard Details">
      <div className="grid gap-4 md:grid-cols-2">
        <FormTextarea label="Description" defaultValue={report.description} disabled={!editable} className="md:col-span-2" />
        <FormInput label="Severity Estimate" defaultValue={report.severityEstimate} disabled={!editable} />
        <ReadOnlyYesNo label="Was anyone injured?" value={report.anyoneInjured} editable={editable} />
        <ReadOnlyYesNo label="Was equipment/property damaged?" value={report.propertyDamaged} editable={editable} />
        <ReadOnlyYesNo label="Is there gas/fire/environmental concern?" value={report.gasFireEnvironmentalConcern} editable={editable} />
        <FormTextarea label="Immediate Action Taken" defaultValue={report.immediateActionTaken} disabled={!editable} className="md:col-span-2" />
        <FormTextarea label="People Involved / Witnesses" defaultValue={report.peopleInvolved} disabled={!editable} />
        <FormTextarea label="Additional Notes" defaultValue={report.additionalNotes} disabled={!editable} />
      </div>
    </FormSection>
  );
}

function EvidenceSection({ report }: { report: IncidentHazardReport }) {
  return (
    <FormSection title="Evidence / Attachments">
      <AttachmentList attachments={report.attachments} />
    </FormSection>
  );
}

function HseReviewAction({
  comment,
  onCommentChange,
  correctiveActionRequired,
  onCorrectiveActionRequiredChange,
  onDecision,
}: {
  comment: string;
  onCommentChange: (comment: string) => void;
  correctiveActionRequired: string;
  onCorrectiveActionRequiredChange: (value: string) => void;
  onDecision: (decision: "Resolved" | "Not Resolved") => void;
}) {
  return (
    <FormSection title="HSE Review & Corrective Action">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="HSE Inspector" value="Samuel Bassey" disabled />
        <FormSelect label="Confirmed Report Type" required options={toOptions(reportTypeOptions)} placeholder="Select confirmed report type" />
        <FormSelect label="Confirmed Severity" required options={toOptions(incidentPriorityOptions)} placeholder="Select confirmed severity" />
        <FormTextarea label="HSE Findings" required placeholder="Add HSE findings" />
        <FormTextarea label="Root Cause / Likely Cause" placeholder="Optional" />
        <FormToggleGroup
          label="Corrective Action Required?"
          required
          options={yesNoOptions}
          value={correctiveActionRequired}
          onValueChange={onCorrectiveActionRequiredChange}
        />
        {correctiveActionRequired === "Yes" ? (
          <>
            <FormTextarea label="Corrective Action Details" required placeholder="Describe corrective action" />
            <FormSelect label="Action Owner" required searchable options={employeeOptions} placeholder="Select owner" />
            <FormDatePicker label="Target Completion Date" required />
          </>
        ) : null}
        <FormSelect label="HSE Resolution" required options={hseDecisionOptions} placeholder="Select resolution" />
        <FormTextarea
          label="HSE Comment"
          value={comment}
          onChange={(event) => onCommentChange(event.target.value)}
          placeholder="Add HSE comment"
        />
        <FormInput label="HSE Review Date/Time" value="2026-05-18 10:00 AM" disabled />
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" onClick={() => onDecision("Resolved")}>Resolved</Button>
        <Button type="button" variant="outline" onClick={() => onDecision("Not Resolved")}>Not Resolved</Button>
      </div>
    </FormSection>
  );
}

function HseReviewResult({ review }: { review: IncidentHazardHseReview }) {
  return (
    <FormSection title="HSE Review & Corrective Action">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="HSE Inspector" value={review.inspector} disabled />
        <FormInput label="Confirmed Report Type" value={review.confirmedReportType} disabled />
        <FormInput label="Confirmed Severity" value={review.confirmedSeverity} disabled />
        <FormTextarea label="HSE Findings" value={review.findings} disabled />
        <FormTextarea label="Root Cause / Likely Cause" value={review.rootCause} disabled />
        <ReadOnlyYesNo label="Corrective Action Required?" value={review.correctiveActionRequired} editable={false} />
        {review.correctiveActionRequired ? (
          <>
            <FormTextarea label="Corrective Action Details" value={review.correctiveActionDetails} disabled />
            <FormInput label="Action Owner" value={review.actionOwner} disabled />
            <FormInput label="Target Completion Date" value={review.targetCompletionDate} disabled />
          </>
        ) : null}
        <FormInput label="HSE Resolution" value={review.decision} disabled />
        <FormTextarea label="HSE Comment" value={review.comment} disabled />
        <FormInput label="HSE Review Date/Time" value={review.reviewDateTime} disabled />
      </div>
    </FormSection>
  );
}

function ReadOnlyYesNo({ label, value, editable }: { label: string; value: boolean | null; editable: boolean }) {
  return (
    <FormToggleGroup
      label={label}
      value={value === null ? "" : value ? "Yes" : "No"}
      options={yesNoOptions}
      disabled={!editable}
    />
  );
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
    <FormSection title="Audit Trail">
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
    note = currentRole === "hse" ? "This report is waiting for HSE review." : "Waiting for HSE review.";
  } else if (report.status === "draft" && currentRole === "hse") {
    note = "This report is still in draft and has not been submitted.";
  } else if (report.status === "approved") {
    note = "This report has been resolved by HSE.";
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
    approved: "Resolved",
  };

  const classByStatus: Record<IncidentHazardStatus, string> = {
    draft: "bg-gray-100 text-gray-600",
    submitted: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${classByStatus[status]}`}>
      {labelByStatus[status]}
    </span>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-brand-border bg-white p-5 md:p-6">
      <h3 className="mb-5 text-base font-semibold text-brand-text-primary">{title}</h3>
      {children}
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

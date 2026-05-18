"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, FileText, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import Button from "@/components/ui/Button";
import FormFileUpload from "@/components/forms/FormFileUpload";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import MockUserSwitcher from "./MockUserSwitcher";
import {
  cloneWorkCloseOutRequest,
  getMockWorkCloseOutRequest,
} from "@/lib/mock/work-close-out";
import type {
  WorkAuthorizationApprovalResult,
  WorkAuthorizationAttachment,
  WorkAuthorizationAuditTrailItem,
  WorkAuthorizationRole,
  WorkCloseOutHseApproval,
  WorkCloseOutRequest,
} from "@/types/safety";

const yesNoOptions = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

const yesNoNaOptions = [...yesNoOptions, { value: "N/A", label: "N/A" }];

const decisionOptions = [
  { value: "Approve", label: "Approve" },
  { value: "Return", label: "Return" },
  { value: "Reject", label: "Reject" },
];

export default function WorkCloseOutDetailsView({ requestId }: { requestId: string }) {
  const router = useRouter();
  const initialRequest = getMockWorkCloseOutRequest(requestId);
  const [currentRole, setCurrentRole] = useState<WorkAuthorizationRole>("requester");
  const [request, setRequest] = useState<WorkCloseOutRequest | null>(
    initialRequest ? cloneWorkCloseOutRequest(initialRequest) : null
  );
  const [supervisorComment, setSupervisorComment] = useState("");
  const [hseComment, setHseComment] = useState("");

  const permissions = useMemo(() => {
    const isDraft = request?.status === "draft";
    const isSubmitted = request?.status === "submitted";
    const isPendingApproval = request?.status === "pending_approval";
    const isApproved = request?.status === "approved";

    return {
      canRequesterEdit: currentRole === "requester" && isDraft,
      canSupervisorApprove: currentRole === "supervisor" && isSubmitted,
      canHseApprove: currentRole === "hse" && isPendingApproval,
      showSupervisorApproval: Boolean(isPendingApproval || isApproved),
      showHseApproval: Boolean(isPendingApproval || isApproved),
      showAuditTrail: Boolean(!isDraft || isApproved),
    };
  }, [currentRole, request?.status]);

  if (!request) {
    return (
      <div className="rounded-2xl border border-brand-border bg-white p-6">
        <p className="text-sm text-brand-text-secondary">Work close-out request not found.</p>
      </div>
    );
  }

  function addAudit(item: WorkAuthorizationAuditTrailItem) {
    setRequest((current) =>
      current ? { ...current, auditTrail: [...current.auditTrail, item] } : current
    );
  }

  function submitCloseOut() {
    setRequest((current) =>
      current ? { ...current, status: "submitted" } : current
    );
    addAudit({
      action: "Submitted",
      actor: request.requester.name,
      role: "Requester",
      dateTime: "2026-05-18 02:30 PM",
      comment: "Work completion submitted for close-out.",
    });
  }

  function supervisorDecision(decision: "Approve" | "Return" | "Reject") {
    const approval: WorkAuthorizationApprovalResult = {
      decision,
      approver: request.workAuthorization.supervisor,
      dateTime: "2026-05-18 03:00 PM",
      comment:
        supervisorComment ||
        (decision === "Approve"
          ? "Completion reviewed and accepted."
          : `Close-out ${decision.toLowerCase()}ed by supervisor.`),
    };

    setRequest((current) =>
      current
        ? {
            ...current,
            status: decision === "Approve" ? "pending_approval" : current.status,
            supervisorApproval: approval,
          }
        : current
    );
    addAudit({
      action: decision === "Approve" ? "Supervisor Approved" : `Supervisor ${decision}ed`,
      actor: approval.approver,
      role: "Supervisor",
      dateTime: approval.dateTime,
      comment: approval.comment,
    });
  }

  function hseDecision(decision: "Approve" | "Return" | "Reject") {
    const approval: WorkCloseOutHseApproval = {
      inspector: request.workAuthorization.hseApprover,
      verifiedCloseOut: true,
      areaSafeForOperations: true,
      correctiveActionRequired: false,
      correctiveActionDetails: "",
      decision,
      comment:
        hseComment ||
        (decision === "Approve"
          ? "Area verified safe. Close-out approved."
          : `Close-out ${decision.toLowerCase()}ed by HSE.`),
      dateTime: "2026-05-18 03:40 PM",
    };

    setRequest((current) =>
      current
        ? {
            ...current,
            status: decision === "Approve" ? "approved" : current.status,
            hseApproval: approval,
          }
        : current
    );
    addAudit({
      action: decision === "Approve" ? "HSE Approved" : `HSE ${decision}ed`,
      actor: approval.inspector,
      role: "HSE Inspector",
      dateTime: approval.dateTime,
      comment: approval.comment,
    });
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => router.push("/safety/work-close-out")}
        className="flex items-center gap-2 text-sm text-brand-text-secondary transition-colors hover:text-brand-text-primary"
      >
        <ArrowLeft size={14} />
        Back to Work Close-Out
      </button>

      <MockUserSwitcher value={currentRole} onChange={setCurrentRole} />

      <section className="rounded-2xl border border-brand-border bg-white p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-text-secondary">
              Work Completion & Close-Out
            </p>
            <h2 className="mt-1 text-xl font-semibold text-brand-text-primary">{request.id}</h2>
            <p className="mt-1 text-sm text-brand-text-secondary">
              {request.title}
            </p>
          </div>
          <ApprovalBadge status={request.status} />
        </div>
      </section>

      <StatusNote request={request} currentRole={currentRole} />
      <RequesterDetails request={request} />
      <ApprovedWorkSummary request={request} />
      <CompletionDetails request={request} editable={permissions.canRequesterEdit} />
      <MonitoringSection request={request} editable={permissions.canRequesterEdit} />
      <AreaConditionSection request={request} editable={permissions.canRequesterEdit} />

      {permissions.canRequesterEdit ? (
        <div className="flex justify-end">
          <Button type="button" onClick={submitCloseOut}>
            Submit Close-Out
          </Button>
        </div>
      ) : null}

      {permissions.canSupervisorApprove ? (
        <FormSection title="Supervisor Close-Out Approval">
          <div className="space-y-4">
            <FormInput label="Supervisor" value={request.workAuthorization.supervisor} disabled />
            <FormTextarea
              label="Supervisor Comment"
              value={supervisorComment}
              placeholder="Add close-out review notes"
              onChange={(event) => setSupervisorComment(event.target.value)}
            />
            <DecisionButtons onDecision={supervisorDecision} />
          </div>
        </FormSection>
      ) : permissions.showSupervisorApproval && request.supervisorApproval ? (
        <SupervisorResult result={request.supervisorApproval} />
      ) : null}

      {permissions.canHseApprove ? (
        <FormSection title="HSE Final Close-Out Approval">
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput label="HSE Inspector" value={request.workAuthorization.hseApprover} disabled />
            <FormSelect label="Did HSE inspect/verify close-out?" options={yesNoOptions} defaultValue="Yes" />
            <FormSelect label="Area safe for normal operations?" options={yesNoOptions} defaultValue="Yes" />
            <FormSelect label="Corrective action required?" options={yesNoOptions} defaultValue="No" />
            <FormTextarea
              label="HSE Comment"
              value={hseComment}
              placeholder="Add final close-out verification notes"
              onChange={(event) => setHseComment(event.target.value)}
              className="md:col-span-2"
            />
          </div>
          <div className="mt-4">
            <DecisionButtons onDecision={hseDecision} />
          </div>
        </FormSection>
      ) : permissions.showHseApproval && request.hseApproval ? (
        <HseResult result={request.hseApproval} />
      ) : null}

      {permissions.showAuditTrail ? <AuditTrail items={request.auditTrail} /> : null}
    </div>
  );
}

function RequesterDetails({ request }: { request: WorkCloseOutRequest }) {
  return (
    <FormSection title="Requester Details">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Requester Name" value={request.requester.name} disabled />
        <FormInput label="Department" value={request.requester.department} disabled />
        <FormInput label="Job Title / Role" value={request.requester.role} disabled />
        <FormInput label="Request Date" value={request.requester.requestDate} disabled />
      </div>
    </FormSection>
  );
}

function ApprovedWorkSummary({ request }: { request: WorkCloseOutRequest }) {
  const work = request.workAuthorization;
  return (
    <FormSection title="Approved Work Summary">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Work Authorization Reference" value={work.id} disabled />
        <FormInput label="Work Authorization Title" value={work.title} disabled />
        <FormInput label="Original Requester" value={work.requester} disabled />
        <FormInput label="Department" value={work.department} disabled />
        <FormInput label="Work Location" value={work.location} disabled />
        <FormInput label="Exact Work Area" value={work.exactWorkArea} disabled />
        <FormInput label="Approved Start Date/Time" value={work.approvedStartDateTime} disabled />
        <FormInput label="Approved End Date/Time" value={work.approvedEndDateTime} disabled />
        <FormInput label="Approved Work Type" value={work.workTypes.join(", ")} disabled />
        <FormInput label="Approved Supervisor" value={work.supervisor} disabled />
        <FormInput label="HSE Approver" value={work.hseApprover} disabled />
      </div>
    </FormSection>
  );
}

function CompletionDetails({
  request,
  editable,
}: {
  request: WorkCloseOutRequest;
  editable: boolean;
}) {
  const details = request.completionDetails;
  return (
    <FormSection title="Completion Details">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Actual Start Date/Time" value={details.actualStartDateTime} disabled={!editable} />
        <FormInput label="Actual Completion Date/Time" value={details.actualCompletionDateTime} disabled={!editable} />
        <ReadOnlyYesNo label="Was work completed?" value={details.workCompleted} editable={editable} />
        <ReadOnlyYesNo label="Was work completed as approved?" value={details.completedAsApproved} editable={editable} />
        {!details.completedAsApproved ? (
          <FormTextarea label="Explanation for change/deviation" value={details.deviationExplanation} disabled={!editable} />
        ) : null}
        <FormTextarea label="Completion Summary" value={details.completionSummary} disabled={!editable} className="md:col-span-2" />
        <ReadOnlyYesNo label="Any incident, hazard, or near miss observed?" value={details.incidentObserved} editable={editable} />
        {details.incidentObserved ? (
          <FormTextarea label="Incident/Hazard Note" value={details.incidentNote} disabled={!editable} />
        ) : null}
        <FormTextarea label="Completion Notes" value={details.completionNotes} disabled={!editable} className="md:col-span-2" />
      </div>
      <div className="mt-4">
        <AttachmentList attachments={details.completionEvidence} />
        {editable ? (
          <div className="mt-4">
            <FormFileUpload label="Completion Evidence" accept="image/*,.pdf,.doc,.docx" multiple />
          </div>
        ) : null}
      </div>
    </FormSection>
  );
}

function MonitoringSection({
  request,
  editable,
}: {
  request: WorkCloseOutRequest;
  editable: boolean;
}) {
  const monitoring = request.monitoring;
  return (
    <FormSection title="Monitoring Attestation">
      <div className="grid gap-4 md:grid-cols-2">
        <ReadOnlyYesNo label="Work was monitored during execution" value={monitoring.monitoredDuringExecution} editable={editable} />
        <ReadOnlyYesNo label="Work stayed within approved scope" value={monitoring.stayedWithinScope} editable={editable} />
        <ReadOnlyYesNo label="Required PPE and safety controls were maintained" value={monitoring.ppeAndControlsMaintained} editable={editable} />
        <FormSelect label="Unsafe condition was reported/addressed if noticed" value={monitoring.unsafeConditionAddressed} options={yesNoNaOptions} disabled={!editable} />
        <FormTextarea label="Monitoring Comment" value={monitoring.monitoringComment} disabled={!editable} className="md:col-span-2" />
      </div>
    </FormSection>
  );
}

function AreaConditionSection({
  request,
  editable,
}: {
  request: WorkCloseOutRequest;
  editable: boolean;
}) {
  const area = request.areaCondition;
  return (
    <FormSection title="Area / Equipment Condition">
      <div className="grid gap-4 md:grid-cols-2">
        <ReadOnlyYesNo label="Work area cleaned after completion" value={area.workAreaCleaned} editable={editable} />
        <ReadOnlyYesNo label="Tools/equipment removed from work area" value={area.toolsRemoved} editable={editable} />
        <ReadOnlyYesNo label="Vehicle/equipment/system left in safe condition" value={area.systemSafe} editable={editable} />
        <ReadOnlyYesNo label="Any remaining hazard?" value={area.remainingHazard} editable={editable} />
        {area.remainingHazard ? (
          <FormTextarea label="Remaining Hazard Details" value={area.remainingHazardDetails} disabled={!editable} className="md:col-span-2" />
        ) : null}
      </div>
    </FormSection>
  );
}

function ReadOnlyYesNo({
  label,
  value,
  editable,
}: {
  label: string;
  value: boolean;
  editable: boolean;
}) {
  return (
    <FormSelect
      label={label}
      value={value ? "Yes" : "No"}
      options={yesNoOptions}
      disabled={!editable}
    />
  );
}

function SupervisorResult({ result }: { result: WorkAuthorizationApprovalResult }) {
  return (
    <FormSection title="Supervisor Close-Out Approval Result">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Supervisor" value={result.approver} disabled />
        <FormInput label="Supervisor Decision" value={result.decision} disabled />
        <FormInput label="Supervisor Approval Date/Time" value={result.dateTime} disabled />
        <FormTextarea label="Supervisor Comment" value={result.comment} disabled />
      </div>
    </FormSection>
  );
}

function HseResult({ result }: { result: WorkCloseOutHseApproval }) {
  return (
    <FormSection title="HSE Final Close-Out Approval Result">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="HSE Inspector" value={result.inspector} disabled />
        <ReadOnlyYesNo label="Did HSE inspect/verify close-out?" value={result.verifiedCloseOut} editable={false} />
        <ReadOnlyYesNo label="Area safe for normal operations?" value={result.areaSafeForOperations} editable={false} />
        <ReadOnlyYesNo label="Corrective action required?" value={result.correctiveActionRequired} editable={false} />
        {result.correctiveActionRequired ? (
          <FormTextarea label="Corrective Action Details" value={result.correctiveActionDetails} disabled />
        ) : null}
        <FormInput label="HSE Decision" value={result.decision} disabled />
        <FormInput label="HSE Approval Date/Time" value={result.dateTime} disabled />
        <FormTextarea label="HSE Comment" value={result.comment} disabled />
      </div>
    </FormSection>
  );
}

function DecisionButtons({
  onDecision,
}: {
  onDecision: (decision: "Approve" | "Return" | "Reject") => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {decisionOptions.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={option.value === "Approve" ? "primary" : option.value === "Reject" ? "danger" : "outline"}
          onClick={() => onDecision(option.value as "Approve" | "Return" | "Reject")}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

function AttachmentList({ attachments }: { attachments: WorkAuthorizationAttachment[] }) {
  if (attachments.length === 0) {
    return <p className="text-sm text-brand-text-secondary">No completion evidence.</p>;
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

function StatusNote({
  request,
  currentRole,
}: {
  request: WorkCloseOutRequest;
  currentRole: WorkAuthorizationRole;
}) {
  let note = "";

  if (request.status === "submitted") {
    note =
      currentRole === "supervisor"
        ? "This close-out is waiting for your supervisor review."
        : currentRole === "hse"
          ? "Waiting for supervisor approval before HSE close-out verification."
          : "Waiting for supervisor close-out approval.";
  } else if (request.status === "pending_approval") {
    note =
      currentRole === "hse"
        ? "Supervisor approved. HSE final close-out approval is available."
        : "Waiting for HSE final close-out approval.";
  } else if (request.status === "draft" && currentRole !== "requester") {
    note = "This close-out is still in draft and has not been submitted.";
  }

  if (!note) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      {note}
    </div>
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

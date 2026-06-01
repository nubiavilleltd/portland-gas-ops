"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, FileText, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import Button from "@/components/ui/Button";
import FileDropzone from "@/components/ui/FileDropzone";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import WorkCloseOutRoleSwitcher from "./WorkCloseOutRoleSwitcher";
import SafetyChoiceTable from "./SafetyChoiceTable";
import {
  getMockWorkCloseOutRequest,
} from "@/lib/mock/work-close-out";
import {
  updateWorkCloseOut,
  useSafetyDemoData,
} from "@/lib/safety-demo-store";
import type {
  WorkAuthorizationApprovalResult,
  WorkAuthorizationAttachment,
  WorkAuthorizationAuditTrailItem,
  WorkCloseOutHseApproval,
  WorkCloseOutRole,
  WorkCloseOutRequest,
} from "@/types/safety";

const yesNoOptions = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

const yesNoNaOptions = [...yesNoOptions, { value: "N/A", label: "N/A" }];

function decisionPastTense(decision: "Approve" | "Return" | "Deny") {
  if (decision === "Deny") return "denied";
  return `${decision.toLowerCase()}ed`;
}

export default function WorkCloseOutDetailsView({ requestId }: { requestId: string }) {
  const router = useRouter();
  const initialRequest = getMockWorkCloseOutRequest(requestId);
  const { workCloseOuts } = useSafetyDemoData();
  const request = workCloseOuts.find((item) => item.id === requestId) ?? initialRequest;
  const [currentRole, setCurrentRole] = useState<WorkCloseOutRole>("requester");
  const [supervisorComment, setSupervisorComment] = useState("");
  const [operationsHeadComment, setOperationsHeadComment] = useState("");
  const [hseComment, setHseComment] = useState("");
  const [hseVerifiedCloseOut, setHseVerifiedCloseOut] = useState("");
  const [hseAreaSafe, setHseAreaSafe] = useState("");
  const [hseCorrectiveActionRequired, setHseCorrectiveActionRequired] = useState("");
  const hseChecksIncomplete =
    !hseVerifiedCloseOut || !hseAreaSafe || !hseCorrectiveActionRequired;
  const hseApprovalBlocked =
    !hseChecksIncomplete &&
    (hseVerifiedCloseOut !== "Yes" ||
      hseAreaSafe !== "Yes" ||
      hseCorrectiveActionRequired === "Yes");

  const permissions = useMemo(() => {
    const isDraft = request?.status === "draft";
    const isSubmitted = request?.status === "submitted";
    const isPendingApproval = request?.status === "pending_approval";
    const isApproved = request?.status === "approved";
    const isReturned = request?.status === "returned";
    const isDenied = request?.status === "denied";

    return {
      canRequesterEdit: currentRole === "requester" && (isDraft || isReturned),
      canSupervisorApprove: currentRole === "supervisor" && isSubmitted,
      canOperationsHeadApprove:
        currentRole === "operations_head" &&
        isPendingApproval &&
        Boolean(request?.supervisorApproval) &&
        !request?.operationsHeadApproval,
      canHseApprove:
        currentRole === "hse" &&
        isPendingApproval &&
        Boolean(request?.operationsHeadApproval),
      showSupervisorApproval: Boolean(
        isPendingApproval || isApproved || isReturned || isDenied,
      ),
      showOperationsHeadApproval: Boolean(
        request?.operationsHeadApproval || isApproved || isReturned || isDenied,
      ),
      showHseApproval: Boolean(
        request?.hseApproval || isApproved || isReturned || isDenied,
      ),
      showAuditTrail: Boolean(!isDraft || isApproved || isReturned || isDenied),
    };
  }, [
    currentRole,
    request?.status,
    request?.supervisorApproval,
    request?.operationsHeadApproval,
    request?.hseApproval,
  ]);

  if (!request) {
    return (
      <div className="rounded-2xl border border-brand-border bg-white p-6">
        <p className="text-sm text-brand-text-secondary">Work close-out request not found.</p>
      </div>
    );
  }
  const persistedRequestId = request.id;

  function persistUpdate(
    update: (current: WorkCloseOutRequest) => WorkCloseOutRequest,
  ) {
    const updated = updateWorkCloseOut(persistedRequestId, update);
    return updated;
  }

  function submitCloseOut() {
    if (!request) return;

    const audit: WorkAuthorizationAuditTrailItem = {
      action: "Submitted",
      actor: request.requester.name,
      role: "Requester",
      dateTime: "2026-05-18 02:30 PM",
      comment: "Work completion submitted for close-out.",
    };
    persistUpdate((current) => ({
      ...current,
      status: "submitted",
      auditTrail: [...current.auditTrail, audit],
    }));
  }

  function supervisorDecision(decision: "Approve" | "Return" | "Deny") {
    if (!request) return;
    if ((decision === "Return" || decision === "Deny") && !supervisorComment.trim()) return;

    const approval: WorkAuthorizationApprovalResult = {
      decision,
      approver: request.workAuthorization.supervisor,
      dateTime: "2026-05-18 03:00 PM",
      comment:
        supervisorComment ||
        (decision === "Approve"
          ? "Completion reviewed and accepted."
          : `Close-out ${decisionPastTense(decision)} by supervisor.`),
    };

    const audit: WorkAuthorizationAuditTrailItem = {
      action: decision === "Approve" ? "Supervisor Approved" : `Supervisor ${decision}ed`,
      actor: approval.approver,
      role: "Supervisor",
      dateTime: approval.dateTime,
      comment: approval.comment,
    };
    persistUpdate((current) => ({
      ...current,
      status:
        decision === "Approve"
          ? "pending_approval"
          : decision === "Return"
            ? "returned"
            : "denied",
      supervisorApproval: approval,
      auditTrail: [...current.auditTrail, audit],
    }));
  }

  function hseDecision(decision: "Approve" | "Return" | "Deny") {
    if (!request) return;
    if (hseChecksIncomplete) return;
    if (decision === "Approve" && hseApprovalBlocked) return;
    if ((decision === "Return" || decision === "Deny") && !hseComment.trim()) return;

    const approval: WorkCloseOutHseApproval = {
      inspector: request.workAuthorization.hseApprover,
      verifiedCloseOut: hseVerifiedCloseOut === "Yes",
      areaSafeForOperations: hseAreaSafe === "Yes",
      correctiveActionRequired: hseCorrectiveActionRequired === "Yes",
      correctiveActionDetails: "",
      decision,
      comment:
        hseComment ||
        (decision === "Approve"
          ? "Area verified safe. Close-out approved."
          : `Close-out ${decisionPastTense(decision)} by HSE.`),
      dateTime: "2026-05-18 03:40 PM",
    };

    const audit: WorkAuthorizationAuditTrailItem = {
      action: decision === "Approve" ? "HSE Approved" : `HSE ${decision}ed`,
      actor: approval.inspector,
      role: "HSE Inspector",
      dateTime: approval.dateTime,
      comment: approval.comment,
    };
    persistUpdate((current) => ({
      ...current,
      status:
        decision === "Approve"
          ? "approved"
          : decision === "Return"
            ? "returned"
            : "denied",
      hseApproval: approval,
      auditTrail: [...current.auditTrail, audit],
    }));
  }

  function operationsHeadDecision(decision: "Approve" | "Return" | "Deny") {
    if (!request) return;
    if ((decision === "Return" || decision === "Deny") && !operationsHeadComment.trim()) return;

    const approval: WorkAuthorizationApprovalResult = {
      decision,
      approver: "Grace Bello",
      dateTime: "2026-05-18 03:20 PM",
      comment:
        operationsHeadComment ||
        (decision === "Approve"
          ? "Completion reviewed and recommended for HSE verification."
          : `Close-out ${decisionPastTense(decision)} by Operations Head.`),
    };

    const audit: WorkAuthorizationAuditTrailItem = {
      action: decision === "Approve" ? "Operations Head Approved" : `Operations Head ${decision}ed`,
      actor: approval.approver,
      role: "Operations Head",
      dateTime: approval.dateTime,
      comment: approval.comment,
    };
    persistUpdate((current) => ({
      ...current,
      status:
        decision === "Approve"
          ? "pending_approval"
          : decision === "Return"
            ? "returned"
            : "denied",
      operationsHeadApproval: approval,
      auditTrail: [...current.auditTrail, audit],
    }));
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

      <WorkCloseOutRoleSwitcher value={currentRole} onChange={setCurrentRole} />

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
        <FormSection title="Supervisor Close-Out Approval" description="Review the reported completion and record your supervisor decision.">
          <div className="grid gap-4 md:grid-cols-[minmax(220px,360px)_1fr] md:items-start">
            <div className="space-y-4">
              <FormInput label="Supervisor" value={request.workAuthorization.supervisor} disabled />
              <DecisionSubmitControl
                onDecision={supervisorDecision}
                reasonMissing={!supervisorComment.trim()}
                reasonMessage="Add a supervisor comment before returning or denying this close-out."
              />
            </div>
            <FormTextarea
              label="Supervisor Comment"
              value={supervisorComment}
              placeholder="Add close-out review notes"
              onChange={(event) => setSupervisorComment(event.target.value)}
            />
          </div>
        </FormSection>
      ) : permissions.showSupervisorApproval && request.supervisorApproval ? (
        <ApprovalResult title="Supervisor Close-Out Approval Result" result={request.supervisorApproval} />
      ) : null}

      {permissions.canOperationsHeadApprove ? (
        <FormSection title="Operations Head Close-Out Approval" description="Confirm the completed work is acceptable for final HSE review.">
          <div className="grid gap-4 md:grid-cols-[minmax(220px,360px)_1fr] md:items-start">
            <div className="space-y-4">
              <FormInput label="Operations Head" value="Grace Bello" disabled />
              <DecisionSubmitControl
                onDecision={operationsHeadDecision}
                reasonMissing={!operationsHeadComment.trim()}
                reasonMessage="Add an Operations Head comment before returning or denying this close-out."
              />
            </div>
            <FormTextarea
              label="Operations Head Comment"
              value={operationsHeadComment}
              placeholder="Add operational close-out review notes"
              onChange={(event) => setOperationsHeadComment(event.target.value)}
            />
          </div>
        </FormSection>
      ) : permissions.showOperationsHeadApproval && request.operationsHeadApproval ? (
        <ApprovalResult title="Operations Head Close-Out Approval Result" result={request.operationsHeadApproval} />
      ) : null}

      {permissions.canHseApprove ? (
        <FormSection title="HSE Final Close-Out Approval" description="Verify site safety and complete the final close-out decision.">
          <div className="grid gap-4">
            <FormInput label="HSE Inspector" value={request.workAuthorization.hseApprover} disabled />
            <SafetyChoiceTable
              options={yesNoOptions}
              rows={[
                {
                  label: "Did HSE inspect/verify close-out?",
                  required: true,
                  value: hseVerifiedCloseOut,
                  onValueChange: setHseVerifiedCloseOut,
                },
                {
                  label: "Area safe for normal operations?",
                  required: true,
                  value: hseAreaSafe,
                  onValueChange: setHseAreaSafe,
                },
                {
                  label: "Corrective action required?",
                  required: true,
                  value: hseCorrectiveActionRequired,
                  onValueChange: setHseCorrectiveActionRequired,
                },
              ]}
            />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(220px,360px)_1fr] md:items-start">
            <DecisionSubmitControl
              onDecision={hseDecision}
              reasonMissing={!hseComment.trim()}
              reasonMessage="Add an HSE comment before returning or denying this close-out."
              submissionDisabled={hseChecksIncomplete}
              submissionDisabledMessage="Complete all HSE close-out checks before submitting a decision."
              disableApprove={hseApprovalBlocked}
              disableApproveMessage="Approval is disabled unless close-out is verified, the area is safe, and no corrective action is required."
            />
            <FormTextarea
              label="HSE Comment"
              value={hseComment}
              placeholder="Add final close-out verification notes"
              onChange={(event) => setHseComment(event.target.value)}
            />
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
    <FormSection title="Requester Details" description="Employee information for the person who raised this close-out.">
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
    <FormSection title="Approved Work Summary" description="Approved work authorization details linked to this completion request.">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Work Authorization Reference" value={work.id} disabled />
        <FormInput label="Work Authorization Title" value={work.title} disabled />
        <FormInput label="Original Requester" value={work.requester} disabled />
        <FormInput label="Department" value={work.department} disabled />
        <FormInput label="Work Location" value={work.location} disabled />
        <FormTextarea label="Exact Work Area" value={work.exactWorkArea} disabled />
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
  const [completionEvidence, setCompletionEvidence] = useState<File[]>([]);

  return (
    <FormSection title="Completion Details" description="Recorded completion information and submitted evidence.">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Actual Start Date/Time" value={details.actualStartDateTime} disabled={!editable} />
        <FormInput label="Actual Completion Date/Time" value={details.actualCompletionDateTime} disabled={!editable} />
        <div className="md:col-span-2">
          <SafetyChoiceTable
            options={yesNoOptions}
            disabled={!editable}
            rows={[
              { label: "Was work completed?", value: booleanToYesNo(details.workCompleted) },
              { label: "Was work completed as approved?", value: booleanToYesNo(details.completedAsApproved) },
              { label: "Any incident, hazard, or near miss observed?", value: booleanToYesNo(details.incidentObserved) },
            ]}
          />
        </div>
        {!details.completedAsApproved ? (
          <FormTextarea label="Explanation for change/deviation" value={details.deviationExplanation} disabled={!editable} />
        ) : null}
        <FormTextarea label="Completion Summary" value={details.completionSummary} disabled={!editable} className="md:col-span-2" />
        {details.incidentObserved ? (
          <FormTextarea label="Incident/Hazard Note" value={details.incidentNote} disabled={!editable} />
        ) : null}
        {/* <FormTextarea label="Completion Notes" value={details.completionNotes} disabled={!editable} className="md:col-span-2" /> */}
      </div>
      <div className="mt-4">
        <AttachmentList attachments={details.completionEvidence} />
        {editable ? (
          <div className="mt-4">
            <FileDropzone
              label="Completion Evidence"
              value={completionEvidence}
              onChange={setCompletionEvidence}
              accept="image/*,.pdf,.doc,.docx"
              maxFiles={10}
            />
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
    <FormSection title="Monitoring Attestation" description="Confirmation of monitoring and safety-control compliance during work.">
      <SafetyChoiceTable
        options={yesNoNaOptions}
        disabled={!editable}
        rows={[
          { label: "Work was monitored during execution", value: booleanToYesNo(monitoring.monitoredDuringExecution) },
          { label: "Work stayed within approved scope", value: booleanToYesNo(monitoring.stayedWithinScope) },
          { label: "Required PPE and safety controls were maintained", value: booleanToYesNo(monitoring.ppeAndControlsMaintained) },
          { label: "Unsafe condition was reported/addressed if noticed", value: monitoring.unsafeConditionAddressed },
        ]}
      />
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
    <FormSection title="Area / Equipment Condition" description="Condition of the site and equipment after work completion.">
      <div className="space-y-4">
        <SafetyChoiceTable
          options={yesNoOptions}
          disabled={!editable}
          rows={[
            { label: "Work area cleaned after completion", value: booleanToYesNo(area.workAreaCleaned) },
            { label: "Tools/equipment removed from work area", value: booleanToYesNo(area.toolsRemoved) },
            { label: "Vehicle/equipment/system left in safe condition", value: booleanToYesNo(area.systemSafe) },
            { label: "Any remaining hazard?", value: booleanToYesNo(area.remainingHazard) },
          ]}
        />
        {area.remainingHazard ? (
          <FormTextarea label="Remaining Hazard Details" value={area.remainingHazardDetails} disabled={!editable} className="md:col-span-2" />
        ) : null}
      </div>
    </FormSection>
  );
}

function booleanToYesNo(value: boolean) {
  return value ? "Yes" : "No";
}

function ApprovalResult({
  result,
  title,
}: {
  result: WorkAuthorizationApprovalResult;
  title: string;
}) {
  return (
    <FormSection title={title} description="Recorded review decision and comments for this close-out.">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Approver" value={result.approver} disabled />
        <FormInput label="Decision" value={result.decision} disabled />
        <FormInput label="Approval Date/Time" value={result.dateTime} disabled />
        <FormTextarea label="Comment" value={result.comment} disabled />
      </div>
    </FormSection>
  );
}

function HseResult({ result }: { result: WorkCloseOutHseApproval }) {
  return (
    <FormSection title="HSE Final Close-Out Approval Result" description="Final HSE verification and close-out decision.">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="HSE Inspector" value={result.inspector} disabled />
        <div className="md:col-span-2">
          <SafetyChoiceTable
            options={yesNoOptions}
            disabled
            rows={[
              { label: "Did HSE inspect/verify close-out?", value: booleanToYesNo(result.verifiedCloseOut) },
              { label: "Area safe for normal operations?", value: booleanToYesNo(result.areaSafeForOperations) },
              { label: "Corrective action required?", value: booleanToYesNo(result.correctiveActionRequired) },
            ]}
          />
        </div>
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

function DecisionSubmitControl({
  onDecision,
  reasonMissing = false,
  reasonMessage,
  submissionDisabled = false,
  submissionDisabledMessage,
  disableApprove = false,
  disableApproveMessage,
}: {
  onDecision: (decision: "Approve" | "Return" | "Deny") => void;
  reasonMissing?: boolean;
  reasonMessage: string;
  submissionDisabled?: boolean;
  submissionDisabledMessage?: string;
  disableApprove?: boolean;
  disableApproveMessage?: string;
}) {
  return (
    <div className="space-y-3">
      {reasonMissing ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {reasonMessage}
        </p>
      ) : null}
      {submissionDisabled && submissionDisabledMessage ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {submissionDisabledMessage}
        </p>
      ) : null}
      {!submissionDisabled && disableApprove && disableApproveMessage ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {disableApproveMessage}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button type="button" disabled={submissionDisabled || disableApprove} onClick={() => onDecision("Approve")}>
          Approve
        </Button>
        <Button type="button" variant="secondary" disabled={reasonMissing || submissionDisabled} onClick={() => onDecision("Return")}>
          Return
        </Button>
        <Button type="button" variant="danger" disabled={reasonMissing || submissionDisabled} onClick={() => onDecision("Deny")}>
          Deny
        </Button>
      </div>
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
    <FormSection title="Audit Trail" description="Recorded workflow actions and comments for this close-out.">
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
  currentRole: WorkCloseOutRole;
}) {
  let note = "";

  if (request.status === "submitted") {
    note =
      currentRole === "supervisor"
        ? "This close-out is waiting for your supervisor review."
        : currentRole === "hse"
          ? "Waiting for supervisor approval before HSE close-out verification."
          : "Waiting for supervisor close-out approval.";
  } else if (request.status === "returned") {
    note =
      currentRole === "requester"
        ? "This close-out was returned. Review the comments, update the close-out, and resubmit."
        : "This close-out has been returned to the requester.";
  } else if (request.status === "denied") {
    note = "This close-out has been denied and is closed.";
  } else if (request.status === "pending_approval") {
    if (!request.operationsHeadApproval) {
      note =
        currentRole === "operations_head"
          ? "Supervisor approved. Operations Head close-out review is available."
          : "Supervisor approved. Waiting for Operations Head approval.";
    } else {
      note =
        currentRole === "hse"
          ? "Operations Head approved. HSE final close-out approval is available."
          : "Operations Head approved. Waiting for HSE final close-out approval.";
    }
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

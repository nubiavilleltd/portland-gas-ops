"use client";

import { useState } from "react";
import { ArrowLeft, FileText, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import ApprovalPanel from "@/components/ui/ApprovalPanel";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import Button from "@/components/ui/Button";
import FileDropzone from "@/components/ui/FileDropzone";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import AuditTrail from "@/components/forms/AuditTrail";
import RoleBasedRecordHeader from "@/components/ui/RoleBasedRecordHeader";
import { useToast } from "@/hooks/useToast";
import SafetyChoiceTable from "./SafetyChoiceTable";
import {
  getMockWorkCloseOutRequest,
} from "@/lib/mock/work-close-out";
import { isExceptionWorkCloseOut } from "@/lib/safety-demo-routing";
import { getWorkCloseOutNextActor } from "@/lib/safety-next-actor";
import {
  updateWorkCloseOut,
  useSafetyDemoData,
} from "@/lib/safety-demo-store";
import {
  useSafetyCurrentEmployee,
  type SafetyEmployeeProfile,
} from "@/lib/modules/safety/people";
import SafetyProcessFormSkeleton from "./SafetyProcessFormSkeleton";
import type {
  WorkAuthorizationAttachment,
  WorkAuthorizationAuditTrailItem,
  WorkCloseOutApprovalResult,
  WorkCloseOutDecision,
  WorkCloseOutHseApproval,
  WorkCloseOutRole,
  WorkCloseOutRequest,
} from "@/types/safety";

const yesNoOptions = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

const yesNoNaOptions = [...yesNoOptions, { value: "N/A", label: "N/A" }];
const workCloseOutRoles: { value: WorkCloseOutRole; label: string }[] = [
  { value: "requester", label: "Requester" },
  { value: "supervisor", label: "Supervisor" },
  { value: "operations_head", label: "Operations Head" },
  { value: "hse", label: "HSE Inspector" },
];

function decisionPastTense(decision: WorkCloseOutDecision) {
  if (decision === "Acknowledge") return "acknowledged";
  if (decision === "Deny") return "denied";
  return `${decision.toLowerCase()}ed`;
}

function isReturnOrDeny(decision: WorkCloseOutDecision) {
  return decision === "Return" || decision === "Deny";
}

export default function WorkCloseOutDetailsView({
  requestId,
}: {
  requestId: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const currentEmployeeQuery = useSafetyCurrentEmployee();
  const currentEmployee = currentEmployeeQuery.data;
  const initialRequest = getMockWorkCloseOutRequest(requestId);
  const { workCloseOuts } = useSafetyDemoData();
  const request = workCloseOuts.find((item) => item.id === requestId) ?? initialRequest;
  const isExceptionCloseOut = request ? isExceptionWorkCloseOut(request) : false;
  const isRequester = employeeMatchesName(currentEmployee, request?.requester.name);
  const isAssignedSupervisor = employeeMatchesName(
    currentEmployee,
    request?.workAuthorization.supervisor,
  );
  const isOperationsHead = isOperationsHeadEmployee(currentEmployee);
  const isHseEmployee = isHseDepartment(currentEmployee?.department);
  const hasDirectCloseOutAccess =
    isRequester || isAssignedSupervisor || isOperationsHead || isHseEmployee;
  const currentRole = getWorkCloseOutAccessRole({
    isRequester,
    isAssignedSupervisor,
    isOperationsHead,
    isHseEmployee,
  });
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

  const isDraft = request?.status === "draft";
  const isSubmitted = request?.status === "submitted";
  const isPending = request?.status === "pending";
  const isApproved = request?.status === "approved";
  const isAcknowledged = request?.status === "acknowledged";
  const isReturned = request?.status === "returned";
  const isDenied = request?.status === "denied";
  const permissions = {
    canRequesterEdit: isRequester && (isDraft || isReturned),
    canSupervisorApprove: isAssignedSupervisor && isSubmitted,
    canOperationsHeadApprove:
      isOperationsHead &&
      isPending &&
      Boolean(request?.supervisorApproval) &&
      !request?.operationsHeadApproval,
    canHseApprove:
      isHseEmployee &&
      isPending &&
      Boolean(request?.operationsHeadApproval),
    showSupervisorApproval: Boolean(
      isPending || isApproved || isAcknowledged || isReturned || isDenied,
    ),
    showOperationsHeadApproval: Boolean(
      request?.operationsHeadApproval || isApproved || isAcknowledged || isReturned || isDenied,
    ),
    showHseApproval: Boolean(
      request?.hseApproval || isApproved || isAcknowledged || isReturned || isDenied,
    ),
    showAuditTrail: Boolean(!isDraft || isApproved || isAcknowledged || isReturned || isDenied),
  };

  if (currentEmployeeQuery.isLoading) {
    return <SafetyProcessFormSkeleton sections={5} />;
  }

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
    toast.success("Close-out submitted.");
  }

  function supervisorDecision(decision: WorkCloseOutDecision) {
    if (!request) return;
    if (isExceptionCloseOut && decision === "Approve") return;
    if (!isExceptionCloseOut && decision === "Acknowledge") return;
    if (isReturnOrDeny(decision) && !supervisorComment.trim()) return;

    const approval: WorkCloseOutApprovalResult = {
      decision,
      approver: request.workAuthorization.supervisor,
      dateTime: "2026-05-18 03:00 PM",
      comment:
        supervisorComment ||
        (decision === "Approve"
          ? "Completion reviewed and accepted."
          : decision === "Acknowledge"
            ? "Exception close-out reviewed and acknowledged for audit."
          : `Close-out ${decisionPastTense(decision)} by supervisor.`),
    };

    const audit: WorkAuthorizationAuditTrailItem = {
      action:
        decision === "Approve"
          ? "Supervisor Approved"
          : decision === "Acknowledge"
            ? "Supervisor Acknowledged"
            : `Supervisor ${decision}ed`,
      actor: approval.approver,
      role: "Supervisor",
      dateTime: approval.dateTime,
      comment: approval.comment,
    };
    persistUpdate((current) => ({
      ...current,
      status:
        decision === "Approve" || decision === "Acknowledge"
          ? "pending"
          : decision === "Return"
            ? "returned"
            : "denied",
      supervisorApproval: approval,
      auditTrail: [...current.auditTrail, audit],
    }));
    showCloseOutDecisionToast(toast, decision, "Supervisor");
    routeBackToWorkCloseOutRequests(router);
  }

  function hseDecision(decision: WorkCloseOutDecision) {
    if (!request) return;
    if (hseChecksIncomplete) return;
    if (isExceptionCloseOut && decision === "Approve") return;
    if (!isExceptionCloseOut && decision === "Acknowledge") return;
    if (decision === "Approve" && hseApprovalBlocked) return;
    if (isReturnOrDeny(decision) && !hseComment.trim()) return;

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
          : decision === "Acknowledge"
            ? "Exception close-out verified and acknowledged for audit."
          : `Close-out ${decisionPastTense(decision)} by HSE.`),
      dateTime: "2026-05-18 03:40 PM",
    };

    const audit: WorkAuthorizationAuditTrailItem = {
      action:
        decision === "Approve"
          ? "HSE Approved"
          : decision === "Acknowledge"
            ? "HSE Acknowledged"
            : `HSE ${decision}ed`,
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
          : decision === "Acknowledge"
            ? "acknowledged"
          : decision === "Return"
            ? "returned"
            : "denied",
      hseApproval: approval,
      auditTrail: [...current.auditTrail, audit],
    }));
    showCloseOutDecisionToast(toast, decision, "HSE");
    routeBackToWorkCloseOutRequests(router);
  }

  function operationsHeadDecision(decision: WorkCloseOutDecision) {
    if (!request) return;
    if (isExceptionCloseOut && decision === "Approve") return;
    if (!isExceptionCloseOut && decision === "Acknowledge") return;
    if (isReturnOrDeny(decision) && !operationsHeadComment.trim()) return;

    const approval: WorkCloseOutApprovalResult = {
      decision,
      approver: "Grace Bello",
      dateTime: "2026-05-18 03:20 PM",
      comment:
        operationsHeadComment ||
        (decision === "Approve"
          ? "Completion reviewed and recommended for HSE verification."
          : decision === "Acknowledge"
            ? "Exception close-out acknowledged and sent for HSE verification."
          : `Close-out ${decisionPastTense(decision)} by Operations Head.`),
    };

    const audit: WorkAuthorizationAuditTrailItem = {
      action:
        decision === "Approve"
          ? "Operations Head Approved"
          : decision === "Acknowledge"
            ? "Operations Head Acknowledged"
            : `Operations Head ${decision}ed`,
      actor: approval.approver,
      role: "Operations Head",
      dateTime: approval.dateTime,
      comment: approval.comment,
    };
    persistUpdate((current) => ({
      ...current,
      status:
        decision === "Approve" || decision === "Acknowledge"
          ? "pending"
          : decision === "Return"
            ? "returned"
            : "denied",
      operationsHeadApproval: approval,
      auditTrail: [...current.auditTrail, audit],
    }));
    showCloseOutDecisionToast(toast, decision, "Operations Head");
    routeBackToWorkCloseOutRequests(router);
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

      <RoleBasedRecordHeader
        id={request.id}
        currentRole={currentRole}
        onRoleChange={() => undefined}
        roleLabel={
          hasDirectCloseOutAccess ? getWorkCloseOutRoleLabel(currentRole) : "Viewer"
        }
        roles={workCloseOutRoles}
        recordLabel="Work Completion & Close-Out"
        title={request.title}
        status={<ApprovalBadge status={request.status} />}
        nextActor={getWorkCloseOutNextActor(request)}
        showRoleSwitcher={false}
      />

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
        <ApprovalPanel
          title={`Supervisor Close-Out ${isExceptionCloseOut ? "Acknowledgement" : "Approval"}`}
          description={
            isExceptionCloseOut
              ? "This close-out reports incomplete, deviated, or unsafe work. Acknowledge it for audit, return it for correction, or deny it."
              : "Review the reported completion and record your supervisor decision."
          }
          commentLabel="Supervisor Comment"
          commentPlaceholder="Add close-out review notes"
          commentValue={supervisorComment}
          onCommentChange={setSupervisorComment}
          approveLabel={isExceptionCloseOut ? "Acknowledge" : "Approve"}
          rejectLabel="Deny"
          returnDisabled={!supervisorComment.trim()}
          rejectDisabled={!supervisorComment.trim()}
          onApprove={() => supervisorDecision(isExceptionCloseOut ? "Acknowledge" : "Approve")}
          onReturn={() => supervisorDecision("Return")}
          onReject={() => supervisorDecision("Deny")}
          extraFields={
            <div className="space-y-3">
              <FormInput label="Supervisor" value={request.workAuthorization.supervisor} disabled />
              {!supervisorComment.trim() ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Add a supervisor comment before returning or denying this close-out.
                </p>
              ) : null}
              {isExceptionCloseOut ? <ExceptionCloseOutNotice /> : null}
            </div>
          }
        />
      ) : permissions.showSupervisorApproval && request.supervisorApproval ? (
        <ApprovalResult title="Supervisor Close-Out Review Result" result={request.supervisorApproval} />
      ) : null}

      {permissions.canOperationsHeadApprove ? (
        <ApprovalPanel
          title={`Operations Head Close-Out ${isExceptionCloseOut ? "Acknowledgement" : "Approval"}`}
          description={
            isExceptionCloseOut
              ? "Acknowledge the exception close-out for audit and route it to HSE, or return/deny it with comments."
              : "Confirm the completed work is acceptable for final HSE review."
          }
          commentLabel="Operations Head Comment"
          commentPlaceholder="Add operational close-out review notes"
          commentValue={operationsHeadComment}
          onCommentChange={setOperationsHeadComment}
          approveLabel={isExceptionCloseOut ? "Acknowledge" : "Approve"}
          rejectLabel="Deny"
          returnDisabled={!operationsHeadComment.trim()}
          rejectDisabled={!operationsHeadComment.trim()}
          onApprove={() => operationsHeadDecision(isExceptionCloseOut ? "Acknowledge" : "Approve")}
          onReturn={() => operationsHeadDecision("Return")}
          onReject={() => operationsHeadDecision("Deny")}
          extraFields={
            <div className="space-y-3">
              <FormInput label="Operations Head" value="Grace Bello" disabled />
              {!operationsHeadComment.trim() ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Add an Operations Head comment before returning or denying this close-out.
                </p>
              ) : null}
              {isExceptionCloseOut ? <ExceptionCloseOutNotice /> : null}
            </div>
          }
        />
      ) : permissions.showOperationsHeadApproval && request.operationsHeadApproval ? (
        <ApprovalResult title="Operations Head Close-Out Review Result" result={request.operationsHeadApproval} />
      ) : null}

      {permissions.canHseApprove ? (
        <ApprovalPanel
          title={`HSE Final Close-Out ${isExceptionCloseOut ? "Acknowledgement" : "Approval"}`}
          description={
            isExceptionCloseOut
              ? "Verify the exception close-out, preserve the audit record, and decide whether to acknowledge, return, or deny it."
              : "Verify site safety and complete the final close-out decision."
          }
          commentLabel="HSE Comment"
          commentPlaceholder="Add final close-out verification notes"
          commentValue={hseComment}
          onCommentChange={setHseComment}
          approveLabel={isExceptionCloseOut ? "Acknowledge" : "Approve"}
          rejectLabel="Deny"
          approveDisabled={hseChecksIncomplete || (!isExceptionCloseOut && hseApprovalBlocked)}
          returnDisabled={!hseComment.trim() || hseChecksIncomplete}
          rejectDisabled={!hseComment.trim() || hseChecksIncomplete}
          onApprove={() => hseDecision(isExceptionCloseOut ? "Acknowledge" : "Approve")}
          onReturn={() => hseDecision("Return")}
          onReject={() => hseDecision("Deny")}
          extraFields={
            <div className="space-y-3">
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
              {!hseComment.trim() ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Add an HSE comment before returning or denying this close-out.
                </p>
              ) : null}
              {hseChecksIncomplete ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Complete all HSE close-out checks before submitting a decision.
                </p>
              ) : null}
              {!isExceptionCloseOut && !hseChecksIncomplete && hseApprovalBlocked ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Approval is disabled unless close-out is verified, the area is safe, and no corrective action is required.
                </p>
              ) : null}
              {isExceptionCloseOut ? <ExceptionCloseOutNotice /> : null}
            </div>
          }
        />
      ) : permissions.showHseApproval && request.hseApproval ? (
        <HseResult result={request.hseApproval} />
      ) : null}

      {permissions.showAuditTrail ? (
        <AuditTrail
          items={request.auditTrail}
          description="Recorded workflow actions and comments for this close-out."
        />
      ) : null}
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
  result: WorkCloseOutApprovalResult;
  title: string;
}) {
  return (
    <FormSection title={title} description="Recorded review decision and comments for this close-out.">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Reviewer" value={result.approver} disabled />
        <FormInput label="Decision" value={result.decision} disabled />
        <FormInput label="Review Date/Time" value={result.dateTime} disabled />
        <FormTextarea label="Comment" value={result.comment} disabled />
      </div>
    </FormSection>
  );
}

function HseResult({ result }: { result: WorkCloseOutHseApproval }) {
  return (
    <FormSection title="HSE Final Close-Out Review Result" description="Final HSE verification and close-out decision.">
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
        <FormInput label="HSE Review Date/Time" value={result.dateTime} disabled />
        <FormTextarea label="HSE Comment" value={result.comment} disabled />
      </div>
    </FormSection>
  );
}

function ExceptionCloseOutNotice() {
  return (
    <p className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
      This is an exception close-out. It can be acknowledged for audit, returned, or denied, but it cannot be approved as successful.
    </p>
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
  } else if (request.status === "acknowledged") {
    note = "This exception close-out has been acknowledged for audit. It is not counted as a successful close-out.";
  } else if (request.status === "pending") {
    if (!request.operationsHeadApproval) {
      note =
        currentRole === "operations_head"
          ? `Supervisor ${request.supervisorApproval?.decision === "Acknowledge" ? "acknowledged" : "approved"}. Operations Head close-out review is available.`
          : `Supervisor ${request.supervisorApproval?.decision === "Acknowledge" ? "acknowledged" : "approved"}. Waiting for Operations Head review.`;
    } else {
      note =
        currentRole === "hse"
          ? `Operations Head ${request.operationsHeadApproval.decision === "Acknowledge" ? "acknowledged" : "approved"}. HSE final close-out review is available.`
          : `Operations Head ${request.operationsHeadApproval.decision === "Acknowledge" ? "acknowledged" : "approved"}. Waiting for HSE final close-out review.`;
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

function getWorkCloseOutRoleLabel(role: WorkCloseOutRole) {
  if (role === "operations_head") return "Operations Head";
  if (role === "hse") return "HSE Inspector";
  if (role === "supervisor") return "Supervisor";
  return "Requester";
}

function getWorkCloseOutAccessRole({
  isRequester,
  isAssignedSupervisor,
  isOperationsHead,
  isHseEmployee,
}: {
  isRequester: boolean;
  isAssignedSupervisor: boolean;
  isOperationsHead: boolean;
  isHseEmployee: boolean;
}): WorkCloseOutRole {
  if (isHseEmployee) return "hse";
  if (isOperationsHead) return "operations_head";
  if (isAssignedSupervisor) return "supervisor";
  if (isRequester) return "requester";

  return "requester";
}

function employeeMatchesName(
  employee: SafetyEmployeeProfile | undefined,
  name?: string | null,
) {
  const expectedName = normalizeComparableText(name);
  if (!employee || !expectedName) return false;

  return (
    normalizeComparableText(employee.user?.email) === expectedName ||
    normalizeComparableText(employee.user?.first_name) === expectedName ||
    normalizeComparableText(employee.user?.last_name) === expectedName ||
    normalizeComparableText(
      `${employee.user?.first_name ?? ""} ${employee.user?.last_name ?? ""}`,
    ) === expectedName
  );
}

function normalizeComparableText(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function isOperationsHeadEmployee(employee?: SafetyEmployeeProfile | null) {
  const userRole = employee?.user?.role?.trim().toLowerCase();
  if (userRole === "admin" || userRole === "super_admin") return true;

  const department = employee?.department?.trim().toLowerCase();
  const jobTitle = employee?.job_title?.trim().toLowerCase() ?? "";

  return (
    department === "operations" &&
    /\b(hod|head|manager|lead)\b/.test(jobTitle)
  );
}

function isHseDepartment(department?: string | null) {
  const normalizedDepartment = department?.trim().toLowerCase();
  return normalizedDepartment === "hse" || normalizedDepartment === "safety";
}

function showCloseOutDecisionToast(
  toast: ReturnType<typeof useToast>,
  decision: WorkCloseOutDecision,
  actorLabel: string,
) {
  if (decision === "Approve") {
    toast.success(`Close-out approved by ${actorLabel}.`);
  } else if (decision === "Acknowledge") {
    toast.success(`Close-out acknowledged by ${actorLabel}.`);
  } else if (decision === "Return") {
    toast.info("Close-out returned to requester.");
  } else {
    toast.error(`Close-out denied by ${actorLabel}.`);
  }
}

function routeBackToWorkCloseOutRequests(router: ReturnType<typeof useRouter>) {
  window.setTimeout(() => {
    router.push("/safety/work-close-out");
  }, 700);
}

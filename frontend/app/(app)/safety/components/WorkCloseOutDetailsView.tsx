"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, FileText, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import ApprovalPanel from "@/components/ui/ApprovalPanel";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import Button from "@/components/ui/Button";
import FileDropzone from "@/components/ui/FileDropzone";
import FormInput from "@/components/forms/FormInput";
import FormDateTimeInput from "@/components/forms/FormDateTimeInput";
import FormTextarea from "@/components/forms/FormTextarea";
import AuditTrail from "@/components/forms/AuditTrail";
import RoleBasedRecordHeader from "@/components/ui/RoleBasedRecordHeader";
import { useToast } from "@/hooks/useToast";
import SafetyChoiceTable from "./SafetyChoiceTable";
import { useMyApprovals } from "@/lib/modules/workflow/queries";
import { useActiveSafetyChecklist } from "@/lib/modules/safety/checklists";
import type { SafetyChecklistItem } from "@/lib/modules/safety/checklists";
import { isExceptionWorkCloseOut } from "@/lib/safety-demo-routing";
import { getWorkCloseOutNextActor } from "@/lib/safety-next-actor";
import {
  useHseWorkCloseoutReview,
  useOperationsHeadWorkCloseoutReview,
  useSupervisorWorkCloseoutReview,
  useUpdateWorkCloseout,
  useWorkCloseout,
  type WorkCloseOutChecklistAnswerCreate,
} from "@/lib/modules/safety/workCloseout";
import {
  useSafetyCurrentEmployee,
  type SafetyEmployeeProfile,
} from "@/lib/modules/safety/people";
import SafetyProcessFormSkeleton from "./SafetyProcessFormSkeleton";
import type {
  WorkAuthorizationAttachment,
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

function isReturnOrDeny(decision: WorkCloseOutDecision) {
  return decision === "Return" || decision === "Deny";
}

function toApiDecision(decision: WorkCloseOutDecision) {
  if (decision === "Approve") return "approve";
  if (decision === "Acknowledge") return "acknowledge";
  if (decision === "Return") return "return";
  return "deny";
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
  const closeoutQuery = useWorkCloseout(requestId);
  const request = closeoutQuery.data;
  const updateCloseout = useUpdateWorkCloseout(requestId);
  const myApprovalsQuery = useMyApprovals();
  const supervisorReview = useSupervisorWorkCloseoutReview(requestId);
  const operationsHeadReview = useOperationsHeadWorkCloseoutReview(requestId);
  const hseReview = useHseWorkCloseoutReview(requestId);
  const isExceptionCloseOut = request ? isExceptionWorkCloseOut(request) : false;
  const isRequester = Boolean(
    currentEmployee?.id &&
      request?.requesterId &&
      currentEmployee.id === request.requesterId,
  );
  const isAssignedSupervisor = Boolean(
    currentEmployee?.id &&
      request?.workAuthorization.supervisorId &&
      currentEmployee.id === request.workAuthorization.supervisorId,
  );
  const isOperationsHead = isOperationsHeadEmployee(currentEmployee);
  const isHseEmployee = isHseDepartment(currentEmployee?.department);
  const myWorkCloseoutApproval = (myApprovalsQuery.data ?? []).find(
    (approval) =>
      approval.request_type === "work_closeout" &&
      approval.request_id === requestId,
  );
  const isAssignedWorkflowApprover = Boolean(myWorkCloseoutApproval);
  const isAssignedWorkflowSupervisor =
    isAssignedWorkflowApprover && request?.status === "submitted";
  const isAssignedWorkflowOperationsHead =
    isAssignedWorkflowApprover &&
    request?.status === "pending" &&
    Boolean(request?.supervisorApproval) &&
    !request?.operationsHeadApproval;
  const isAssignedWorkflowHse =
    isAssignedWorkflowApprover &&
    request?.status === "pending" &&
    Boolean(request?.operationsHeadApproval);
  const hasDirectCloseOutAccess =
    isRequester ||
    isAssignedSupervisor ||
    isAssignedWorkflowOperationsHead ||
    isAssignedWorkflowHse;
  const currentRole = getWorkCloseOutAccessRole({
    isRequester,
    isAssignedSupervisor: isAssignedSupervisor || isAssignedWorkflowSupervisor,
    isOperationsHead: isOperationsHead && isAssignedWorkflowOperationsHead,
    isHseEmployee: isHseEmployee && isAssignedWorkflowHse,
  });
  const [supervisorComment, setSupervisorComment] = useState("");
  const [operationsHeadComment, setOperationsHeadComment] = useState("");
  const [hseComment, setHseComment] = useState("");
  const [hseVerifiedCloseOut, setHseVerifiedCloseOut] = useState("");
  const [hseAreaSafe, setHseAreaSafe] = useState("");
  const [hseCorrectiveActionRequired, setHseCorrectiveActionRequired] = useState("");
  const [actualStartDateTime, setActualStartDateTime] = useState("");
  const [actualCompletionDateTime, setActualCompletionDateTime] = useState("");
  const [workCompleted, setWorkCompleted] = useState("");
  const [completedAsApproved, setCompletedAsApproved] = useState("");
  const [incidentObserved, setIncidentObserved] = useState("");
  const [completionSummary, setCompletionSummary] = useState("");
  const [deviationExplanation, setDeviationExplanation] = useState("");
  const [incidentNote, setIncidentNote] = useState("");
  const [completionEvidence, setCompletionEvidence] = useState<File[]>([]);
  const [monitoredDuringExecution, setMonitoredDuringExecution] = useState("");
  const [stayedWithinScope, setStayedWithinScope] = useState("");
  const [ppeAndControlsMaintained, setPpeAndControlsMaintained] = useState("");
  const [unsafeConditionAddressed, setUnsafeConditionAddressed] = useState("");
  const [workAreaCleaned, setWorkAreaCleaned] = useState("");
  const [toolsRemoved, setToolsRemoved] = useState("");
  const [systemSafe, setSystemSafe] = useState("");
  const [remainingHazard, setRemainingHazard] = useState("");
  const [remainingHazardDetails, setRemainingHazardDetails] = useState("");
  const completionChecklist = useActiveSafetyChecklist("work_closeout", "completion");
  const monitoringChecklist = useActiveSafetyChecklist("work_closeout", "monitoring");
  const areaConditionChecklist = useActiveSafetyChecklist(
    "work_closeout",
    "closeout_review",
  );
  const hseChecksIncomplete =
    !hseVerifiedCloseOut || !hseAreaSafe || !hseCorrectiveActionRequired;
  const hseApprovalBlocked =
    !hseChecksIncomplete &&
    (hseVerifiedCloseOut !== "Yes" ||
      hseAreaSafe !== "Yes" ||
      hseCorrectiveActionRequired === "Yes");

  /* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!request) return;
    setActualStartDateTime(
      toDateTimeInputValue(request.completionDetails.actualStartDateTimeRaw),
    );
    setActualCompletionDateTime(
      toDateTimeInputValue(request.completionDetails.actualCompletionDateTimeRaw),
    );
    setWorkCompleted(booleanToYesNo(request.completionDetails.workCompleted));
    setCompletedAsApproved(
      booleanToYesNo(request.completionDetails.completedAsApproved),
    );
    setIncidentObserved(booleanToYesNo(request.completionDetails.incidentObserved));
    setCompletionSummary(request.completionDetails.completionSummary);
    setDeviationExplanation(request.completionDetails.deviationExplanation);
    setIncidentNote(request.completionDetails.incidentNote);
    setCompletionEvidence([]);
    setMonitoredDuringExecution(
      booleanToYesNo(request.monitoring.monitoredDuringExecution),
    );
    setStayedWithinScope(booleanToYesNo(request.monitoring.stayedWithinScope));
    setPpeAndControlsMaintained(
      booleanToYesNo(request.monitoring.ppeAndControlsMaintained),
    );
    setUnsafeConditionAddressed(request.monitoring.unsafeConditionAddressed);
    setWorkAreaCleaned(booleanToYesNo(request.areaCondition.workAreaCleaned));
    setToolsRemoved(booleanToYesNo(request.areaCondition.toolsRemoved));
    setSystemSafe(booleanToYesNo(request.areaCondition.systemSafe));
    setRemainingHazard(booleanToYesNo(request.areaCondition.remainingHazard));
    setRemainingHazardDetails(request.areaCondition.remainingHazardDetails);
  }, [request?.id, request?.status]);
  /* eslint-enable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */

  const isDraft = request?.status === "draft";
  const isSubmitted = request?.status === "submitted";
  const isPending = request?.status === "pending";
  const isApproved = request?.status === "approved";
  const isAcknowledged = request?.status === "acknowledged";
  const isReturned = request?.status === "returned";
  const isDenied = request?.status === "denied";
  const permissions = {
    canRequesterEdit: isRequester && (isDraft || isReturned),
    canSupervisorApprove: isAssignedWorkflowSupervisor && isSubmitted,
    canOperationsHeadApprove:
      isOperationsHead &&
      isAssignedWorkflowOperationsHead &&
      isPending &&
      Boolean(request?.supervisorApproval) &&
      !request?.operationsHeadApproval,
    canHseApprove:
      isHseEmployee &&
      isAssignedWorkflowHse &&
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

  if (
    currentEmployeeQuery.isLoading ||
    closeoutQuery.isLoading ||
    myApprovalsQuery.isLoading ||
    (permissions.canRequesterEdit &&
      (completionChecklist.isLoading ||
        monitoringChecklist.isLoading ||
        areaConditionChecklist.isLoading))
  ) {
    return <SafetyProcessFormSkeleton sections={5} />;
  }

  if (!request) {
    return (
      <div className="rounded-2xl border border-brand-border bg-white p-6">
        <p className="text-sm text-brand-text-secondary">Work close-out request not found.</p>
      </div>
    );
  }

  async function submitCloseOut() {
    if (!request) return;
    const requiresDeviationExplanation =
      completedAsApproved === "No" ||
      hasScheduleDeviation({
        workAuthorization: request.workAuthorization,
        actualStartDateTime,
        actualCompletionDateTime,
      });

    if (requiresDeviationExplanation && deviationExplanation.trim().length < 3) {
      toast.error("Explain why work differed from the approved scope or schedule.");
      return;
    }

    try {
      await updateCloseout.mutateAsync({
        payload: {
          work_authorization_id: request.workAuthorization.id,
          actual_start_at: toApiDateTime(actualStartDateTime),
          actual_completion_at: toApiDateTime(actualCompletionDateTime),
          work_completed: workCompleted === "Yes",
          completed_as_approved: completedAsApproved === "Yes",
          deviation_explanation: deviationExplanation || null,
          completion_summary: completionSummary,
          incident_observed: incidentObserved === "Yes",
          incident_note: incidentNote || null,
          completion_notes: null,
          monitored_during_execution: monitoredDuringExecution === "Yes",
          stayed_within_scope: stayedWithinScope === "Yes",
          ppe_and_controls_maintained: ppeAndControlsMaintained === "Yes",
          unsafe_condition_addressed: yesNoNaToAnswer(unsafeConditionAddressed),
          monitoring_comment: null,
          work_area_cleaned: workAreaCleaned === "Yes",
          tools_removed: toolsRemoved === "Yes",
          system_safe: systemSafe === "Yes",
          remaining_hazard: remainingHazard === "Yes",
          remaining_hazard_details: remainingHazardDetails || null,
          completion_checklist_answers: buildCompletionChecklistAnswers(
            completionChecklist.data?.items ?? [],
            { workCompleted, completedAsApproved, incidentObserved },
          ),
          monitoring_checklist_answers: buildMonitoringChecklistAnswers(
            monitoringChecklist.data?.items ?? [],
            {
              monitoredDuringExecution,
              stayedWithinScope,
              ppeAndControlsMaintained,
              unsafeConditionAddressed,
            },
          ),
          area_condition_checklist_answers: buildAreaConditionChecklistAnswers(
            areaConditionChecklist.data?.items ?? [],
            { workAreaCleaned, toolsRemoved, systemSafe, remainingHazard },
          ),
        },
        completionEvidence,
      });
      toast.success("Work close-out resubmitted.");
      routeBackToWorkCloseOutRequests(router);
    } catch (error) {
      console.error("Failed to resubmit work close-out", error);
      toast.error("Unable to resubmit work close-out.");
    }
  }

  async function supervisorDecision(decision: WorkCloseOutDecision) {
    if (!request) return;
    if (isExceptionCloseOut && decision === "Approve") return;
    if (!isExceptionCloseOut && decision === "Acknowledge") return;
    if (isReturnOrDeny(decision) && !supervisorComment.trim()) return;
    try {
      await supervisorReview.mutateAsync({
        decision: toApiDecision(decision),
        comment: supervisorComment || null,
      });
      showCloseOutDecisionToast(toast, decision, "Supervisor");
      routeBackToWorkCloseOutRequests(router);
    } catch (error) {
      console.error("Failed to submit supervisor close-out decision", error);
      toast.error("Unable to submit supervisor decision.");
    }
  }

  async function hseDecision(decision: WorkCloseOutDecision) {
    if (!request) return;
    if (hseChecksIncomplete) return;
    if (isExceptionCloseOut && decision === "Approve") return;
    if (!isExceptionCloseOut && decision === "Acknowledge") return;
    if (decision === "Approve" && hseApprovalBlocked) return;
    if (isReturnOrDeny(decision) && !hseComment.trim()) return;
    try {
      await hseReview.mutateAsync({
        decision: toApiDecision(decision),
        comment: hseComment || null,
        verified_close_out: hseVerifiedCloseOut === "Yes",
        area_safe_for_operations: hseAreaSafe === "Yes",
        corrective_action_required: hseCorrectiveActionRequired === "Yes",
        corrective_action_details: null,
      });
      showCloseOutDecisionToast(toast, decision, "HSE");
      routeBackToWorkCloseOutRequests(router);
    } catch (error) {
      console.error("Failed to submit HSE close-out decision", error);
      toast.error("Unable to submit HSE decision.");
    }
  }

  async function operationsHeadDecision(decision: WorkCloseOutDecision) {
    if (!request) return;
    if (isExceptionCloseOut && decision === "Approve") return;
    if (!isExceptionCloseOut && decision === "Acknowledge") return;
    if (isReturnOrDeny(decision) && !operationsHeadComment.trim()) return;
    try {
      await operationsHeadReview.mutateAsync({
        decision: toApiDecision(decision),
        comment: operationsHeadComment || null,
      });
      showCloseOutDecisionToast(toast, decision, "Operations Head");
      routeBackToWorkCloseOutRequests(router);
    } catch (error) {
      console.error("Failed to submit Operations Head close-out decision", error);
      toast.error("Unable to submit Operations Head decision.");
    }
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
        id={request.reference ?? "Reference pending"}
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
      <CompletionDetails
        request={request}
        editable={permissions.canRequesterEdit}
        values={{
          actualStartDateTime,
          actualCompletionDateTime,
          workCompleted,
          completedAsApproved,
          incidentObserved,
          completionSummary,
          deviationExplanation,
          incidentNote,
          completionEvidence,
        }}
        onChange={{
          setActualStartDateTime,
          setActualCompletionDateTime,
          setWorkCompleted,
          setCompletedAsApproved,
          setIncidentObserved,
          setCompletionSummary,
          setDeviationExplanation,
          setIncidentNote,
          setCompletionEvidence,
        }}
      />
      <MonitoringSection
        editable={permissions.canRequesterEdit}
        values={{
          monitoredDuringExecution,
          stayedWithinScope,
          ppeAndControlsMaintained,
          unsafeConditionAddressed,
        }}
        onChange={{
          setMonitoredDuringExecution,
          setStayedWithinScope,
          setPpeAndControlsMaintained,
          setUnsafeConditionAddressed,
        }}
      />
      <AreaConditionSection
        editable={permissions.canRequesterEdit}
        values={{
          workAreaCleaned,
          toolsRemoved,
          systemSafe,
          remainingHazard,
          remainingHazardDetails,
        }}
        onChange={{
          setWorkAreaCleaned,
          setToolsRemoved,
          setSystemSafe,
          setRemainingHazard,
          setRemainingHazardDetails,
        }}
      />

      {permissions.canRequesterEdit ? (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={submitCloseOut}
            loading={updateCloseout.isPending}
            loadingText="Submitting..."
          >
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
        <FormInput
          label="Work Authorization Reference"
          value={work.reference ?? "Reference pending"}
          disabled
        />
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
  values,
  onChange,
}: {
  request: WorkCloseOutRequest;
  editable: boolean;
  values: {
    actualStartDateTime: string;
    actualCompletionDateTime: string;
    workCompleted: string;
    completedAsApproved: string;
    incidentObserved: string;
    completionSummary: string;
    deviationExplanation: string;
    incidentNote: string;
    completionEvidence: File[];
  };
  onChange: {
    setActualStartDateTime: (value: string) => void;
    setActualCompletionDateTime: (value: string) => void;
    setWorkCompleted: (value: string) => void;
    setCompletedAsApproved: (value: string) => void;
    setIncidentObserved: (value: string) => void;
    setCompletionSummary: (value: string) => void;
    setDeviationExplanation: (value: string) => void;
    setIncidentNote: (value: string) => void;
    setCompletionEvidence: (files: File[]) => void;
  };
}) {
  const details = request.completionDetails;
  const requiresDeviationExplanation =
    values.completedAsApproved === "No" ||
    hasScheduleDeviation({
      workAuthorization: request.workAuthorization,
      actualStartDateTime: values.actualStartDateTime,
      actualCompletionDateTime: values.actualCompletionDateTime,
    });

  return (
    <FormSection title="Completion Details" description="Recorded completion information and submitted evidence.">
      <div className="grid gap-4 md:grid-cols-2">
        {editable ? (
          <>
            <FormDateTimeInput
              label="Actual Start Date/Time"
              value={values.actualStartDateTime}
              onValueChange={onChange.setActualStartDateTime}
            />
            <FormDateTimeInput
              label="Actual Completion Date/Time"
              value={values.actualCompletionDateTime}
              onValueChange={onChange.setActualCompletionDateTime}
            />
          </>
        ) : (
          <>
            <FormInput label="Actual Start Date/Time" value={details.actualStartDateTime} disabled />
            <FormInput label="Actual Completion Date/Time" value={details.actualCompletionDateTime} disabled />
          </>
        )}
        <div className="md:col-span-2">
          <SafetyChoiceTable
            options={yesNoOptions}
            disabled={!editable}
            rows={[
              {
                label: "Was work completed?",
                value: values.workCompleted,
                onValueChange: onChange.setWorkCompleted,
              },
              {
                label: "Was work completed as approved?",
                value: values.completedAsApproved,
                onValueChange: onChange.setCompletedAsApproved,
              },
              {
                label: "Any incident, hazard, or near miss observed?",
                value: values.incidentObserved,
                onValueChange: onChange.setIncidentObserved,
              },
            ]}
          />
        </div>
        {requiresDeviationExplanation ? (
          <FormTextarea
            label="Explanation for change/deviation"
            value={values.deviationExplanation}
            onChange={(event) => onChange.setDeviationExplanation(event.target.value)}
            disabled={!editable}
          />
        ) : null}
        <FormTextarea
          label="Completion Summary"
          value={values.completionSummary}
          onChange={(event) => onChange.setCompletionSummary(event.target.value)}
          disabled={!editable}
          className="md:col-span-2"
        />
        {values.incidentObserved === "Yes" ? (
          <FormTextarea
            label="Incident/Hazard Note"
            value={values.incidentNote}
            onChange={(event) => onChange.setIncidentNote(event.target.value)}
            disabled={!editable}
          />
        ) : null}
        {/* <FormTextarea label="Completion Notes" value={details.completionNotes} disabled={!editable} className="md:col-span-2" /> */}
      </div>
      <div className="mt-4">
        <AttachmentList attachments={details.completionEvidence} />
        {editable ? (
          <div className="mt-4">
            <FileDropzone
              label="Completion Evidence"
              value={values.completionEvidence}
              onChange={onChange.setCompletionEvidence}
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
  editable,
  values,
  onChange,
}: {
  editable: boolean;
  values: {
    monitoredDuringExecution: string;
    stayedWithinScope: string;
    ppeAndControlsMaintained: string;
    unsafeConditionAddressed: string;
  };
  onChange: {
    setMonitoredDuringExecution: (value: string) => void;
    setStayedWithinScope: (value: string) => void;
    setPpeAndControlsMaintained: (value: string) => void;
    setUnsafeConditionAddressed: (value: string) => void;
  };
}) {
  return (
    <FormSection title="Monitoring Attestation" description="Confirmation of monitoring and safety-control compliance during work.">
      <SafetyChoiceTable
        options={yesNoNaOptions}
        disabled={!editable}
        rows={[
          {
            label: "Work was monitored during execution",
            value: values.monitoredDuringExecution,
            onValueChange: onChange.setMonitoredDuringExecution,
          },
          {
            label: "Work stayed within approved scope",
            value: values.stayedWithinScope,
            onValueChange: onChange.setStayedWithinScope,
          },
          {
            label: "Required PPE and safety controls were maintained",
            value: values.ppeAndControlsMaintained,
            onValueChange: onChange.setPpeAndControlsMaintained,
          },
          {
            label: "Unsafe condition was reported/addressed if noticed",
            value: values.unsafeConditionAddressed,
            onValueChange: onChange.setUnsafeConditionAddressed,
          },
        ]}
      />
    </FormSection>
  );
}

function AreaConditionSection({
  editable,
  values,
  onChange,
}: {
  editable: boolean;
  values: {
    workAreaCleaned: string;
    toolsRemoved: string;
    systemSafe: string;
    remainingHazard: string;
    remainingHazardDetails: string;
  };
  onChange: {
    setWorkAreaCleaned: (value: string) => void;
    setToolsRemoved: (value: string) => void;
    setSystemSafe: (value: string) => void;
    setRemainingHazard: (value: string) => void;
    setRemainingHazardDetails: (value: string) => void;
  };
}) {
  return (
    <FormSection title="Area / Equipment Condition" description="Condition of the site and equipment after work completion.">
      <div className="space-y-4">
        <SafetyChoiceTable
          options={yesNoOptions}
          disabled={!editable}
          rows={[
            {
              label: "Work area cleaned after completion",
              value: values.workAreaCleaned,
              onValueChange: onChange.setWorkAreaCleaned,
            },
            {
              label: "Tools/equipment removed from work area",
              value: values.toolsRemoved,
              onValueChange: onChange.setToolsRemoved,
            },
            {
              label: "Vehicle/equipment/system left in safe condition",
              value: values.systemSafe,
              onValueChange: onChange.setSystemSafe,
            },
            {
              label: "Any remaining hazard?",
              value: values.remainingHazard,
              onValueChange: onChange.setRemainingHazard,
            },
          ]}
        />
        {values.remainingHazard === "Yes" ? (
          <FormTextarea
            label="Remaining Hazard Details"
            value={values.remainingHazardDetails}
            onChange={(event) => onChange.setRemainingHazardDetails(event.target.value)}
            disabled={!editable}
            className="md:col-span-2"
          />
        ) : null}
      </div>
    </FormSection>
  );
}

function booleanToYesNo(value: boolean) {
  return value ? "Yes" : "No";
}

function toDateTimeInputValue(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toApiDateTime(value: string) {
  return new Date(value).toISOString();
}

function yesNoNaToAnswer(value: string) {
  if (value === "Yes") return "yes";
  if (value === "No") return "no";
  return "not_applicable";
}

function hasScheduleDeviation({
  workAuthorization,
  actualStartDateTime,
  actualCompletionDateTime,
}: {
  workAuthorization: WorkCloseOutRequest["workAuthorization"];
  actualStartDateTime: string;
  actualCompletionDateTime: string;
}) {
  const actualStart = parseDateValue(actualStartDateTime);
  const actualCompletion = parseDateValue(actualCompletionDateTime);
  const approvedStart = parseDateValue(
    workAuthorization.approvedStartDateTimeRaw ??
      workAuthorization.approvedStartDateTime,
  );
  const approvedEnd = parseDateValue(
    workAuthorization.approvedEndDateTimeRaw ??
      workAuthorization.approvedEndDateTime,
  );

  return Boolean(
    (actualStart && approvedStart && actualStart < approvedStart) ||
      (actualCompletion && approvedStart && actualCompletion < approvedStart) ||
      (actualCompletion && approvedEnd && actualCompletion > approvedEnd),
  );
}

function parseDateValue(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildCompletionChecklistAnswers(
  items: SafetyChecklistItem[],
  values: {
    workCompleted: string;
    completedAsApproved: string;
    incidentObserved: string;
  },
): WorkCloseOutChecklistAnswerCreate[] {
  return [
    booleanAnswer(items, "work_completed", values.workCompleted),
    booleanAnswer(items, "completed_as_approved", values.completedAsApproved),
    booleanAnswer(items, "incident_observed", values.incidentObserved),
  ].filter(Boolean) as WorkCloseOutChecklistAnswerCreate[];
}

function buildMonitoringChecklistAnswers(
  items: SafetyChecklistItem[],
  values: {
    monitoredDuringExecution: string;
    stayedWithinScope: string;
    ppeAndControlsMaintained: string;
    unsafeConditionAddressed: string;
  },
): WorkCloseOutChecklistAnswerCreate[] {
  return [
    booleanAnswer(
      items,
      "monitored_during_execution",
      values.monitoredDuringExecution,
    ),
    booleanAnswer(items, "stayed_within_scope", values.stayedWithinScope),
    booleanAnswer(
      items,
      "ppe_and_controls_maintained",
      values.ppeAndControlsMaintained,
    ),
    enumAnswer(
      items,
      "unsafe_condition_addressed",
      yesNoNaToAnswer(values.unsafeConditionAddressed),
    ),
  ].filter(Boolean) as WorkCloseOutChecklistAnswerCreate[];
}

function buildAreaConditionChecklistAnswers(
  items: SafetyChecklistItem[],
  values: {
    workAreaCleaned: string;
    toolsRemoved: string;
    systemSafe: string;
    remainingHazard: string;
  },
): WorkCloseOutChecklistAnswerCreate[] {
  return [
    booleanAnswer(items, "work_area_cleaned", values.workAreaCleaned),
    booleanAnswer(items, "tools_removed", values.toolsRemoved),
    booleanAnswer(items, "system_safe", values.systemSafe),
    booleanAnswer(items, "remaining_hazard", values.remainingHazard),
  ].filter(Boolean) as WorkCloseOutChecklistAnswerCreate[];
}

function booleanAnswer(
  items: SafetyChecklistItem[],
  itemKey: string,
  value: string,
): WorkCloseOutChecklistAnswerCreate | null {
  const item = items.find((current) => current.item_key === itemKey);
  if (!item) return null;
  return {
    item_id: item.id,
    value_boolean: value === "Yes",
  };
}

function enumAnswer(
  items: SafetyChecklistItem[],
  itemKey: string,
  value: string,
): WorkCloseOutChecklistAnswerCreate | null {
  const item = items.find((current) => current.item_key === itemKey);
  if (!item) return null;
  return {
    item_id: item.id,
    selected_option: value,
  };
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

function isOperationsHeadEmployee(employee?: SafetyEmployeeProfile | null) {
  const department = employee?.department?.trim().toLowerCase();
  const jobTitle = employee?.job_title?.trim() ?? "";

  return department === "operations" && jobTitle === "Process Manager";
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

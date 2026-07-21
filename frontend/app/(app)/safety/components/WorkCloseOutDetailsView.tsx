"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import ApprovalPanel from "@/components/ui/ApprovalPanel";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { getSafetyDisplayStatus } from "@/lib/modules/safety/presentation";
import Button from "@/components/ui/Button";
import FileDropzone from "@/components/ui/FileDropzone";
import FormInput from "@/components/forms/FormInput";
import FormDateTimeInput from "@/components/forms/FormDateTimeInput";
import FormTextarea from "@/components/forms/FormTextarea";
import AuditTrail from "@/components/forms/AuditTrail";
import RoleBasedRecordHeader from "@/components/ui/RoleBasedRecordHeader";
import { useToast } from "@/hooks/useToast";
import SafetyChoiceTable from "./SafetyChoiceTable";
import { mapWorkflowAuditTrail } from "@/lib/modules/workflow/audit";
import { useAuditTrail, useMyApprovals } from "@/lib/modules/workflow/queries";
import {
  safetyChecklistsApi,
  useActiveSafetyChecklist,
  useSafetyChecklistResponses,
} from "@/lib/modules/safety/checklists";
import type {
  SafetyChecklistAnswerCreate,
  SafetyChecklistItem,
  SafetyChecklistResponse,
  SafetyChecklistTemplate,
} from "@/lib/modules/safety/checklists";
import { isExceptionWorkCloseOut } from "@/lib/safety-demo-routing";
import { getWorkCloseOutNextActor } from "@/lib/safety-next-actor";
import {
  getDateTimeAfter,
  getLatestActualWorkDateTime,
  isDateTimeBefore,
  MIN_SCHEDULE_DURATION_MINUTES,
  SCHEDULE_DEVIATION_TOLERANCE_MINUTES,
} from "@/lib/modules/safety/date-rules";
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
import SafetyChecklistResponsesView from "./SafetyChecklistResponsesView";
import SafetyAttachmentList from "./SafetyAttachmentList";
import type {
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
  const auditTrailQuery = useAuditTrail("work_closeout", requestId);
  const workflowAuditTrail = mapWorkflowAuditTrail(auditTrailQuery.data ?? []);
  const hseCloseoutResponsesQuery = useSafetyChecklistResponses(
    "closeout_review",
    request?.hseApproval?.id ?? "",
  );
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
  const currentRole = getWorkCloseOutAccessRole({
    isRequester,
    isAssignedSupervisor,
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
  const [retainedCompletionEvidenceIds, setRetainedCompletionEvidenceIds] =
    useState<string[]>([]);
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
  const hseCloseoutChecklist = useActiveSafetyChecklist(
    "closeout_review",
    "hse_review",
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
    setRetainedCompletionEvidenceIds(
      request.completionDetails.completionEvidence
        .map((attachment) => attachment.id)
        .filter((id): id is string => Boolean(id)),
    );
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
        areaConditionChecklist.isLoading)) ||
    (permissions.canHseApprove && hseCloseoutChecklist.isLoading)
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
    if (updateCloseout.isPending) return;
    const actualTimingError = validateActualWorkTiming({
      actualStartDateTime,
      actualCompletionDateTime,
    });
    if (actualTimingError) {
      toast.error(actualTimingError);
      return;
    }

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
          retained_completion_evidence_ids: retainedCompletionEvidenceIds,
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
    if (supervisorReview.isPending) return;
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
    if (hseReview.isPending) return;
    if (hseChecksIncomplete) return;
    if (isExceptionCloseOut && decision === "Approve") return;
    if (!isExceptionCloseOut && decision === "Acknowledge") return;
    if (decision === "Approve" && hseApprovalBlocked) return;
    if (isReturnOrDeny(decision) && !hseComment.trim()) return;
    try {
      const saved = await hseReview.mutateAsync({
        decision: toApiDecision(decision),
        comment: hseComment || null,
        verified_close_out: hseVerifiedCloseOut === "Yes",
        area_safe_for_operations: hseAreaSafe === "Yes",
        corrective_action_required: hseCorrectiveActionRequired === "Yes",
        corrective_action_details: null,
      });
      const reviewId = saved.hse_review?.id;
      const checklistAnswers = buildHseCloseoutChecklistAnswers(
        hseCloseoutChecklist.data?.items ?? [],
        {
          hseVerifiedCloseOut,
          hseAreaSafe,
          hseCorrectiveActionRequired,
        },
      );
      if (reviewId && checklistAnswers.length > 0) {
        try {
          await safetyChecklistsApi.createResponses({
            parent_type: "closeout_review",
            parent_id: reviewId,
            answers: checklistAnswers,
          });
        } catch (checklistError) {
          console.error(
            "Failed to save HSE close-out checklist responses",
            checklistError,
          );
          toast.info(
            "HSE decision saved, but the close-out checklist history could not be saved.",
          );
          routeBackToWorkCloseOutRequests(router);
          return;
        }
      }
      showCloseOutDecisionToast(toast, decision, "HSE");
      routeBackToWorkCloseOutRequests(router);
    } catch (error) {
      console.error("Failed to submit HSE close-out decision", error);
      toast.error("Unable to submit HSE decision.");
    }
  }

  async function operationsHeadDecision(decision: WorkCloseOutDecision) {
    if (!request) return;
    if (operationsHeadReview.isPending) return;
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
          isRequester || isAssignedSupervisor || isAssignedWorkflowApprover
            ? getWorkCloseOutRoleLabel(currentRole)
            : "Viewer"
        }
        roles={workCloseOutRoles}
        recordLabel="Work Completion & Close-Out"
        title={request.title}
        status={
          <ApprovalBadge status={getSafetyDisplayStatus(request.status)} />
        }
        nextActor={getWorkCloseOutNextActor(request)}
        nextApproverName={request.nextApproverName}
        nextApproverRole={request.nextApproverRole}
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
        retainedCompletionEvidenceIds={retainedCompletionEvidenceIds}
        onRetainedCompletionEvidenceIdsChange={setRetainedCompletionEvidenceIds}
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
              ? "This close-out was not completed as approved or has a remaining hazard. Acknowledge it for audit, return it for correction, or reject it."
              : "Review the reported completion and record your supervisor decision."
          }
          commentLabel="Supervisor Comment"
          commentPlaceholder="Add close-out review notes"
          commentValue={supervisorComment}
          onCommentChange={setSupervisorComment}
          approveLabel={isExceptionCloseOut ? "Acknowledge" : "Approve"}
          rejectLabel="Reject"
          disabled={supervisorReview.isPending}
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
                  Add a supervisor comment before returning or rejecting this close-out.
                </p>
              ) : null}
              {isExceptionCloseOut ? <ExceptionCloseOutNotice /> : null}
            </div>
          }
        />
      ) : null}

      {permissions.canOperationsHeadApprove ? (
        <ApprovalPanel
          title={`Operations Head Close-Out ${isExceptionCloseOut ? "Acknowledgement" : "Approval"}`}
          description={
            isExceptionCloseOut
              ? "Acknowledge the exception close-out for audit and route it to HSE, or return/reject it with comments."
              : "Confirm the completed work is acceptable for final HSE review."
          }
          commentLabel="Operations Head Comment"
          commentPlaceholder="Add operational close-out review notes"
          commentValue={operationsHeadComment}
          onCommentChange={setOperationsHeadComment}
          approveLabel={isExceptionCloseOut ? "Acknowledge" : "Approve"}
          rejectLabel="Reject"
          disabled={operationsHeadReview.isPending}
          returnDisabled={!operationsHeadComment.trim()}
          rejectDisabled={!operationsHeadComment.trim()}
          onApprove={() => operationsHeadDecision(isExceptionCloseOut ? "Acknowledge" : "Approve")}
          onReturn={() => operationsHeadDecision("Return")}
          onReject={() => operationsHeadDecision("Deny")}
          extraFields={
            <div className="space-y-3">
              <FormInput
                label="Operations Head"
                value={getEmployeeDisplayName(currentEmployee) ?? "Operations Head"}
                disabled
              />
              {!operationsHeadComment.trim() ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Add an Operations Head comment before returning or rejecting this close-out.
                </p>
              ) : null}
              {isExceptionCloseOut ? <ExceptionCloseOutNotice /> : null}
            </div>
          }
        />
      ) : null}

      {permissions.canHseApprove ? (
        <ApprovalPanel
          title={`HSE Final Close-Out ${isExceptionCloseOut ? "Acknowledgement" : "Approval"}`}
          description={
            isExceptionCloseOut
              ? "Verify the unresolved hazard or approval deviation, preserve the audit record, and decide whether to acknowledge, return, or reject it."
              : "Verify site safety and complete the final close-out decision."
          }
          commentLabel="HSE Comment"
          commentPlaceholder="Add final close-out verification notes"
          commentValue={hseComment}
          onCommentChange={setHseComment}
          approveLabel={isExceptionCloseOut ? "Acknowledge" : "Approve"}
          rejectLabel="Reject"
          disabled={hseReview.isPending}
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
                rows={buildHseCloseoutChecklistRows(hseCloseoutChecklist.data, {
                  hseVerifiedCloseOut,
                  setHseVerifiedCloseOut,
                  hseAreaSafe,
                  setHseAreaSafe,
                  hseCorrectiveActionRequired,
                  setHseCorrectiveActionRequired,
                })}
              />
              {hseCloseoutChecklist.isError ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  HSE close-out checklist template is not available; using the standard close-out checks.
                </p>
              ) : null}
              {!hseComment.trim() ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Add an HSE comment before returning or rejecting this close-out.
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
        <HseResult
          result={request.hseApproval}
          checklistResponses={hseCloseoutResponsesQuery.data ?? []}
        />
      ) : null}

      {permissions.showAuditTrail ? (
        <AuditTrail
          items={workflowAuditTrail}
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
  retainedCompletionEvidenceIds,
  onRetainedCompletionEvidenceIdsChange,
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
  retainedCompletionEvidenceIds: string[];
  onRetainedCompletionEvidenceIdsChange: (ids: string[]) => void;
}) {
  const details = request.completionDetails;
  const visibleEvidence = editable
    ? details.completionEvidence.filter(
        (attachment) =>
          !attachment.id || retainedCompletionEvidenceIds.includes(attachment.id),
      )
    : details.completionEvidence;
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
              max={getLatestActualWorkDateTime()}
              onValueChange={(value) => {
                onChange.setActualStartDateTime(value);
                if (
                  values.actualCompletionDateTime &&
                  isDateTimeBefore(
                    values.actualCompletionDateTime,
                    getDateTimeAfter(value, MIN_SCHEDULE_DURATION_MINUTES),
                  )
                ) {
                  onChange.setActualCompletionDateTime("");
                }
              }}
            />
            <FormDateTimeInput
              label="Actual Completion Date/Time"
              value={values.actualCompletionDateTime}
              disabled={!values.actualStartDateTime}
              placeholder={
                values.actualStartDateTime
                  ? "Select date and time"
                  : "Select actual start date/time first"
              }
              min={
                values.actualStartDateTime
                  ? getDateTimeAfter(
                      values.actualStartDateTime,
                      MIN_SCHEDULE_DURATION_MINUTES,
                    )
                  : undefined
              }
              max={getLatestActualWorkDateTime()}
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
        <SafetyAttachmentList
          label="Completion Evidence"
          attachments={visibleEvidence}
          emptyMessage="No completion evidence."
          onRemove={
            editable
              ? (attachmentId) =>
                  onRetainedCompletionEvidenceIdsChange(
                    retainedCompletionEvidenceIds.filter(
                      (id) => id !== attachmentId,
                    ),
                  )
              : undefined
          }
        />
        {editable ? (
          <div className="mt-4">
            <FileDropzone
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
  const lateStartThreshold = approvedStart
    ? new Date(
        approvedStart.getTime() +
          SCHEDULE_DEVIATION_TOLERANCE_MINUTES * 60 * 1000,
      )
    : null;
  const earlyCompletionThreshold = approvedEnd
    ? new Date(
        approvedEnd.getTime() -
          SCHEDULE_DEVIATION_TOLERANCE_MINUTES * 60 * 1000,
      )
    : null;

  return Boolean(
    (actualStart && approvedStart && actualStart < approvedStart) ||
      (actualStart && lateStartThreshold && actualStart > lateStartThreshold) ||
      (actualCompletion &&
        earlyCompletionThreshold &&
        actualCompletion < earlyCompletionThreshold) ||
      (actualCompletion && approvedEnd && actualCompletion > approvedEnd),
  );
}

function validateActualWorkTiming({
  actualStartDateTime,
  actualCompletionDateTime,
}: {
  actualStartDateTime: string;
  actualCompletionDateTime: string;
}) {
  if (!actualStartDateTime) return "Select actual start date/time.";
  if (!actualCompletionDateTime) return "Select actual completion date/time.";

  const actualStart = new Date(actualStartDateTime);
  const actualCompletion = new Date(actualCompletionDateTime);
  const now = new Date();

  if (Number.isNaN(actualStart.getTime())) {
    return "Select a valid actual start date/time.";
  }
  if (Number.isNaN(actualCompletion.getTime())) {
    return "Select a valid actual completion date/time.";
  }
  if (actualStart > now) {
    return "Actual start date/time cannot be in the future.";
  }
  if (actualCompletion > now) {
    return "Actual completion date/time cannot be in the future.";
  }

  const minimumCompletionTime = new Date(
    actualStart.getTime() + MIN_SCHEDULE_DURATION_MINUTES * 60 * 1000,
  );
  if (actualCompletion < minimumCompletionTime) {
    return `Actual completion date/time must be at least ${MIN_SCHEDULE_DURATION_MINUTES} minutes after actual start date/time.`;
  }

  return null;
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

function buildHseCloseoutChecklistAnswers(
  items: SafetyChecklistItem[],
  values: {
    hseVerifiedCloseOut: string;
    hseAreaSafe: string;
    hseCorrectiveActionRequired: string;
  },
): SafetyChecklistAnswerCreate[] {
  return [
    safetyBooleanAnswer(items, "verified_close_out", values.hseVerifiedCloseOut),
    safetyBooleanAnswer(items, "area_safe_for_operations", values.hseAreaSafe),
    safetyBooleanAnswer(
      items,
      "corrective_action_required",
      values.hseCorrectiveActionRequired,
    ),
  ].filter(Boolean) as SafetyChecklistAnswerCreate[];
}

function buildHseCloseoutChecklistRows(
  checklist: SafetyChecklistTemplate | undefined,
  values: {
    hseVerifiedCloseOut: string;
    setHseVerifiedCloseOut: (value: string) => void;
    hseAreaSafe: string;
    setHseAreaSafe: (value: string) => void;
    hseCorrectiveActionRequired: string;
    setHseCorrectiveActionRequired: (value: string) => void;
  },
) {
  const sourceItems =
    checklist?.items.filter((item) => item.input_type === "boolean") ?? [
      {
        item_key: "verified_close_out",
        label: "Did HSE inspect/verify close-out?",
        is_required: true,
      },
      {
        item_key: "area_safe_for_operations",
        label: "Area safe for normal operations?",
        is_required: true,
      },
      {
        item_key: "corrective_action_required",
        label: "Corrective action required?",
        is_required: true,
      },
    ];

  return sourceItems.map((item) => {
    if (item.item_key === "verified_close_out") {
      return {
        label: item.label,
        required: item.is_required,
        value: values.hseVerifiedCloseOut,
        onValueChange: values.setHseVerifiedCloseOut,
      };
    }
    if (item.item_key === "area_safe_for_operations") {
      return {
        label: item.label,
        required: item.is_required,
        value: values.hseAreaSafe,
        onValueChange: values.setHseAreaSafe,
      };
    }
    return {
      label: item.label,
      required: item.is_required,
      value: values.hseCorrectiveActionRequired,
      onValueChange: values.setHseCorrectiveActionRequired,
    };
  });
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

function safetyBooleanAnswer(
  items: SafetyChecklistItem[],
  itemKey: string,
  value: string,
): SafetyChecklistAnswerCreate | null {
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

function HseResult({
  result,
  checklistResponses,
}: {
  result: WorkCloseOutHseApproval;
  checklistResponses: SafetyChecklistResponse[];
}) {
  return (
    <FormSection title="HSE Close-Out Verification" description="Recorded HSE checklist and corrective-action details.">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2 space-y-2">
          <p className="text-sm font-medium text-brand-text-primary">
            HSE Checklist Responses
          </p>
          <SafetyChecklistResponsesView
            responses={checklistResponses}
            emptyMessage="No HSE close-out checklist responses recorded."
          />
        </div>
        {result.correctiveActionRequired ? (
          <FormTextarea label="Corrective Action Details" value={result.correctiveActionDetails} disabled />
        ) : null}
      </div>
    </FormSection>
  );
}

function ExceptionCloseOutNotice() {
  return (
    <p className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
      This is an exception close-out because it was not completed as approved or it has a remaining hazard. It can be acknowledged for audit, returned, or rejected, but it cannot be approved as successful.
    </p>
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

  if (request.status === "returned") {
    note =
      currentRole === "requester"
        ? "This close-out was returned. Review the comments, update the close-out, and resubmit."
        : "This close-out has been returned to the requester.";
  } else if (request.status === "denied") {
    note = "This close-out has been rejected and is closed.";
  } else if (request.status === "acknowledged") {
    note = "This exception close-out has been acknowledged for audit. It is not counted as a successful close-out.";
  }

  if (!note) return null;

  return (
    <div
      className={
        request.status === "denied"
          ? "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          : request.status === "acknowledged"
            ? "rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
            : "rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800"
      }
    >
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

function getEmployeeDisplayName(employee?: SafetyEmployeeProfile | null) {
  const name = [employee?.user?.first_name, employee?.user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || employee?.user?.email || null;
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
    toast.warning("Close-out returned to requester.");
  } else {
    toast.error(`Close-out rejected by ${actorLabel}.`);
  }
}

function routeBackToWorkCloseOutRequests(router: ReturnType<typeof useRouter>) {
  window.setTimeout(() => {
    router.push("/safety/work-close-out");
  }, 700);
}

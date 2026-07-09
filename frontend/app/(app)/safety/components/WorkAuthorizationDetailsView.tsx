"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, FileText, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import ApprovalPanel from "@/components/ui/ApprovalPanel";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import Button from "@/components/ui/Button";
import FileDropzone from "@/components/ui/FileDropzone";
import FormInput from "@/components/forms/FormInput";
import FormMultiSelect from "@/components/forms/FormMultiSelect";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import AuditTrail from "@/components/forms/AuditTrail";
import RoleBasedRecordHeader from "@/components/ui/RoleBasedRecordHeader";
import { useToast } from "@/hooks/useToast";
import { useMyApprovals } from "@/lib/modules/workflow/queries";
import {
  safetyChecklistsApi,
  useActiveSafetyChecklist,
} from "@/lib/modules/safety/checklists";
import type {
  SafetyChecklistAnswerCreate,
  SafetyChecklistItem,
  SafetyChecklistTemplate,
} from "@/lib/modules/safety/checklists";
import {
  mapWorkAuthorizationToRequest,
  useUpdateWorkAuthorization,
  useWorkAuthorization,
  workAuthorizationsApi,
  type WorkAuthorizationDecision,
  type WorkAuthorizationHseReviewCreate,
  type WorkAuthorizationInspectionCheck,
  type WorkAuthorizationInspectionResult,
} from "@/lib/modules/safety/workAuthorization";
import {
  useSafetyCurrentEmployee,
} from "@/lib/modules/safety/people";
import { getWorkAuthorizationNextActor } from "@/lib/safety-next-actor";
import SafetyProcessFormSkeleton from "./SafetyProcessFormSkeleton";
import type {
  WorkAuthorizationApprovalResult,
  WorkAuthorizationAttachment,
  WorkAuthorizationHseInspection,
  WorkAuthorizationRequest,
  WorkAuthorizationRole,
} from "@/types/safety";

const riskIndicatorOptions = [
  { value: "Gas/CNG/LNG involved", label: "Gas/CNG/LNG involved" },
  { value: "Pressurized system involved", label: "Pressurized system involved" },
  {
    value: "Heat, sparks, welding, cutting, or grinding",
    label: "Heat, sparks, welding, cutting, or grinding",
  },
  { value: "Electrical isolation required", label: "Electrical isolation required" },
  { value: "Lifting/heavy equipment involved", label: "Lifting/heavy equipment involved" },
  { value: "All required PPE available", label: "All required PPE available" },
];

const inspectionCheckOptions = [
  { value: "Pass", label: "Pass" },
  { value: "Fail", label: "Fail" },
  { value: "N/A", label: "N/A" },
];

const inspectionResultOptions = [
  { value: "Passed", label: "Passed" },
  { value: "Returned", label: "Returned" },
  { value: "Failed", label: "Failed" },
];
const workAuthorizationRoles: { value: WorkAuthorizationRole; label: string }[] = [
  { value: "requester", label: "Requester" },
  { value: "hse", label: "HSE Inspector" },
];

function decisionPastTense(decision: "Approve" | "Return" | "Deny") {
  if (decision === "Deny") return "denied";
  return `${decision.toLowerCase()}ed`;
}

type HseInspectionCheckState = Pick<
  WorkAuthorizationHseInspection,
  | "workAreaSafe"
  | "emergencyEquipmentAvailable"
  | "gasPressureCheckCompleted"
  | "ppeAndSafetyKitsAvailable"
  | "safetyControlsInPlace"
>;
type InspectionCheckValue =
  HseInspectionCheckState[keyof HseInspectionCheckState];
type BackendInspectionCheckValue = "pass" | "fail" | "not_applicable";
type EditableInspectionCheckValue =
  | InspectionCheckValue
  | BackendInspectionCheckValue
  | "";
type HseInspectionResult = WorkAuthorizationHseInspection["result"];
type EditableHseInspectionResult = HseInspectionResult | "";
type EditableHseInspectionCheckState = Record<
  keyof HseInspectionCheckState,
  EditableInspectionCheckValue
>;

const initialHseInspectionChecks: EditableHseInspectionCheckState = {
  workAreaSafe: "",
  emergencyEquipmentAvailable: "",
  gasPressureCheckCompleted: "",
  ppeAndSafetyKitsAvailable: "",
  safetyControlsInPlace: "",
};

function toApiInspectionCheck(
  value: EditableInspectionCheckValue,
): WorkAuthorizationInspectionCheck {
  if (value === "Pass" || value === "pass") return "pass";
  if (value === "Fail" || value === "fail") return "fail";
  return "not_applicable";
}

function toApiInspectionResult(
  value: EditableHseInspectionResult,
): WorkAuthorizationInspectionResult {
  if (value === "Passed") return "passed";
  if (value === "Failed") return "failed";
  return "returned";
}

function toApiDecision(
  value: "Approve" | "Return" | "Deny",
): WorkAuthorizationDecision {
  if (value === "Approve") return "approve";
  if (value === "Return") return "return";
  return "deny";
}

function getSelectedRiskIndicators(request: WorkAuthorizationRequest) {
  return [
    request.riskIndicators.gasInvolved ? "Gas/CNG/LNG involved" : "",
    request.riskIndicators.pressurizedSystem ? "Pressurized system involved" : "",
    request.riskIndicators.heatOrSparks
      ? "Heat, sparks, welding, cutting, or grinding"
      : "",
    request.riskIndicators.electricalIsolation
      ? "Electrical isolation required"
      : "",
    request.riskIndicators.liftingEquipment
      ? "Lifting/heavy equipment involved"
      : "",
    request.riskIndicators.ppeAvailable ? "All required PPE available" : "",
  ].filter(Boolean);
}

function toChecklistOptions(item: SafetyChecklistItem) {
  if (!Array.isArray(item.options_json)) return inspectionCheckOptions;
  return item.options_json.map((option) =>
    typeof option === "string"
      ? { value: option, label: option }
      : { value: option.value, label: option.label },
  );
}

const hseInspectionItemKeyMap: Partial<
  Record<string, keyof EditableHseInspectionCheckState>
> = {
  work_area_safe: "workAreaSafe",
  emergency_equipment_available: "emergencyEquipmentAvailable",
  gas_pressure_check_completed: "gasPressureCheckCompleted",
  ppe_and_safety_kits_available: "ppeAndSafetyKitsAvailable",
  safety_controls_in_place: "safetyControlsInPlace",
};

function buildHseInspectionChecklistAnswers(
  checklist: SafetyChecklistTemplate | undefined,
  checks: EditableHseInspectionCheckState,
  result: EditableHseInspectionResult,
  comment: string,
): SafetyChecklistAnswerCreate[] {
  if (!checklist) return [];

  return checklist.items.reduce<SafetyChecklistAnswerCreate[]>((answers, item) => {
    const mappedKey = hseInspectionItemKeyMap[item.item_key];

    if (item.input_type === "enum" && mappedKey) {
      answers.push({
        item_id: item.id,
        selected_option: toApiInspectionCheck(checks[mappedKey]),
      });
      return answers;
    }

    if (item.input_type === "enum" && item.item_key === "hse_inspection_result") {
      answers.push({
        item_id: item.id,
        selected_option: toApiInspectionResult(result),
      });
      return answers;
    }

    if (item.input_type === "text" && item.item_key === "inspection_comments") {
      const value = comment.trim();
      if (value) {
        answers.push({
          item_id: item.id,
          value_text: value,
        });
      }
    }

    return answers;
  }, []);
}

export default function WorkAuthorizationDetailsView({
  requestId,
}: {
  requestId: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [updatedRequest, setUpdatedRequest] =
    useState<WorkAuthorizationRequest | null>(null);
  const [hseComment, setHseComment] = useState("");
  const [hseEvidence, setHseEvidence] = useState<File[]>([]);
  const [hseInspectionChecks, setHseInspectionChecks] = useState(
    initialHseInspectionChecks,
  );
  const [hseInspectionResult, setHseInspectionResult] =
    useState<EditableHseInspectionResult>("");
  const [riskIndicators, setRiskIndicators] = useState<string[]>([]);
  const [additionalSafetyNote, setAdditionalSafetyNote] = useState("");
  const [requesterAttachments, setRequesterAttachments] = useState<File[]>([]);
  const hseInspectionChecklist = useActiveSafetyChecklist(
    "work_authorization",
    "inspection",
  );
  const requestQuery = useWorkAuthorization(requestId);
  const updateWorkAuthorization = useUpdateWorkAuthorization(requestId);
  const myApprovalsQuery = useMyApprovals();
  const currentEmployeeQuery = useSafetyCurrentEmployee();
  const currentEmployee = currentEmployeeQuery.data;
  const request =
    updatedRequest?.id === requestId ? updatedRequest : requestQuery.data ?? null;
  const myWorkAuthorizationApproval = (myApprovalsQuery.data ?? []).find(
    (approval) =>
      approval.request_type === "work_authorization" &&
      approval.request_id === requestId,
  );

  /* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!request) return;
    setRiskIndicators(getSelectedRiskIndicators(request));
    setAdditionalSafetyNote(request.riskIndicators.additionalSafetyNote);
    setRequesterAttachments([]);
  }, [request?.id, request?.status]);
  /* eslint-enable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
  const isRequester = Boolean(
    request?.requesterId &&
      currentEmployee?.id &&
      request.requesterId === currentEmployee.id,
  );
  const isAssignedSupervisor = Boolean(
    request?.workInitiation.assignedSupervisorId &&
      currentEmployee?.id &&
      request.workInitiation.assignedSupervisorId === currentEmployee.id,
  );
  const isHseEmployee = isHseDepartment(currentEmployee?.department);
  const isAssignedHseWorkflowApprover = Boolean(myWorkAuthorizationApproval);
  const hasDirectWorkAuthorizationAccess =
    isRequester || isAssignedSupervisor || isAssignedHseWorkflowApprover;
  const currentRole = getWorkAuthorizationAccessRole({
    isRequester,
    isAssignedSupervisor,
    isHseEmployee: isAssignedHseWorkflowApprover,
  });

  const hasFailedHseInspectionCheck = Object.values(hseInspectionChecks).some(
    (value) => value === "Fail" || value === "fail",
  );
  const hasFailedHseInspectionResult = hseInspectionResult === "Failed";
  const shouldDisableHseApproval =
    hasFailedHseInspectionCheck || hasFailedHseInspectionResult;

  const isDraft = request?.status === "draft";
  const isSubmitted = request?.status === "submitted";
  const isApproved = request?.status === "approved";
  const isReturned = request?.status === "returned";
  const isDenied = request?.status === "denied";
  const permissions = {
    canEditDraft: isRequester && (isDraft || isReturned),
    canHseInspect: isHseEmployee && isAssignedHseWorkflowApprover && isSubmitted,
    showHseSection: Boolean(
      (isHseEmployee && isAssignedHseWorkflowApprover && isSubmitted) ||
        isApproved ||
        isReturned ||
        isDenied,
    ),
    showAuditTrail: Boolean(!isDraft || isApproved || isReturned || isDenied),
  };

  if (
    requestQuery.isLoading ||
    currentEmployeeQuery.isLoading ||
    myApprovalsQuery.isLoading
  ) {
    return <SafetyProcessFormSkeleton sections={5} />;
  }

  if (!request) {
    return (
      <div className="rounded-2xl border border-brand-border bg-white p-6">
        <p className="text-sm text-brand-text-secondary">
          Work authorization request not found.
        </p>
      </div>
    );
  }
  if (permissions.canHseInspect && hseInspectionChecklist.isLoading) {
    return <SafetyProcessFormSkeleton sections={5} />;
  }
  const persistedRequestId = request.id;

  async function handleRequesterSubmit() {
    try {
      const updated = await updateWorkAuthorization.mutateAsync({
        payload: {
          gas_involved: riskIndicators.includes("Gas/CNG/LNG involved"),
          pressurized_system: riskIndicators.includes("Pressurized system involved"),
          heat_or_sparks: riskIndicators.includes(
            "Heat, sparks, welding, cutting, or grinding",
          ),
          electrical_isolation: riskIndicators.includes(
            "Electrical isolation required",
          ),
          lifting_equipment: riskIndicators.includes(
            "Lifting/heavy equipment involved",
          ),
          ppe_available: riskIndicators.includes("All required PPE available"),
          additional_safety_note: additionalSafetyNote || null,
          attachment_notes: null,
          attachments: [],
        },
        attachments: requesterAttachments,
      });
      setUpdatedRequest(mapWorkAuthorizationToRequest(updated));
      toast.success("Work authorization resubmitted.");
      routeBackToWorkAuthorizationRequests(router);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Work authorization could not be resubmitted."),
      );
    }
  }

  async function handleHseDecision(decision: "Approve" | "Return" | "Deny") {
    if (decision === "Approve" && shouldDisableHseApproval) {
      return;
    }
    if ((decision === "Return" || decision === "Deny") && !hseComment.trim()) {
      return;
    }

    const result =
      hseInspectionResult ||
      (decision === "Approve"
        ? "Passed"
        : decision === "Return"
          ? "Returned"
          : "Failed");
    const payload: WorkAuthorizationHseReviewCreate = {
      work_area_safe: toApiInspectionCheck(hseInspectionChecks.workAreaSafe),
      emergency_equipment_available: toApiInspectionCheck(
        hseInspectionChecks.emergencyEquipmentAvailable,
      ),
      gas_pressure_check_completed: toApiInspectionCheck(
        hseInspectionChecks.gasPressureCheckCompleted,
      ),
      ppe_and_safety_kits_available: toApiInspectionCheck(
        hseInspectionChecks.ppeAndSafetyKitsAvailable,
      ),
      safety_controls_in_place: toApiInspectionCheck(
        hseInspectionChecks.safetyControlsInPlace,
      ),
      hse_inspection_result: toApiInspectionResult(result),
      hse_inspection_comment: hseComment || "Area inspected and cleared for work.",
      decision: toApiDecision(decision),
      decision_comment:
        hseComment ||
        (decision === "Approve"
          ? "Request approved by HSE."
          : `Request ${decisionPastTense(decision)} by HSE.`),
    };

    try {
      const updated = await workAuthorizationsApi.createHseReview(
        persistedRequestId,
        payload,
        hseEvidence,
      );
      setUpdatedRequest(mapWorkAuthorizationToRequest(updated));

      const checklistAnswers = buildHseInspectionChecklistAnswers(
        hseInspectionChecklist.data,
        hseInspectionChecks,
        result,
        payload.hse_inspection_comment ?? "",
      );
      let checklistHistoryWasSaved = true;

      if (checklistAnswers.length > 0) {
        try {
          await safetyChecklistsApi.createResponses({
            parent_type: "work_authorization",
            parent_id: persistedRequestId,
            answers: checklistAnswers,
          });
        } catch (checklistError) {
          checklistHistoryWasSaved = false;
          console.error(
            "Failed to save work authorization HSE inspection checklist responses",
            checklistError,
          );
        }
      }

      if (!checklistHistoryWasSaved) {
        toast.info(
          "HSE decision saved, but the inspection checklist history could not be saved.",
        );
        routeBackToWorkAuthorizationRequests(router);
        return;
      }

      if (decision === "Approve") {
        toast.success("Work authorization approved by HSE.");
      } else if (decision === "Return") {
        toast.info("Work authorization returned to requester.");
      } else {
        toast.error("Work authorization denied by HSE.");
      }
      routeBackToWorkAuthorizationRequests(router);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "HSE decision could not be saved."));
    }
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => router.push("/safety/work-authorization")}
        className="flex items-center gap-2 text-sm text-brand-text-secondary transition-colors hover:text-brand-text-primary"
      >
        <ArrowLeft size={14} />
        Back to Work Authorization
      </button>

      <RoleBasedRecordHeader
        id={request.reference ?? "Reference pending"}
        currentRole={currentRole}
        onRoleChange={() => undefined}
        roleLabel={
          hasDirectWorkAuthorizationAccess ? roleLabel(currentRole) : "Viewer"
        }
        roles={workAuthorizationRoles}
        recordLabel="Work Authorization Details"
        status={<ApprovalBadge status={request.status} />}
        nextActor={getWorkAuthorizationNextActor(request)}
        showRoleSwitcher={false}
      />

      <StatusNote request={request} currentRole={currentRole} />

      <RequesterDetailsSection request={request} />
      <AssignedWorkSummarySection request={request} />
      <RiskIndicatorsSection
        editable={permissions.canEditDraft}
        selectedRiskIndicators={riskIndicators}
        onRiskIndicatorsChange={setRiskIndicators}
        additionalSafetyNote={additionalSafetyNote}
        onAdditionalSafetyNoteChange={setAdditionalSafetyNote}
      />
      <AttachmentsSection
        request={request}
        editable={permissions.canEditDraft}
        newAttachments={requesterAttachments}
        onNewAttachmentsChange={setRequesterAttachments}
      />

      {currentRole === "requester" &&
      (request.status === "draft" || request.status === "returned") ? (
        <div className="flex justify-end">
          <Button
            onClick={handleRequesterSubmit}
            loading={updateWorkAuthorization.isPending}
            loadingText="Submitting..."
          >
            Submit Request
          </Button>
        </div>
      ) : null}

      {permissions.showHseSection ? (
        permissions.canHseInspect ? (
          <>
            <HseInspectionActionSection
              comment={hseComment}
              onCommentChange={setHseComment}
              checks={hseInspectionChecks}
              onCheckChange={(key, value) =>
                setHseInspectionChecks((current) => ({
                  ...current,
                  [key]: value,
                }))
              }
              inspectionResult={hseInspectionResult}
              onInspectionResultChange={setHseInspectionResult}
              evidence={hseEvidence}
              onEvidenceChange={setHseEvidence}
              checklist={hseInspectionChecklist.data}
              checklistError={hseInspectionChecklist.isError}
            />
            <HseFinalActionSection
              onDecision={handleHseDecision}
              disableApprove={shouldDisableHseApproval}
              reasonMissing={!hseComment.trim()}
            />
          </>
        ) : (
          <>
            {request.hseInspection ? (
              <HseInspectionResultSection inspection={request.hseInspection} />
            ) : null}
            {request.hseApproval ? (
              <ApprovalResultSection
                title="HSE Final Approval Result"
                result={request.hseApproval}
              />
            ) : null}
          </>
        )
      ) : null}

      {permissions.showAuditTrail ? (
        <AuditTrail items={request.auditTrail} />
      ) : null}
    </div>
  );
}

function RequesterDetailsSection({
  request,
}: {
  request: WorkAuthorizationRequest;
}) {
  return (
    <FormSection title="Requester Details" description="Employee information for the requester who raised this authorization.">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="Requester Name"
          value={request.requester.name}
          disabled
        />
        <FormInput
          label="Department"
          value={request.requester.department}
          disabled
        />
        <FormInput
          label="Job Title / Role"
          value={request.requester.role}
          disabled
        />
        <FormInput
          label="Request Date"
          value={request.requester.requestDate}
          disabled
        />
      </div>
    </FormSection>
  );
}

function AssignedWorkSummarySection({
  request,
}: {
  request: WorkAuthorizationRequest;
}) {
  const work = request.workInitiation;
  return (
    <FormSection title="Assigned Work Summary" description="Approved scope and assignments carried from Work Initiation.">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="Work Initiation Reference"
          value={work.reference ?? "Reference pending"}
          disabled
        />
        <FormInput
          label="Work Title"
          value={work.title}
          disabled
        />
        <FormInput label="Work Category" value={work.workCategory} disabled />
        {work.relatedIncidentHazardId ? (
          <FormInput label="Related Incident/Hazard Request" value={work.relatedIncidentHazardId} disabled />
        ) : null}
        <FormInput
          label="Type of Work"
          value={work.workType.join(", ")}
          disabled
        />
        <FormInput label="Location" value={work.location} disabled />
        <FormTextarea label="Exact Work Area" value={work.exactWorkArea} disabled />
        <FormInput label="Assigned Supervisor" value={work.assignedSupervisor} disabled />
        <FormInput
          label="Assigned Workers"
          value={work.assignedWorkers.join(", ")}
          disabled
        />
        <FormInput label="Contractors Needed" value={work.contractorsNeeded ? "Yes" : "No"} disabled />
        {work.contractorsNeeded ? (
          <>
            <FormInput label="Selected Contractor" value={work.selectedContractor} disabled />
            <FormInput label="Contractor Contact Email" type="email" value={work.contractorContactEmail} disabled />
          </>
        ) : null}
        <FormInput label="Planned Start Date/Time" value={work.plannedStartDateTime} disabled />
        <FormInput label="Planned End Date/Time" value={work.plannedEndDateTime} disabled />
        <FormTextarea label="Work Description" value={work.workDescription} disabled className="md:col-span-2" />
      </div>
    </FormSection>
  );
}

function RiskIndicatorsSection({
  editable,
  selectedRiskIndicators,
  onRiskIndicatorsChange,
  additionalSafetyNote,
  onAdditionalSafetyNoteChange,
}: {
  editable: boolean;
  selectedRiskIndicators: string[];
  onRiskIndicatorsChange: (value: string[]) => void;
  additionalSafetyNote: string;
  onAdditionalSafetyNoteChange: (value: string) => void;
}) {
  return (
    <FormSection title="Risk & Safety Indicators" description="Safety considerations identified for this work activity.">
      <div className="grid gap-4 md:grid-cols-[minmax(300px,420px)_1fr] md:items-start">
        <FormMultiSelect
          label="Risk Indicators"
          options={riskIndicatorOptions}
          value={selectedRiskIndicators}
          onValueChange={onRiskIndicatorsChange}
          disabled={!editable}
          searchable
          placeholder="Select all risk indicators that apply"
        />
        <FormTextarea
          label="Additional Safety Note"
          value={additionalSafetyNote}
          onChange={(event) => onAdditionalSafetyNoteChange(event.target.value)}
          disabled={!editable}
        />
      </div>
    </FormSection>
  );
}

function AttachmentsSection({
  request,
  editable,
  newAttachments,
  onNewAttachmentsChange,
}: {
  request: WorkAuthorizationRequest;
  editable: boolean;
  newAttachments: File[];
  onNewAttachmentsChange: (files: File[]) => void;
}) {
  return (
    <FormSection title="Attachments" description="Supporting safety documents and evidence attached to this request.">
      <AttachmentList attachments={request.attachments} />
      {editable ? (
        <div className="mt-4">
          <FileDropzone
            label="Add Attachments"
            value={newAttachments}
            onChange={onNewAttachmentsChange}
            accept="image/*,.pdf,.doc,.docx"
            maxFiles={10}
            hint="These files will be uploaded when the returned request is resubmitted."
          />
        </div>
      ) : null}
    </FormSection>
  );
}

function AttachmentList({
  attachments,
}: {
  attachments: WorkAuthorizationAttachment[];
}) {
  if (attachments.length === 0) {
    return <p className="text-sm text-brand-text-secondary">No attachments.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {attachments.map((attachment) => (
        <AttachmentItem
          key={attachment.id ?? attachment.name}
          attachment={attachment}
        />
      ))}
    </div>
  );
}

function AttachmentItem({
  attachment,
}: {
  attachment: WorkAuthorizationAttachment;
}) {
  const content = (
    <>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-brand-purple">
        {attachment.type === "image" ? (
          <ImageIcon size={18} />
        ) : (
          <FileText size={18} />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-brand-text-primary">
          {attachment.name}
        </p>
        <p className="text-xs capitalize text-brand-text-secondary">
          {attachment.type}
        </p>
      </div>
    </>
  );

  if (attachment.url) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 rounded-xl border border-brand-border bg-gray-50 p-3 transition-colors hover:border-brand-purple hover:bg-brand-purple-faint"
      >
        {content}
      </a>
    );
  }

  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-brand-border bg-gray-50 p-3"
    >
      {content}
    </div>
  );
}

function HseInspectionActionSection({
  comment,
  onCommentChange,
  checks,
  onCheckChange,
  inspectionResult,
  onInspectionResultChange,
  evidence,
  onEvidenceChange,
  checklist,
  checklistError,
}: {
  comment: string;
  onCommentChange: (comment: string) => void;
  checks: typeof initialHseInspectionChecks;
  onCheckChange: (
    key: keyof typeof initialHseInspectionChecks,
    value: EditableInspectionCheckValue,
  ) => void;
  inspectionResult: EditableHseInspectionResult;
  onInspectionResultChange: (value: EditableHseInspectionResult) => void;
  evidence: File[];
  onEvidenceChange: (files: File[]) => void;
  checklist?: SafetyChecklistTemplate;
  checklistError: boolean;
}) {
  function renderChecklistItem(item: SafetyChecklistItem) {
    const mappedKey = hseInspectionItemKeyMap[item.item_key];
    if (item.input_type === "text" && item.item_key === "inspection_comments") {
      return (
        <FormTextarea
          key={item.id}
          label={item.label}
          value={comment}
          onChange={(event) => onCommentChange(event.target.value)}
          placeholder="Add inspection comments"
        />
      );
    }
    if (item.input_type === "enum" && mappedKey) {
      return (
        <FormSelect
          key={item.id}
          label={item.label}
          options={toChecklistOptions(item)}
          placeholder="Select inspection result"
          value={checks[mappedKey]}
          onValueChange={(value) =>
            onCheckChange(mappedKey, value as EditableInspectionCheckValue)
          }
        />
      );
    }
    if (item.input_type === "enum" && item.item_key === "hse_inspection_result") {
      return (
        <FormSelect
          key={item.id}
          label={item.label}
          options={inspectionResultOptions}
          placeholder="Select inspection result"
          value={inspectionResult}
          onValueChange={(value) =>
            onInspectionResultChange(value as EditableHseInspectionResult)
          }
        />
      );
    }
    return (
      <FormInput
        key={item.id}
        label={item.label}
        defaultValue={item.default_value ?? ""}
      />
    );
  }

  return (
    <FormSection title="HSE Inspection Acknowledgement" description="Complete the safety checks required before making an HSE decision.">
      <div className="grid gap-4 md:grid-cols-2">
        {checklistError ? (
          <div className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            HSE inspection checklist template is not available.
          </div>
        ) : null}
        {checklist?.items.map(renderChecklistItem)}
        <FormInput
          label="Inspection date/time"
          defaultValue="2026-05-18 11:00 AM"
        />
        {checklist?.items.some((item) => item.item_key === "hse_inspection_result") ? null : (
          <FormSelect
            label="Inspection result"
            options={inspectionResultOptions}
            placeholder="Select inspection result"
            value={inspectionResult}
            onValueChange={(value) =>
              onInspectionResultChange(value as EditableHseInspectionResult)
            }
          />
        )}
        <div className="md:col-span-2">
          <FileDropzone
            label="Inspection evidence/images"
            value={evidence}
            onChange={onEvidenceChange}
            accept="image/*,.pdf,.doc,.docx"
            maxFiles={10}
          />
        </div>
      </div>
    </FormSection>
  );
}

function HseFinalActionSection({
  onDecision,
  disableApprove,
  reasonMissing,
}: {
  onDecision: (decision: "Approve" | "Return" | "Deny") => void;
  disableApprove: boolean;
  reasonMissing: boolean;
}) {
  return (
    <ApprovalPanel
      title="HSE Final Approval"
      description="Record the final safety decision for this work authorization."
      showComment={false}
      rejectLabel="Deny"
      approveDisabled={disableApprove}
      returnDisabled={reasonMissing}
      rejectDisabled={reasonMissing}
      onApprove={() => onDecision("Approve")}
      onReturn={() => onDecision("Return")}
      onReject={() => onDecision("Deny")}
      extraFields={
        <div className="space-y-3">
          {disableApprove ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Approval is disabled because one or more inspection checks failed.
            </p>
          ) : null}
          {reasonMissing ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Add an HSE inspection comment before returning or denying this request.
            </p>
          ) : null}
        </div>
      }
    />
  );
}

function ApprovalResultSection({
  title,
  result,
}: {
  title: string;
  result: WorkAuthorizationApprovalResult;
}) {
  return (
    <FormSection title={title} description="Recorded HSE decision and review notes for this request.">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Decision" value={result.decision} disabled />
        <FormInput label="Approver" value={result.approver} disabled />
        <FormInput label="Date/time" value={result.dateTime} disabled />
        <FormTextarea label="Comment" value={result.comment} disabled />
      </div>
    </FormSection>
  );
}

function HseInspectionResultSection({
  inspection,
}: {
  inspection: WorkAuthorizationHseInspection;
}) {
  return (
    <FormSection title="HSE Inspection Result" description="Completed inspection evidence supporting the final HSE decision.">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="Work area is safe, clean, and accessible"
          value={inspection.workAreaSafe}
          disabled
        />
        <FormInput
          label="Fire extinguisher/emergency equipment is available"
          value={inspection.emergencyEquipmentAvailable}
          disabled
        />
        <FormInput
          label="Gas leak/pressure/abnormal condition check completed"
          value={inspection.gasPressureCheckCompleted}
          disabled
        />
        <FormInput
          label="Required PPE and safety kits are available"
          value={inspection.ppeAndSafetyKitsAvailable}
          disabled
        />
        <FormInput
          label="Required safety controls are in place"
          value={inspection.safetyControlsInPlace}
          disabled
        />
        <FormInput
          label="Inspection date/time"
          value={inspection.inspectionDateTime}
          disabled
        />
        <FormInput
          label="Inspection result"
          value={inspection.result}
          disabled
        />
        <FormTextarea
          label="Inspection comments"
          value={inspection.comments}
          disabled
        />
      </div>
      <div className="mt-4">
        <AttachmentList attachments={inspection.evidence} />
      </div>
    </FormSection>
  );
}

function StatusNote({
  request,
  currentRole,
}: {
  request: WorkAuthorizationRequest;
  currentRole: WorkAuthorizationRole;
}) {
  let note = "";

  if (request.status === "draft" && currentRole !== "requester") {
    note = "This request is still in draft and has not been submitted.";
  } else if (request.status === "returned") {
    note =
      currentRole === "requester"
        ? "This request was returned. Review the comments, update the request, and resubmit."
        : "This request has been returned to the requester.";
  } else if (request.status === "denied") {
    note = "This request has been denied and is closed.";
  } else if (request.status === "approved") {
    note = "Approved. HSE has confirmed the safety requirements and work can begin.";
  } else if (request.status === "submitted") {
    note =
      currentRole === "hse"
        ? "This request is waiting for your HSE inspection and authorization decision."
        : "Waiting for HSE inspection and authorization.";
  }

  if (!note) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      {note}
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-visible rounded-2xl border border-brand-border bg-white">
      <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-5 py-4 md:px-6">
        <h3 className="text-base font-semibold text-brand-text-primary">
          {title}
        </h3>
        {description ? <p className="mt-1 text-sm text-brand-text-secondary">{description}</p> : null}
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

function roleLabel(role: WorkAuthorizationRole) {
  if (role === "hse") return "HSE Inspector";
  if (role === "supervisor") return "Supervisor";
  return "Requester";
}

function getWorkAuthorizationAccessRole({
  isRequester,
  isAssignedSupervisor,
  isHseEmployee,
}: {
  isRequester: boolean;
  isAssignedSupervisor: boolean;
  isHseEmployee: boolean;
}): WorkAuthorizationRole {
  if (isHseEmployee) return "hse";
  if (isAssignedSupervisor) return "supervisor";
  if (isRequester) return "requester";

  return "requester";
}

function isHseDepartment(department?: string | null) {
  const normalizedDepartment = department?.trim().toLowerCase();
  return normalizedDepartment === "hse" || normalizedDepartment === "safety";
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const detail = (error as { response?: { data?: { detail?: unknown } } }).response
    ?.data?.detail;

  if (typeof detail === "string") return detail;
  if (
    detail &&
    typeof detail === "object" &&
    "message" in detail &&
    typeof detail.message === "string"
  ) {
    return detail.message;
  }

  return fallback;
}

function routeBackToWorkAuthorizationRequests(router: ReturnType<typeof useRouter>) {
  window.setTimeout(() => {
    router.push("/safety/work-authorization");
  }, 700);
}

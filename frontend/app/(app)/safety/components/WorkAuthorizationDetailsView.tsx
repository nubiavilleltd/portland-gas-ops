"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileText, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import Button from "@/components/ui/Button";
import FileDropzone from "@/components/ui/FileDropzone";
import FormInput from "@/components/forms/FormInput";
import FormMultiSelect from "@/components/forms/FormMultiSelect";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import { fetchWorkAuthorizationRequest } from "@/lib/mock/work-authorization-api";
import { updateWorkAuthorization } from "@/lib/safety-demo-store";
import MockUserSwitcher from "./MockUserSwitcher";
import type {
  WorkAuthorizationApprovalResult,
  WorkAuthorizationAttachment,
  WorkAuthorizationAuditTrailItem,
  WorkAuthorizationHseInspection,
  WorkAuthorizationRequest,
  WorkAuthorizationRole,
} from "@/types/safety";

const decisionOptions = [
  { value: "Approve", label: "Approve" },
  { value: "Return", label: "Return" },
  { value: "Deny", label: "Deny" },
];

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
type EditableInspectionCheckValue = InspectionCheckValue | "";
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

function toInspectionCheckValue(
  value: EditableInspectionCheckValue,
): InspectionCheckValue {
  return value || "N/A";
}

export default function WorkAuthorizationDetailsView({
  requestId,
}: {
  requestId: string;
}) {
  const router = useRouter();
  const [currentRole, setCurrentRole] =
    useState<WorkAuthorizationRole>("requester");
  const [request, setRequest] = useState<WorkAuthorizationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [hseComment, setHseComment] = useState("");
  const [hseEvidence, setHseEvidence] = useState<File[]>([]);
  const [hseInspectionChecks, setHseInspectionChecks] = useState(
    initialHseInspectionChecks,
  );
  const [hseInspectionResult, setHseInspectionResult] =
    useState<EditableHseInspectionResult>("");

  const hasFailedHseInspectionCheck = Object.values(hseInspectionChecks).some(
    (value) => value === "Fail",
  );
  const hasFailedHseInspectionResult = hseInspectionResult === "Failed";
  const shouldDisableHseApproval =
    hasFailedHseInspectionCheck || hasFailedHseInspectionResult;

  useEffect(() => {
    let mounted = true;

    fetchWorkAuthorizationRequest(requestId)
      .then((item) => {
        if (mounted) setRequest(item);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [requestId]);

  const permissions = useMemo(() => {
    const isDraft = request?.status === "draft";
    const isSubmitted = request?.status === "submitted";
    const isApproved = request?.status === "approved";
    const isReturned = request?.status === "returned";
    const isDenied = request?.status === "denied";
    const isUnauthorized = request?.status === "unauthorized";

    return {
      canEditDraft: currentRole === "requester" && (isDraft || isReturned),
      canHseInspect: currentRole === "hse" && isSubmitted,
      showHseSection: Boolean(
        (currentRole === "hse" && isSubmitted) ||
          isApproved ||
          isReturned ||
          isUnauthorized,
      ),
      showAuditTrail: Boolean(!isDraft || isApproved || isReturned || isDenied || isUnauthorized),
    };
  }, [currentRole, request?.status]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-20 animate-pulse rounded-2xl border border-brand-border bg-white"
          />
        ))}
      </div>
    );
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
  const persistedRequestId = request.id;

  function persistUpdate(
    update: (current: WorkAuthorizationRequest) => WorkAuthorizationRequest,
  ) {
    const updated = updateWorkAuthorization(persistedRequestId, update);
    if (updated) setRequest(updated);
  }

  function handleRequesterSubmit() {
    if (!request) return;

    const audit: WorkAuthorizationAuditTrailItem = {
      action: "Submitted",
      actor: request.requester.name,
      role: "Requester",
      dateTime: "2026-05-18 09:30 AM",
      comment: "Work authorization request submitted.",
    };
    persistUpdate((current) => ({
      ...current,
      status: "submitted",
      auditTrail: [...current.auditTrail, audit],
    }));
  }

  function handleHseDecision(decision: "Approve" | "Return" | "Deny") {
    if (decision === "Approve" && shouldDisableHseApproval) {
      return;
    }
    if (decision === "Return" && !hseComment.trim()) {
      return;
    }

    const inspection: WorkAuthorizationHseInspection = {
      workAreaSafe: toInspectionCheckValue(hseInspectionChecks.workAreaSafe),
      emergencyEquipmentAvailable: toInspectionCheckValue(
        hseInspectionChecks.emergencyEquipmentAvailable,
      ),
      gasPressureCheckCompleted: toInspectionCheckValue(
        hseInspectionChecks.gasPressureCheckCompleted,
      ),
      ppeAndSafetyKitsAvailable: toInspectionCheckValue(
        hseInspectionChecks.ppeAndSafetyKitsAvailable,
      ),
      safetyControlsInPlace: toInspectionCheckValue(hseInspectionChecks.safetyControlsInPlace),
      inspectionDateTime: "2026-05-18 11:00 AM",
      comments: hseComment || "Area inspected and cleared for work.",
      result:
        hseInspectionResult ||
        (decision === "Approve"
          ? "Passed"
          : decision === "Return"
            ? "Returned"
            : "Failed"),
      evidence:
        hseEvidence.length > 0
          ? hseEvidence.map((file) => ({
              name: file.name,
              type: "image" as const,
            }))
          : [{ name: "hse-inspection-photo.jpg", type: "image" }],
    };
    const approval: WorkAuthorizationApprovalResult = {
      decision,
      approver: "Samuel Bassey",
      dateTime: "2026-05-18 11:10 AM",
      comment:
        hseComment ||
        (decision === "Approve"
          ? "Request approved by HSE."
          : `Request ${decisionPastTense(decision)} by HSE.`),
    };

    const pastTense = {
      Approve: "Approved",
      Deny: "Denied",
      Return: "Returned",
      Reject: "Rejected", // Easy to add more later!
      Cancel: "Cancelled",
    };

    const inspectionAudit: WorkAuthorizationAuditTrailItem = {
      action: "HSE Inspection Completed",
      actor: approval.approver,
      role: "HSE Inspector",
      dateTime: inspection.inspectionDateTime,
      comment: inspection.comments,
    };
    const decisionAudit: WorkAuthorizationAuditTrailItem = {
      action: `HSE ${pastTense[decision] || `${decision}ed`}`,
      actor: approval.approver,
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
            : "unauthorized",
      hseInspection: inspection,
      hseApproval: approval,
      auditTrail: [...current.auditTrail, inspectionAudit, decisionAudit],
    }));
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

      <MockUserSwitcher value={currentRole} onChange={setCurrentRole} showSupervisor={false} />

      <section className="rounded-2xl border border-brand-border bg-white p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-text-secondary">
              Work Authorization Details
            </p>
            <h2 className="mt-1 text-xl font-semibold text-brand-text-primary">
              {request.id}
            </h2>
            <p className="mt-1 text-sm text-brand-text-secondary">
              Viewing as {roleLabel(currentRole)}
            </p>
          </div>
          <ApprovalBadge status={request.status} />
        </div>
      </section>

      <StatusNote request={request} currentRole={currentRole} />

      <RequesterDetailsSection request={request} />
      <AssignedWorkSummarySection request={request} />
      <RiskIndicatorsSection
        request={request}
        editable={permissions.canEditDraft}
      />
      <AttachmentsSection
        request={request}
        editable={permissions.canEditDraft}
      />

      {currentRole === "requester" &&
      (request.status === "draft" || request.status === "returned") ? (
        <div className="flex justify-end">
          <Button onClick={handleRequesterSubmit}>Submit Request</Button>
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
            />
            <HseFinalActionSection
              onDecision={handleHseDecision}
              disableApprove={shouldDisableHseApproval}
              returnReasonMissing={!hseComment.trim()}
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
        <AuditTrailSection items={request.auditTrail} />
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
    <FormSection title="Requester Details">
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
    <FormSection title="Assigned Work Summary">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Work Initiation Reference" value={work.id} disabled />
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
        <FormInput label="Priority" value={work.priority} disabled />
        <FormInput label="Location" value={work.location} disabled />
        <FormInput label="Exact Work Area" value={work.exactWorkArea} disabled />
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
  request,
  editable,
}: {
  request: WorkAuthorizationRequest;
  editable: boolean;
}) {
  const selectedRiskIndicators = [
    request.riskIndicators.gasInvolved ? "Gas/CNG/LNG involved" : "",
    request.riskIndicators.pressurizedSystem ? "Pressurized system involved" : "",
    request.riskIndicators.heatOrSparks ? "Heat, sparks, welding, cutting, or grinding" : "",
    request.riskIndicators.electricalIsolation ? "Electrical isolation required" : "",
    request.riskIndicators.liftingEquipment ? "Lifting/heavy equipment involved" : "",
    request.riskIndicators.ppeAvailable ? "All required PPE available" : "",
  ].filter(Boolean);

  return (
    <FormSection title="Risk & Safety Indicators">
      <div className="grid gap-4">
        <FormMultiSelect
          label="Risk Indicators"
          options={riskIndicatorOptions}
          defaultValue={selectedRiskIndicators}
          disabled={!editable}
          searchable
          placeholder="Select all risk indicators that apply"
        />
        <FormTextarea
          label="Additional Safety Note"
          defaultValue={request.riskIndicators.additionalSafetyNote}
          disabled={!editable}
        />
      </div>
    </FormSection>
  );
}

function AttachmentsSection({
  request,
  editable,
}: {
  request: WorkAuthorizationRequest;
  editable: boolean;
}) {
  const [newAttachments, setNewAttachments] = useState<File[]>([]);

  return (
    <FormSection title="Attachments">
      <AttachmentList attachments={request.attachments} />
      {editable ? (
        <div className="mt-4">
          <FileDropzone
            label="Add Attachments"
            value={newAttachments}
            onChange={setNewAttachments}
            accept="image/*,.pdf,.doc,.docx"
            maxFiles={10}
            hint="Local selection only. No upload is performed."
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
        <div
          key={attachment.name}
          className="flex items-center gap-3 rounded-xl border border-brand-border bg-gray-50 p-3"
        >
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
        </div>
      ))}
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
}) {
  return (
    <FormSection title="HSE Inspection Acknowledgement">
      <div className="grid gap-4 md:grid-cols-2">
        <FormSelect
          label="Work area is safe, clean, and accessible"
          options={inspectionCheckOptions}
          placeholder="Select inspection result"
          value={checks.workAreaSafe}
          onValueChange={(value) =>
            onCheckChange("workAreaSafe", value as EditableInspectionCheckValue)
          }
        />
        <FormSelect
          label="Fire extinguisher/emergency equipment is available"
          options={inspectionCheckOptions}
          placeholder="Select inspection result"
          value={checks.emergencyEquipmentAvailable}
          onValueChange={(value) =>
            onCheckChange(
              "emergencyEquipmentAvailable",
              value as EditableInspectionCheckValue,
            )
          }
        />
        <FormSelect
          label="Gas leak/pressure/abnormal condition check completed"
          options={inspectionCheckOptions}
          placeholder="Select inspection result"
          value={checks.gasPressureCheckCompleted}
          onValueChange={(value) =>
            onCheckChange(
              "gasPressureCheckCompleted",
              value as EditableInspectionCheckValue,
            )
          }
        />
        <FormSelect
          label="Required PPE and safety kits are available"
          options={inspectionCheckOptions}
          placeholder="Select inspection result"
          value={checks.ppeAndSafetyKitsAvailable}
          onValueChange={(value) =>
            onCheckChange(
              "ppeAndSafetyKitsAvailable",
              value as EditableInspectionCheckValue,
            )
          }
        />
        <FormSelect
          label="Required safety controls are in place"
          options={inspectionCheckOptions}
          placeholder="Select inspection result"
          value={checks.safetyControlsInPlace}
          onValueChange={(value) =>
            onCheckChange("safetyControlsInPlace", value as EditableInspectionCheckValue)
          }
        />
        <FormInput
          label="Inspection date/time"
          defaultValue="2026-05-18 11:00 AM"
        />
        <FormSelect
          label="Inspection result"
          options={inspectionResultOptions}
          placeholder="Select inspection result"
          value={inspectionResult}
          onValueChange={(value) =>
            onInspectionResultChange(value as EditableHseInspectionResult)
          }
        />
        <FormTextarea
          label="Inspection comments"
          value={comment}
          onChange={(event) => onCommentChange(event.target.value)}
          placeholder="Add inspection comments"
        />
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
  returnReasonMissing,
}: {
  onDecision: (decision: "Approve" | "Return" | "Deny") => void;
  disableApprove: boolean;
  returnReasonMissing: boolean;
}) {
  return (
    <FormSection title="HSE Final Approval">
      {disableApprove ? (
        <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Approval is disabled because one or more inspection checks failed.
        </p>
      ) : null}
      <DecisionSubmitControl
        onDecision={onDecision}
        disableApprove={disableApprove}
        returnReasonMissing={returnReasonMissing}
        returnReasonMessage="Add an HSE inspection comment before returning this request."
      />
    </FormSection>
  );
}

function DecisionSubmitControl({
  onDecision,
  disableApprove = false,
  returnReasonMissing = false,
  returnReasonMessage,
}: {
  onDecision: (decision: "Approve" | "Return" | "Deny") => void;
  disableApprove?: boolean;
  returnReasonMissing?: boolean;
  returnReasonMessage: string;
}) {
  const [decision, setDecision] = useState("");
  const selectedDecision = decision as "Approve" | "Return" | "Deny";
  const shouldRequireReturnReason =
    selectedDecision === "Return" && returnReasonMissing;
  const shouldDisableSubmit =
    !decision || (selectedDecision === "Approve" && disableApprove) || shouldRequireReturnReason;

  return (
    <div className="space-y-3">
      <FormSelect
        label="Decision"
        options={decisionOptions}
        placeholder="Select decision"
        value={decision}
        onValueChange={setDecision}
      />
      {shouldRequireReturnReason ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {returnReasonMessage}
        </p>
      ) : null}
      <Button
        type="button"
        disabled={shouldDisableSubmit}
        variant={selectedDecision === "Deny" ? "danger" : "primary"}
        onClick={() => onDecision(selectedDecision)}
      >
        Submit
      </Button>
    </div>
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
    <FormSection title={title}>
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
    <FormSection title="HSE Inspection Result">
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

function AuditTrailSection({
  items,
}: {
  items: WorkAuthorizationAuditTrailItem[];
}) {
  return (
    <FormSection title="Audit Trail">
      {items.length === 0 ? (
        <p className="text-sm text-brand-text-secondary">
          No audit actions yet.
        </p>
      ) : (
        <div className="divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border">
          {items.map((item, index) => (
            <div
              key={`${item.action}-${index}`}
              className="grid gap-2 bg-white p-4 md:grid-cols-[1fr_1fr_1fr_1.2fr_2fr]"
            >
              <AuditCell label="Action" value={item.action} />
              <AuditCell label="Actor" value={item.actor} />
              <AuditCell label="Role" value={item.role} />
              <AuditCell label="Date/time" value={item.dateTime} />
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
  } else if (request.status === "unauthorized") {
    note = "This work authorization was denied by HSE. Work is unauthorized and a new authorization must be raised.";
  } else if (request.status === "approved") {
    note = "Work Authorized. HSE has approved and work can begin.";
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
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-visible rounded-2xl border border-brand-border bg-white">
      <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-5 py-4 md:px-6">
        <h3 className="text-base font-semibold text-brand-text-primary">
          {title}
        </h3>
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

function AuditCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-brand-text-secondary">
        {label}
      </p>
      <p className="mt-1 text-sm text-brand-text-primary">{value || "-"}</p>
    </div>
  );
}

function roleLabel(role: WorkAuthorizationRole) {
  if (role === "hse") return "HSE Inspector";
  if (role === "supervisor") return "Supervisor";
  return "Requester";
}

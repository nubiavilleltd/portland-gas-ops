"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileText, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import Button from "@/components/ui/Button";
import FileDropzone from "@/components/ui/FileDropzone";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import FormToggleGroup from "@/components/forms/FormToggleGroup";
import { fetchWorkAuthorizationRequest } from "@/lib/mock/work-authorization-api";
import MockUserSwitcher from "./MockUserSwitcher";
import type {
  WorkAuthorizationApprovalResult,
  WorkAuthorizationAttachment,
  WorkAuthorizationAuditTrailItem,
  WorkAuthorizationHseInspection,
  WorkAuthorizationRequest,
  WorkAuthorizationRole,
} from "@/types/safety";

const yesNoOptions = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

const decisionOptions = [
  { value: "Approve", label: "Approve" },
  { value: "Return", label: "Return" },
  { value: "Deny", label: "Deny" },
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

type InspectionCheckValue = "Pass" | "Fail" | "N/A";

const initialHseInspectionChecks = {
  workAreaSafe: "Pass",
  emergencyEquipmentAvailable: "Pass",
  gasPressureCheckCompleted: "Pass",
  ppeAndSafetyKitsAvailable: "Pass",
  toolsSafe: "Pass",
} satisfies Record<string, InspectionCheckValue>;

export default function WorkAuthorizationDetailsView({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState<WorkAuthorizationRole>("requester");
  const [request, setRequest] = useState<WorkAuthorizationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [supervisorComment, setSupervisorComment] = useState("");
  const [hseComment, setHseComment] = useState("");
  const [hseEvidence, setHseEvidence] = useState<File[]>([]);
  const [hseInspectionChecks, setHseInspectionChecks] = useState(initialHseInspectionChecks);

  const hasFailedHseInspectionCheck = Object.values(hseInspectionChecks).some(
    (value) => value === "Fail"
  );

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
    const isPendingApproval = request?.status === "pending_approval";
    const isApproved = request?.status === "approved";

    return {
      canEditDraft: currentRole === "requester" && isDraft,
      canSupervisorApprove: currentRole === "supervisor" && isSubmitted,
      canHseInspect: currentRole === "hse" && isPendingApproval,
      showSupervisorApproval: Boolean(isPendingApproval || isApproved),
      showHseSection: Boolean((currentRole === "hse" && isPendingApproval) || isApproved),
      showAuditTrail: Boolean(!isDraft || isApproved),
    };
  }, [currentRole, request?.status]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-20 animate-pulse rounded-2xl border border-brand-border bg-white" />
        ))}
      </div>
    );
  }

  if (!request) {
    return (
      <div className="rounded-2xl border border-brand-border bg-white p-6">
        <p className="text-sm text-brand-text-secondary">Work authorization request not found.</p>
      </div>
    );
  }

  function addAudit(item: WorkAuthorizationAuditTrailItem) {
    setRequest((current) =>
      current ? { ...current, auditTrail: [...current.auditTrail, item] } : current
    );
  }

  function handleRequesterSubmit() {
    setRequest((current) =>
      current ? { ...current, status: "submitted" } : current
    );
    addAudit({
      action: "Submitted",
      actor: request.requester.name,
      role: "Requester",
      dateTime: "2026-05-18 09:30 AM",
      comment: "Work authorization request submitted.",
    });
  }

  function handleSupervisorDecision(decision: "Approve" | "Return" | "Deny") {
    const result: WorkAuthorizationApprovalResult = {
      decision,
      approver: "Mary James",
      dateTime: "2026-05-18 10:15 AM",
      comment:
        supervisorComment ||
        (decision === "Approve"
          ? "Work scope reviewed and approved for HSE inspection."
          : `Request ${decisionPastTense(decision)} by supervisor.`),
    };

    setRequest((current) =>
      current
        ? {
            ...current,
            status: decision === "Approve" ? "pending_approval" : current.status,
            supervisorApproval: result,
          }
        : current
    );
    addAudit({
      action: decision === "Approve" ? "Supervisor Approved" : `Supervisor ${decision}ed`,
      actor: result.approver,
      role: "Supervisor",
      dateTime: result.dateTime,
      comment: result.comment,
    });
  }

  function handleHseDecision(decision: "Approve" | "Return" | "Deny") {
    if (decision === "Approve" && hasFailedHseInspectionCheck) {
      return;
    }

    const inspection: WorkAuthorizationHseInspection = {
      ...hseInspectionChecks,
      inspectionDateTime: "2026-05-18 11:00 AM",
      comments: hseComment || "Area inspected and cleared for work.",
      result: decision === "Approve" ? "Passed" : decision === "Return" ? "Returned" : "Failed",
      evidence:
        hseEvidence.length > 0
          ? hseEvidence.map((file) => ({ name: file.name, type: "image" as const }))
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

    setRequest((current) =>
      current
        ? {
            ...current,
            status: decision === "Approve" ? "approved" : current.status,
            hseInspection: inspection,
            hseApproval: approval,
          }
        : current
    );
    addAudit({
      action: "HSE Inspection Completed",
      actor: approval.approver,
      role: "HSE Inspector",
      dateTime: inspection.inspectionDateTime,
      comment: inspection.comments,
    });
    addAudit({
      action: decision === "Approve" ? "HSE Approved" : `HSE ${decision}ed`,
      actor: approval.approver,
      role: "HSE Inspector",
      dateTime: approval.dateTime,
      comment: approval.comment,
    });
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

      <MockUserSwitcher value={currentRole} onChange={setCurrentRole} />

      <section className="rounded-2xl border border-brand-border bg-white p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-text-secondary">
              Work Authorization Details
            </p>
            <h2 className="mt-1 text-xl font-semibold text-brand-text-primary">{request.id}</h2>
            <p className="mt-1 text-sm text-brand-text-secondary">
              Viewing as {roleLabel(currentRole)}
            </p>
          </div>
          <ApprovalBadge status={request.status} />
        </div>
      </section>

      <StatusNote request={request} currentRole={currentRole} />

      <RequesterDetailsSection request={request} />
      <RequestDetailsSection request={request} editable={permissions.canEditDraft} />
      <WorkDetailsSection request={request} editable={permissions.canEditDraft} />
      <RiskIndicatorsSection request={request} editable={permissions.canEditDraft} />
      <AttachmentsSection request={request} editable={permissions.canEditDraft} />

      {currentRole === "requester" && request.status === "draft" ? (
        <div className="flex justify-end">
          <Button onClick={handleRequesterSubmit}>Submit Request</Button>
        </div>
      ) : null}

      {permissions.canSupervisorApprove ? (
        <SupervisorActionSection
          comment={supervisorComment}
          onCommentChange={setSupervisorComment}
          onDecision={handleSupervisorDecision}
        />
      ) : permissions.showSupervisorApproval && request.supervisorApproval ? (
        <ApprovalResultSection title="Supervisor Approval Result" result={request.supervisorApproval} />
      ) : null}

      {permissions.showHseSection ? (
        permissions.canHseInspect ? (
          <>
            <HseInspectionActionSection
              comment={hseComment}
              onCommentChange={setHseComment}
              checks={hseInspectionChecks}
              onCheckChange={(key, value) =>
                setHseInspectionChecks((current) => ({ ...current, [key]: value }))
              }
              evidence={hseEvidence}
              onEvidenceChange={setHseEvidence}
            />
            <HseFinalActionSection
              onDecision={handleHseDecision}
              disableApprove={hasFailedHseInspectionCheck}
            />
          </>
        ) : (
          <>
            {request.hseInspection ? <HseInspectionResultSection inspection={request.hseInspection} /> : null}
            {request.hseApproval ? <ApprovalResultSection title="HSE Final Approval Result" result={request.hseApproval} /> : null}
          </>
        )
      ) : null}

      {permissions.showAuditTrail ? <AuditTrailSection items={request.auditTrail} /> : null}
    </div>
  );
}

function RequesterDetailsSection({ request }: { request: WorkAuthorizationRequest }) {
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

function RequestDetailsSection({
  request,
  editable,
}: {
  request: WorkAuthorizationRequest;
  editable: boolean;
}) {
  return (
    <FormSection title="Request Details">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Request Title" defaultValue={request.requestDetails.title} disabled={!editable} />
        <FormInput label="Work Location" defaultValue={request.requestDetails.location} disabled={!editable} />
        <FormInput label="Exact Work Area" defaultValue={request.requestDetails.exactWorkArea} disabled={!editable} />
        <FormInput label="Expected Start Date/Time" defaultValue={request.requestDetails.expectedStartDateTime} disabled={!editable} />
        <FormInput label="Expected End Date/Time" defaultValue={request.requestDetails.expectedEndDateTime} disabled={!editable} />
        <FormInput label="Supervisor" defaultValue={request.requestDetails.supervisor} disabled={!editable} />
        <FormInput label="Priority" defaultValue={request.requestDetails.priority} disabled={!editable} />
      </div>
    </FormSection>
  );
}

function WorkDetailsSection({
  request,
  editable,
}: {
  request: WorkAuthorizationRequest;
  editable: boolean;
}) {
  return (
    <FormSection title="Work Details">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Type of Work" defaultValue={request.workDetails.typeOfWork.join(", ")} disabled={!editable} />
        <FormTextarea label="Work Description" defaultValue={request.workDetails.description} disabled={!editable} />
        <FormTextarea label="Reason for Work" defaultValue={request.workDetails.reason} disabled={!editable} />
        <FormInput label="Workers Involved" defaultValue={request.workDetails.workersInvolved.join(", ")} disabled={!editable} />
        <FormToggleGroup
          label="Contractor Required?"
          value={request.workDetails.contractorRequired ? "Yes" : "No"}
          options={yesNoOptions}
          disabled={!editable}
        />
        {request.workDetails.contractorRequired ? (
          <>
            <FormInput label="Contractor Name" defaultValue={request.workDetails.contractorName} disabled={!editable} />
            <FormInput label="Contractor Contact Email" type="email" defaultValue={request.workDetails.contractorContactEmail} disabled={!editable} />
          </>
        ) : null}
        {/* <FormInput label="Tools/Equipment Required" defaultValue={request.workDetails.toolsEquipment.join(", ")} disabled={!editable} /> */}
        <FormTextarea label="Special Instructions" defaultValue={request.workDetails.specialInstructions} disabled={!editable} />
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
  return (
    <FormSection title="Risk & Safety Indicators">
      <div className="grid gap-4 md:grid-cols-2">
        <ReadOnlyYesNo label="Is gas/CNG/LNG involved?" value={request.riskIndicators.gasInvolved} editable={editable} />
        <ReadOnlyYesNo label="Is a pressurized system involved?" value={request.riskIndicators.pressurizedSystem} editable={editable} />
        <ReadOnlyYesNo label="Will the work involve heat, sparks, welding, cutting, or grinding?" value={request.riskIndicators.heatOrSparks} editable={editable} />
        <ReadOnlyYesNo label="Is electrical isolation required?" value={request.riskIndicators.electricalIsolation} editable={editable} />
        <ReadOnlyYesNo label="Is lifting/heavy equipment involved?" value={request.riskIndicators.liftingEquipment} editable={editable} />
        <FormTextarea label="Additional Safety Note" defaultValue={request.riskIndicators.additionalSafetyNote} disabled={!editable} />
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
    <FormToggleGroup
      label={label}
      value={value ? "Yes" : "No"}
      options={yesNoOptions}
      disabled={!editable}
    />
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

function AttachmentList({ attachments }: { attachments: WorkAuthorizationAttachment[] }) {
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

function SupervisorActionSection({
  comment,
  onCommentChange,
  onDecision,
}: {
  comment: string;
  onCommentChange: (comment: string) => void;
  onDecision: (decision: "Approve" | "Return" | "Deny") => void;
}) {
  return (
    <FormSection title="Supervisor Approval">
      <div className="space-y-4">
        <FormTextarea
          label="Supervisor Comment"
          value={comment}
          onChange={(event) => onCommentChange(event.target.value)}
          placeholder="Add review notes"
        />
        <DecisionButtons onDecision={onDecision} />
      </div>
    </FormSection>
  );
}

function HseInspectionActionSection({
  comment,
  onCommentChange,
  checks,
  onCheckChange,
  evidence,
  onEvidenceChange,
}: {
  comment: string;
  onCommentChange: (comment: string) => void;
  checks: typeof initialHseInspectionChecks;
  onCheckChange: (key: keyof typeof initialHseInspectionChecks, value: InspectionCheckValue) => void;
  evidence: File[];
  onEvidenceChange: (files: File[]) => void;
}) {
  return (
    <FormSection title="HSE Inspection Acknowledgement">
      <div className="grid gap-4 md:grid-cols-2">
        <FormSelect
          label="Work area is safe, clean, and accessible"
          options={inspectionCheckOptions}
          value={checks.workAreaSafe}
          onValueChange={(value) => onCheckChange("workAreaSafe", value as InspectionCheckValue)}
        />
        <FormSelect
          label="Fire extinguisher/emergency equipment is available"
          options={inspectionCheckOptions}
          value={checks.emergencyEquipmentAvailable}
          onValueChange={(value) =>
            onCheckChange("emergencyEquipmentAvailable", value as InspectionCheckValue)
          }
        />
        <FormSelect
          label="Gas leak/pressure/abnormal condition check completed"
          options={inspectionCheckOptions}
          value={checks.gasPressureCheckCompleted}
          onValueChange={(value) =>
            onCheckChange("gasPressureCheckCompleted", value as InspectionCheckValue)
          }
        />
        <FormSelect
          label="Required PPE and safety kits are available"
          options={inspectionCheckOptions}
          value={checks.ppeAndSafetyKitsAvailable}
          onValueChange={(value) =>
            onCheckChange("ppeAndSafetyKitsAvailable", value as InspectionCheckValue)
          }
        />
        <FormSelect
          label="Tools/equipment are safe and suitable for the job"
          options={inspectionCheckOptions}
          value={checks.toolsSafe}
          onValueChange={(value) => onCheckChange("toolsSafe", value as InspectionCheckValue)}
        />
        <FormInput label="Inspection date/time" defaultValue="2026-05-18 11:00 AM" />
        <FormSelect label="Inspection result" options={inspectionResultOptions} defaultValue="Passed" />
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
}: {
  onDecision: (decision: "Approve" | "Return" | "Deny") => void;
  disableApprove: boolean;
}) {
  return (
    <FormSection title="HSE Final Approval">
      {disableApprove ? (
        <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Approval is disabled because one or more inspection checks failed.
        </p>
      ) : null}
      <DecisionButtons onDecision={onDecision} disableApprove={disableApprove} />
    </FormSection>
  );
}

function DecisionButtons({
  onDecision,
  disableApprove = false,
}: {
  onDecision: (decision: "Approve" | "Return" | "Deny") => void;
  disableApprove?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {decisionOptions.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={option.value === "Approve" ? "primary" : option.value === "Deny" ? "danger" : "outline"}
          disabled={option.value === "Approve" && disableApprove}
          onClick={() => onDecision(option.value as "Approve" | "Return" | "Deny")}
        >
          {option.label}
        </Button>
      ))}
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

function HseInspectionResultSection({ inspection }: { inspection: WorkAuthorizationHseInspection }) {
  return (
    <FormSection title="HSE Inspection Result">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Work area is safe, clean, and accessible" value={inspection.workAreaSafe} disabled />
        <FormInput label="Fire extinguisher/emergency equipment is available" value={inspection.emergencyEquipmentAvailable} disabled />
        <FormInput label="Gas leak/pressure/abnormal condition check completed" value={inspection.gasPressureCheckCompleted} disabled />
        <FormInput label="Required PPE and safety kits are available" value={inspection.ppeAndSafetyKitsAvailable} disabled />
        <FormInput label="Tools/equipment are safe and suitable for the job" value={inspection.toolsSafe} disabled />
        <FormInput label="Inspection date/time" value={inspection.inspectionDateTime} disabled />
        <FormInput label="Inspection result" value={inspection.result} disabled />
        <FormTextarea label="Inspection comments" value={inspection.comments} disabled />
      </div>
      <div className="mt-4">
        <AttachmentList attachments={inspection.evidence} />
      </div>
    </FormSection>
  );
}

function AuditTrailSection({ items }: { items: WorkAuthorizationAuditTrailItem[] }) {
  return (
    <FormSection title="Audit Trail">
      {items.length === 0 ? (
        <p className="text-sm text-brand-text-secondary">No audit actions yet.</p>
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
  } else if (request.status === "submitted") {
    note =
      currentRole === "supervisor"
        ? "This request is waiting for your supervisor review."
        : "Waiting for supervisor approval.";
  } else if (request.status === "pending_approval") {
    note =
      currentRole === "hse"
        ? "Supervisor has approved. HSE inspection and final approval are available."
        : "Supervisor approval completed. Waiting for HSE inspection and approval.";
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

function roleLabel(role: WorkAuthorizationRole) {
  if (role === "hse") return "HSE Inspector";
  if (role === "supervisor") return "Supervisor";
  return "Requester";
}

"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ImageIcon,
  Lock,
  Paperclip,
  RotateCcw,
  Send,
  ShieldCheck,
} from "lucide-react";
import Button from "@/components/ui/Button";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import StatusStepper from "@/components/ui/StatusStepper";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import FormSelect from "@/components/forms/FormSelect";
import FormMultiSelect from "@/components/forms/FormMultiSelect";
import FormDateTimeInput from "@/components/forms/FormDateTimeInput";
import { cn } from "@/lib/utils";
import type { SelectOption } from "@/components/forms/SelectInput";

type WorkAuthorizationStatus =
  | "draft"
  | "submitted"
  | "pending_approval"
  | "approved"
  | "returned"
  | "rejected"
  | "cancelled";

type RiskKey =
  | "gasInvolved"
  | "pressurizedSystem"
  | "heatOrSparks"
  | "electricalIsolation"
  | "liftingEquipment";

type InspectionCheckKey =
  | "workAreaSafeCleanAccessible"
  | "emergencyEquipmentAvailable"
  | "gasPressureCheckCompleted"
  | "ppeAndSafetyKitsAvailable"
  | "toolsEquipmentSafeSuitable";

type AuditEntry = {
  action: string;
  actor: string;
  role: string;
  dateTime: string;
  comment: string;
};

const statusSteps = [
  { key: "draft", label: "Draft" },
  { key: "submitted", label: "Submitted" },
  { key: "pending_approval", label: "Pending Approval" },
  { key: "approved", label: "Approved" },
];

const employees = [
  { id: "EMP-001", name: "Daniel Okoro", department: "Engineering", role: "CNG Conversion Technician" },
  { id: "EMP-002", name: "Mary James", department: "Engineering", role: "Engineering Supervisor" },
  { id: "EMP-003", name: "Samuel Bassey", department: "HSE", role: "HSE Officer" },
  { id: "EMP-004", name: "Grace Bello", department: "Operations", role: "Operations Officer" },
  { id: "EMP-005", name: "Ibrahim Musa", department: "Engineering", role: "Technician" },
];

const optionFromStrings = (items: string[]): SelectOption[] =>
  items.map((item) => ({ value: item, label: item }));

const employeeOptions = employees.map((employee) => ({
  value: employee.name,
  label: `${employee.name} - ${employee.role}`,
}));

const priorityOptions = optionFromStrings(["Low", "Medium", "High", "Critical"]);
const yesNoOptions = optionFromStrings(["Yes", "No"]);
const decisionOptions = optionFromStrings(["Approve", "Return", "Reject"]);
const inspectionCheckOptions = optionFromStrings(["Pass", "Fail", "N/A"]);
const inspectionResultOptions = optionFromStrings(["Passed", "Returned", "Failed"]);

const workLocationOptions = optionFromStrings([
  "Conversion Bay 1",
  "Conversion Bay 2",
  "Vehicle Yard",
  "Gas Storage Area",
  "Maintenance Workshop",
  "Electrical Room",
  "Loading Area",
  "Inspection Bay",
]);

const workTypeOptions = optionFromStrings([
  "CNG Conversion",
  "CNG Cylinder Work",
  "Gas System Work",
  "Electrical Work",
  "Hot Work",
  "Lifting Work",
  "Vehicle Inspection",
  "Transport Preparation",
  "Maintenance",
  "Calibration",
  "General Engineering Work",
]);

const toolsEquipmentOptions = optionFromStrings([
  "Hand Tools",
  "Diagnostic Tool",
  "Welding Machine",
  "Grinding Machine",
  "Cylinder Lifting Equipment",
  "Gas Detector",
  "Pressure Gauge",
  "Electrical Tester",
  "Torque Wrench",
  "PPE Kit",
]);

const contractorOptions = optionFromStrings([
  "ABC Engineering Services",
  "SafeGas Technical Ltd",
  "Prime Mechanical Contractors",
]);

const riskFields: { key: RiskKey; label: string }[] = [
  { key: "gasInvolved", label: "Is gas/CNG/LNG involved?" },
  { key: "pressurizedSystem", label: "Is a pressurized system involved?" },
  { key: "heatOrSparks", label: "Will the work involve heat, sparks, welding, cutting, or grinding?" },
  { key: "electricalIsolation", label: "Is electrical isolation required?" },
  { key: "liftingEquipment", label: "Is lifting/heavy equipment involved?" },
];

const inspectionChecks: { key: InspectionCheckKey; label: string }[] = [
  { key: "workAreaSafeCleanAccessible", label: "Work area is safe, clean, and accessible" },
  { key: "emergencyEquipmentAvailable", label: "Fire extinguisher/emergency equipment is available" },
  { key: "gasPressureCheckCompleted", label: "Gas leak/pressure/abnormal condition check completed" },
  { key: "ppeAndSafetyKitsAvailable", label: "Required PPE and safety kits are available" },
  { key: "toolsEquipmentSafeSuitable", label: "Tools/equipment are safe and suitable for the job" },
];

const initialAuditTrail: AuditEntry[] = [];

const initialRequestDetails = {
  title: "",
  workLocation: "",
  exactWorkArea: "",
  expectedStartDateTime: "",
  expectedEndDateTime: "",
  supervisor: "",
  priority: "",
};

const initialWorkDetails = {
  typeOfWork: [] as string[],
  description: "",
  reasonForWork: "",
  workersInvolved: [] as string[],
  contractorRequired: "",
  contractorName: "",
  contractorContactPerson: "",
  toolsEquipmentRequired: [] as string[],
  specialInstructions: "",
};

const initialRiskIndicators: Record<RiskKey, string> & { additionalSafetyNote: string } = {
  gasInvolved: "",
  pressurizedSystem: "",
  heatOrSparks: "",
  electricalIsolation: "",
  liftingEquipment: "",
  additionalSafetyNote: "",
};

const initialHseInspection: Record<InspectionCheckKey, string> & {
  inspectionDateTime: string;
  comments: string;
  result: string;
} = {
  workAreaSafeCleanAccessible: "",
  emergencyEquipmentAvailable: "",
  gasPressureCheckCompleted: "",
  ppeAndSafetyKitsAvailable: "",
  toolsEquipmentSafeSuitable: "",
  inspectionDateTime: "",
  comments: "",
  result: "",
};

const initialSupervisorApproval = {
  decision: "",
  comment: "",
  dateTime: "",
};

const initialHseApproval = {
  approver: "",
  decision: "",
  comment: "",
  dateTime: "",
};

export default function WorkAuthorizationForm() {
  const [status, setStatus] = useState<WorkAuthorizationStatus>("draft");
  const [requestReference, setRequestReference] = useState("");
  const [requestDetails, setRequestDetails] = useState(initialRequestDetails);
  const [workDetails, setWorkDetails] = useState(initialWorkDetails);
  const [riskIndicators, setRiskIndicators] = useState(initialRiskIndicators);
  const [attachmentNotes, setAttachmentNotes] = useState("");
  const [supervisorApproval, setSupervisorApproval] = useState(initialSupervisorApproval);
  const [hseInspection, setHseInspection] = useState(initialHseInspection);
  const [hseApproval, setHseApproval] = useState(initialHseApproval);
  const [auditTrail, setAuditTrail] = useState(initialAuditTrail);

  const isDraft = status === "draft";
  const isApproved = status === "approved";
  const requesterEditable = !isApproved;
  const supervisorEditable = status === "submitted";
  const hseEditable = status === "pending_approval";
  const currentStepperStatus = statusSteps.some((step) => step.key === status)
    ? status
    : "submitted";

  const requester = useMemo(
    () => ({
      name: "Daniel Okoro",
      department: "Engineering",
      role: "CNG Conversion Technician",
      requestDate: "2026-05-18 09:30 AM",
    }),
    []
  );

  function addAudit(action: string, actor: string, role: string, comment: string) {
    setAuditTrail((current) => [
      ...current,
      {
        action,
        actor,
        role,
        dateTime: new Date().toLocaleString("en-NG", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        comment,
      },
    ]);
  }

  function submitRequest() {
    setStatus("submitted");
    setRequestReference("WA-2026-0001");
    addAudit("Submitted", requester.name, "Requester", "Work authorization request submitted.");
  }

  function applySupervisorDecision() {
    const decision = supervisorApproval.decision;
    if (!decision) return;

    setSupervisorApproval((current) => ({
      ...current,
      dateTime: "2026-05-18 10:15 AM",
    }));

    if (decision === "Approve") {
      setStatus("pending_approval");
      addAudit("Supervisor Approved", "Mary James", "Supervisor", supervisorApproval.comment || "Work scope reviewed and approved.");
      return;
    }

    const nextStatus = decision === "Return" ? "returned" : "rejected";
    setStatus(nextStatus);
    addAudit(`Supervisor ${decision}ed`, "Mary James", "Supervisor", supervisorApproval.comment || `Request ${decision.toLowerCase()}ed by supervisor.`);
  }

  function applyHseDecision() {
    const decision = hseApproval.decision;
    if (!decision) return;

    setHseApproval((current) => ({
      ...current,
      dateTime: "2026-05-18 11:05 AM",
    }));

    addAudit(
      "HSE Inspection Completed",
      hseApproval.approver,
      "HSE Officer",
      hseInspection.comments || "Inspection acknowledgement completed."
    );

    if (decision === "Approve") {
      setStatus("approved");
      addAudit("HSE Approved", hseApproval.approver, "HSE Officer", hseApproval.comment || "Work authorization approved.");
      return;
    }

    const nextStatus = decision === "Return" ? "returned" : "rejected";
    setStatus(nextStatus);
    addAudit(`HSE ${decision}ed`, hseApproval.approver, "HSE Officer", hseApproval.comment || `Request ${decision.toLowerCase()}ed by HSE.`);
  }

  function resetMockFlow() {
    setStatus("draft");
    setRequestReference("");
    setRequestDetails(initialRequestDetails);
    setWorkDetails(initialWorkDetails);
    setRiskIndicators(initialRiskIndicators);
    setAttachmentNotes("");
    setSupervisorApproval(initialSupervisorApproval);
    setHseInspection(initialHseInspection);
    setHseApproval(initialHseApproval);
    setAuditTrail(initialAuditTrail);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <section className="rounded-2xl border border-brand-border bg-white p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <ApprovalBadge status={status} />
              {requestReference ? (
                <span className="rounded-full border border-brand-border px-2.5 py-0.5 text-xs font-medium text-brand-text-secondary">
                  {requestReference}
                </span>
              ) : null}
            </div>
            <h1 className="text-2xl font-semibold text-brand-text-primary">
              Work Authorization Request
            </h1>
            <p className="mt-2 text-sm leading-6 text-brand-text-secondary">
              Work inside the facility must be reviewed by the assigned supervisor and cleared by HSE before it starts.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              leftIcon={<RotateCcw size={16} />}
              onClick={resetMockFlow}
              content="Reset mock flow"
            />
            <Button
              leftIcon={<Send size={16} />}
              onClick={submitRequest}
              disabled={!isDraft}
              content="Submit request"
            />
          </div>
        </div>

        <StatusStepper steps={statusSteps} currentStep={currentStepperStatus} className="mt-6" />
      </section>

      <FormSection title="Requester Details" description="Auto-filled from the mock logged-in employee profile.">
        <ReadOnlyGrid
          items={[
            ["Requester name", requester.name],
            ["Department", requester.department],
            ["Job title / role", requester.role],
            ["Request date", requester.requestDate],
          ]}
        />
      </FormSection>

      <FormSection title="Request Details" description="Where and when the work is expected to happen.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput
            label="Request title"
            required
            value={requestDetails.title}
            disabled={!requesterEditable}
            onChange={(event) => setRequestDetails({ ...requestDetails, title: event.target.value })}
          />
          <FormSelect
            label="Work location"
            required
            searchable
            creatable
            options={workLocationOptions}
            value={requestDetails.workLocation}
            disabled={!requesterEditable}
            onValueChange={(value) => setRequestDetails({ ...requestDetails, workLocation: value })}
          />
          <FormInput
            label="Exact work area"
            required
            value={requestDetails.exactWorkArea}
            disabled={!requesterEditable}
            onChange={(event) => setRequestDetails({ ...requestDetails, exactWorkArea: event.target.value })}
          />
          <FormSelect
            label="Supervisor"
            required
            searchable
            options={employeeOptions}
            value={requestDetails.supervisor}
            disabled={!requesterEditable}
            onValueChange={(value) => setRequestDetails({ ...requestDetails, supervisor: value })}
          />
          <FormDateTimeInput
            label="Expected start date/time"
            required
            value={requestDetails.expectedStartDateTime}
            disabled={!requesterEditable}
            onChange={(event) => setRequestDetails({ ...requestDetails, expectedStartDateTime: event.target.value })}
          />
          <FormDateTimeInput
            label="Expected end date/time"
            required
            value={requestDetails.expectedEndDateTime}
            disabled={!requesterEditable}
            onChange={(event) => setRequestDetails({ ...requestDetails, expectedEndDateTime: event.target.value })}
          />
          <FormSelect
            label="Priority"
            required
            options={priorityOptions}
            value={requestDetails.priority}
            disabled={!requesterEditable}
            onValueChange={(value) => setRequestDetails({ ...requestDetails, priority: value })}
          />
        </div>
      </FormSection>

      <FormSection title="Work Details" description="The actual job scope, people involved, tools, and instructions.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormMultiSelect
            label="Type of work"
            required
            searchable
            creatable
            options={workTypeOptions}
            value={workDetails.typeOfWork}
            disabled={!requesterEditable}
            onValueChange={(value) => setWorkDetails({ ...workDetails, typeOfWork: value })}
          />
          <FormMultiSelect
            label="Workers involved"
            required
            searchable
            options={employeeOptions}
            value={workDetails.workersInvolved}
            disabled={!requesterEditable}
            onValueChange={(value) => setWorkDetails({ ...workDetails, workersInvolved: value })}
          />
          <FormTextarea
            label="Work description"
            required
            value={workDetails.description}
            disabled={!requesterEditable}
            onChange={(event) => setWorkDetails({ ...workDetails, description: event.target.value })}
            className="md:min-h-28"
          />
          <FormTextarea
            label="Reason for work"
            required
            value={workDetails.reasonForWork}
            disabled={!requesterEditable}
            onChange={(event) => setWorkDetails({ ...workDetails, reasonForWork: event.target.value })}
            className="md:min-h-28"
          />
          <FormSelect
            label="Contractor required?"
            required
            options={yesNoOptions}
            value={workDetails.contractorRequired}
            disabled={!requesterEditable}
            onValueChange={(value) => setWorkDetails({ ...workDetails, contractorRequired: value })}
          />
          {workDetails.contractorRequired === "Yes" ? (
            <>
              <FormSelect
                label="Contractor name"
                required
                searchable
                creatable
                options={contractorOptions}
                value={workDetails.contractorName}
                disabled={!requesterEditable}
                onValueChange={(value) => setWorkDetails({ ...workDetails, contractorName: value })}
              />
              <FormInput
                label="Contractor contact person"
                value={workDetails.contractorContactPerson}
                disabled={!requesterEditable}
                onChange={(event) => setWorkDetails({ ...workDetails, contractorContactPerson: event.target.value })}
              />
            </>
          ) : null}
          <FormMultiSelect
            label="Tools/equipment required"
            required
            searchable
            creatable
            options={toolsEquipmentOptions}
            value={workDetails.toolsEquipmentRequired}
            disabled={!requesterEditable}
            onValueChange={(value) => setWorkDetails({ ...workDetails, toolsEquipmentRequired: value })}
          />
          <FormTextarea
            label="Special instructions"
            value={workDetails.specialInstructions}
            disabled={!requesterEditable}
            onChange={(event) => setWorkDetails({ ...workDetails, specialInstructions: event.target.value })}
          />
        </div>
      </FormSection>

      <FormSection title="Risk & Safety Indicators" description="Requester flags obvious safety concerns before HSE inspection.">
        <div className="grid gap-4 md:grid-cols-2">
          {riskFields.map((field) => (
            <FormSelect
              key={field.key}
              label={field.label}
              required
              options={yesNoOptions}
              value={riskIndicators[field.key]}
              disabled={!requesterEditable}
              onValueChange={(value) =>
                setRiskIndicators({ ...riskIndicators, [field.key]: value })
              }
            />
          ))}
          <FormTextarea
            label="Additional safety note"
            value={riskIndicators.additionalSafetyNote}
            disabled={!requesterEditable}
            onChange={(event) =>
              setRiskIndicators({ ...riskIndicators, additionalSafetyNote: event.target.value })
            }
            className="md:col-span-2"
          />
        </div>
      </FormSection>

      <FormSection title="Attachments / Images" description="Mock uploaded images and supporting documents.">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-xl border border-dashed border-brand-border bg-gray-50 p-4 text-sm text-brand-text-secondary">
            No attachments added yet.
          </div>
          <FormTextarea
            label="Attachment notes"
            value={attachmentNotes}
            disabled={!requesterEditable}
            onChange={(event) => setAttachmentNotes(event.target.value)}
          />
        </div>
      </FormSection>

      <FormSection
        title="Supervisor Approval"
        description="Editable for the supervisor only after requester submission."
        locked={!supervisorEditable}
        lockedText={status === "draft" ? "Supervisor review will be available after the requester submits." : undefined}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <ReadOnlyField label="Supervisor name" value={requestDetails.supervisor} />
          <FormSelect
            label="Supervisor decision"
            required
            options={decisionOptions}
            value={supervisorApproval.decision}
            disabled={!supervisorEditable}
            onValueChange={(value) => setSupervisorApproval({ ...supervisorApproval, decision: value })}
          />
          <FormTextarea
            label="Supervisor comment"
            required={["Return", "Reject"].includes(supervisorApproval.decision)}
            value={supervisorApproval.comment}
            disabled={!supervisorEditable}
            onChange={(event) => setSupervisorApproval({ ...supervisorApproval, comment: event.target.value })}
            className="md:col-span-2"
          />
          <ReadOnlyField label="Supervisor approval date/time" value={supervisorApproval.dateTime || "Auto-filled after decision"} />
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            leftIcon={<CheckCircle2 size={16} />}
            disabled={!supervisorEditable || !supervisorApproval.decision}
            onClick={applySupervisorDecision}
            content="Apply supervisor decision"
          />
        </div>
      </FormSection>

      <FormSection
        title="HSE Inspection Acknowledgement"
        description="HSE confirms physical inspection of the work environment."
        locked={!hseEditable}
        lockedText={
          ["draft", "submitted"].includes(status)
            ? "HSE inspection will be available after supervisor approval."
            : undefined
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          {inspectionChecks.map((check) => (
            <FormSelect
              key={check.key}
              label={check.label}
              required
              options={inspectionCheckOptions}
              value={hseInspection[check.key]}
              disabled={!hseEditable}
              onValueChange={(value) =>
                setHseInspection({ ...hseInspection, [check.key]: value })
              }
            />
          ))}
          <FormDateTimeInput
            label="Inspection date/time"
            required
            value={hseInspection.inspectionDateTime}
            disabled={!hseEditable}
            onChange={(event) => setHseInspection({ ...hseInspection, inspectionDateTime: event.target.value })}
          />
          <FormSelect
            label="Inspection result"
            required
            options={inspectionResultOptions}
            value={hseInspection.result}
            disabled={!hseEditable}
            onValueChange={(value) => setHseInspection({ ...hseInspection, result: value })}
          />
          <FormTextarea
            label="Inspection comments"
            required={Object.values(hseInspection).includes("Fail")}
            value={hseInspection.comments}
            disabled={!hseEditable}
            onChange={(event) => setHseInspection({ ...hseInspection, comments: event.target.value })}
            className="md:col-span-2"
          />
          <AttachmentCard name="hse-inspection-photo.jpg" type="Mock evidence" icon={<ImageIcon size={18} />} />
        </div>
      </FormSection>

      <FormSection
        title="HSE Final Approval"
        description="Final HSE decision after inspection acknowledgement."
        locked={!hseEditable}
        lockedText={
          ["draft", "submitted"].includes(status)
            ? "HSE final approval will be available after supervisor approval."
            : undefined
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormSelect
            label="HSE approver"
            required
            searchable
            options={employeeOptions}
            value={hseApproval.approver}
            disabled={!hseEditable}
            onValueChange={(value) => setHseApproval({ ...hseApproval, approver: value })}
          />
          <FormSelect
            label="HSE decision"
            required
            options={decisionOptions}
            value={hseApproval.decision}
            disabled={!hseEditable}
            onValueChange={(value) => setHseApproval({ ...hseApproval, decision: value })}
          />
          <FormTextarea
            label="HSE comment"
            required={["Return", "Reject"].includes(hseApproval.decision)}
            value={hseApproval.comment}
            disabled={!hseEditable}
            onChange={(event) => setHseApproval({ ...hseApproval, comment: event.target.value })}
            className="md:col-span-2"
          />
          <ReadOnlyField label="HSE approval date/time" value={hseApproval.dateTime || "Auto-filled after decision"} />
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            leftIcon={<ShieldCheck size={16} />}
            disabled={!hseEditable || !hseApproval.decision}
            onClick={applyHseDecision}
            content="Apply HSE decision"
          />
        </div>
      </FormSection>

      <FormSection title="Audit Trail" description="Read-only mock record of actions taken on the request.">
        <div className="divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border">
          {auditTrail.map((entry, index) => (
            <div key={`${entry.action}-${index}`} className="grid gap-2 bg-white p-4 md:grid-cols-[1.2fr_1fr_1fr_1.3fr_2fr]">
              <AuditCell label="Action" value={entry.action} />
              <AuditCell label="Actor" value={entry.actor} />
              <AuditCell label="Role" value={entry.role} />
              <AuditCell label="Date/time" value={entry.dateTime} />
              <AuditCell label="Comment" value={entry.comment} />
            </div>
          ))}
        </div>
      </FormSection>
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
  locked = false,
  lockedText,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  locked?: boolean;
  lockedText?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-brand-border bg-white p-5 md:p-6", locked && "bg-gray-50/70")}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-brand-text-primary">{title}</h2>
          {description ? <p className="mt-1 text-sm text-brand-text-secondary">{description}</p> : null}
        </div>
        {locked ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1 text-xs font-medium text-brand-text-secondary">
            <Lock size={13} />
            Locked
          </div>
        ) : null}
      </div>
      {locked && lockedText ? (
        <div className="mb-4 rounded-xl border border-dashed border-brand-border bg-white px-4 py-3 text-sm text-brand-text-secondary">
          {lockedText}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function ReadOnlyGrid({ items }: { items: [string, string][] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map(([label, value]) => (
        <ReadOnlyField key={label} label={label} value={value} />
      ))}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-brand-border bg-gray-50 px-3 py-2">
      <p className="text-xs font-medium text-brand-text-secondary">{label}</p>
      <p className="mt-1 min-h-5 text-sm font-medium text-brand-text-primary">{value}</p>
    </div>
  );
}

function AttachmentCard({
  name,
  type,
  icon,
}: {
  name: string;
  type: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex min-h-20 items-center gap-3 rounded-xl border border-brand-border bg-gray-50 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-brand-purple">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-brand-text-primary">{name}</p>
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-brand-text-secondary">
          <Paperclip size={12} />
          {type}
        </p>
      </div>
    </div>
  );
}

function AuditCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-brand-text-secondary">{label}</p>
      <p className="mt-1 text-sm text-brand-text-primary">{value}</p>
    </div>
  );
}

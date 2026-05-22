"use client";

import { useState } from "react";
import { ArrowLeft, FileText, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import Button from "@/components/ui/Button";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormInput from "@/components/forms/FormInput";
import FormMultiSelect from "@/components/forms/FormMultiSelect";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import FormToggleGroup from "@/components/forms/FormToggleGroup";
import {
  cloneWorkInitiationRequest,
  getMockWorkInitiationRequest,
} from "@/lib/mock/work-initiation";
import type {
  WorkAuthorizationAuditTrailItem,
  WorkAuthorizationAttachment,
  WorkAuthorizationDecision,
  WorkInitiationRequest,
  WorkInitiationRole,
} from "@/types/safety";
import WorkInitiationRoleSwitcher from "./WorkInitiationRoleSwitcher";

const toOptions = (items: string[]) => items.map((item) => ({ value: item, label: item }));
const decisionOptions = toOptions(["Approve", "Return", "Deny"]);
const employeeOptions = toOptions(["Mary James", "Daniel Okoro", "Ibrahim Musa", "Grace Bello"]);
const locationOptions = toOptions([
  "Conversion Bay 1",
  "Conversion Bay 2",
  "Vehicle Yard",
  "Gas Storage Area",
  "Maintenance Workshop",
  "Electrical Room",
  "Loading Area",
  "Inspection Bay",
]);
const contractorOptions = toOptions([
  "SafeWeld Engineering Ltd",
  "Prime Gas Services",
  "Vehicle Conversion Partners",
  "Electrical Support Contractors",
]);
const yesNoOptions = toOptions(["Yes", "No"]);

export default function WorkInitiationDetailsView({ requestId }: { requestId: string }) {
  const router = useRouter();
  const initialRequest = getMockWorkInitiationRequest(requestId);
  const [currentRole, setCurrentRole] = useState<WorkInitiationRole>("requester");
  const [request, setRequest] = useState<WorkInitiationRequest | null>(
    initialRequest ? cloneWorkInitiationRequest(initialRequest) : null,
  );
  const [reviewComment, setReviewComment] = useState("");
  const [assignmentComment, setAssignmentComment] = useState("");
  const [assignedWorkers, setAssignedWorkers] = useState<string[]>(
    initialRequest?.assignment.assignedWorkers ?? [],
  );
  const [selectedContractors, setSelectedContractors] = useState<string[]>(
    initialRequest?.assignment.selectedContractors ?? [],
  );

  if (!request) {
    return (
      <div className="rounded-2xl border border-brand-border bg-white p-6">
        <p className="text-sm text-brand-text-secondary">Work initiation request not found.</p>
      </div>
    );
  }

  const canRequesterEdit =
    currentRole === "requester" && (request.status === "draft" || request.status === "returned");
  const canReview = currentRole === "operations_reviewer" && request.status === "submitted";
  const canAssign = currentRole === "supervisor" && request.status === "approved";

  function addAudit(item: WorkAuthorizationAuditTrailItem) {
    setRequest((current) =>
      current ? { ...current, auditTrail: [...current.auditTrail, item] } : current,
    );
  }

  function submitRequest() {
    if (!request) return;
    setRequest((current) => (current ? { ...current, status: "submitted" } : current));
    addAudit({
      action: "Submitted",
      actor: request.requester.name,
      role: "Requester",
      dateTime: "2026-05-18 09:30 AM",
      comment: "Work initiation request submitted.",
    });
  }

  function review(decision: WorkAuthorizationDecision) {
    if ((decision === "Return" || decision === "Deny") && !reviewComment.trim()) return;
    const nextStatus =
      decision === "Approve" ? "approved" : decision === "Return" ? "returned" : "denied";
    const result = {
      decision,
      reviewer: "Grace Bello",
      dateTime: "2026-05-18 10:15 AM",
      comment:
        reviewComment ||
        (decision === "Approve"
          ? "Work approved for assignment."
          : `Work initiation ${decision.toLowerCase()}ed.`),
    };
    setRequest((current) =>
      current
        ? {
            ...current,
            status: nextStatus,
            operationalReview: result,
          }
        : current,
    );
    addAudit({
      action: decision === "Approve" ? "Approved" : decision === "Return" ? "Returned" : "Denied",
      actor: result.reviewer,
      role: "Operations Reviewer",
      dateTime: result.dateTime,
      comment: result.comment,
    });
  }

  function assignWork() {
    setRequest((current) =>
      current
        ? {
            ...current,
            status: "assigned",
            assignment: {
              ...current.assignment,
              assignedWorkers,
              selectedContractors,
            },
          }
        : current,
    );
    addAudit({
      action: "Assigned",
      actor: "Mary James",
      role: "Supervisor",
      dateTime: "2026-05-18 10:45 AM",
      comment: assignmentComment || "Workers assigned. Ready for Work Authorization.",
    });
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => router.push("/work-initiation")}
        className="flex items-center gap-2 text-sm text-brand-text-secondary transition-colors hover:text-brand-text-primary"
      >
        <ArrowLeft size={14} />
        Back to Work Initiation
      </button>

      <WorkInitiationRoleSwitcher value={currentRole} onChange={setCurrentRole} />

      <section className="rounded-2xl border border-brand-border bg-white p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-text-secondary">
              Work Initiation
            </p>
            <h2 className="mt-1 text-xl font-semibold text-brand-text-primary">{request.id}</h2>
            <p className="mt-1 text-sm text-brand-text-secondary">{request.title}</p>
          </div>
          <ApprovalBadge status={request.status} />
        </div>
      </section>

      <StatusNote request={request} currentRole={currentRole} />
      <RequesterDetails request={request} />
      <WorkDetails request={request} editable={canRequesterEdit} />
      {/* <AssetDetails request={request} editable={canRequesterEdit} /> */}
      <AssignmentPlanning
        request={request}
        editable={canRequesterEdit || canAssign}
        assignedWorkers={assignedWorkers}
        onAssignedWorkersChange={setAssignedWorkers}
        selectedContractors={selectedContractors}
        onSelectedContractorsChange={setSelectedContractors}
      />

      {currentRole === "requester" && (request.status === "draft" || request.status === "returned") ? (
        <div className="flex justify-end">
          <Button type="button" onClick={submitRequest}>Submit Work Initiation</Button>
        </div>
      ) : null}

      {canReview ? (
        <FormSection title="Operational Review">
          <div className="grid gap-4 md:grid-cols-[minmax(220px,360px)_1fr] md:items-start">
            <DecisionSubmitControl
              onDecision={review}
              reasonMissing={!reviewComment.trim()}
              reasonMessage="Add a review comment before returning or denying this request."
            />
            <FormTextarea
              label="Review Comment"
              value={reviewComment}
              onChange={(event) => setReviewComment(event.target.value)}
              placeholder="Add operational review notes"
            />
          </div>
        </FormSection>
      ) : request.operationalReview ? (
        <ReviewResult request={request} />
      ) : null}

      {canAssign ? (
        <FormSection title="Assignment Confirmation">
          <FormTextarea
            label="Assignment Comment"
            value={assignmentComment}
            onChange={(event) => setAssignmentComment(event.target.value)}
            placeholder="Optional assignment note"
          />
          <div className="mt-4">
            <Button type="button" onClick={assignWork}>Confirm Assignment</Button>
          </div>
        </FormSection>
      ) : null}

      {request.status !== "draft" ? <AuditTrail items={request.auditTrail} /> : null}
    </div>
  );
}

function RequesterDetails({ request }: { request: WorkInitiationRequest }) {
  return (
    <FormSection title="Requester Details">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Requester Name" value={request.requester.name} disabled />
        <FormInput label="Department" value={request.requester.department} disabled />
        <FormInput label="Job Title / Role" value={request.requester.role} disabled />
        <FormDatePicker label="Request Date" value={request.requester.requestDate} disabled />
      </div>
    </FormSection>
  );
}

function WorkDetails({ request, editable }: { request: WorkInitiationRequest; editable: boolean }) {
  return (
    <FormSection title="Work Details">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Work Title" defaultValue={request.title} disabled={!editable} />
        <FormInput label="Work Type" defaultValue={request.workType} disabled={!editable} />
        <FormInput label="Priority" defaultValue={request.priority} disabled={!editable} />
        <FormMultiSelect
          label="Location"
          defaultValue={request.location ? [request.location] : []}
          disabled={!editable}
          searchable
          creatable
          options={locationOptions}
          placeholder="Select or add location"
        />
        <FormInput label="Exact Work Area" defaultValue={request.exactWorkArea} disabled={!editable} />
        <FormTextarea label="Work Description" defaultValue={request.workDescription} disabled={!editable} />
        <FormTextarea label="Reason for Work" defaultValue={request.reasonForWork} disabled={!editable} />
      </div>
      <div className="mt-4">
        <AttachmentList attachments={request.attachments} />
      </div>
    </FormSection>
  );
}

// function AssetDetails({ request, editable }: { request: WorkInitiationRequest; editable: boolean }) {
//   const details = request.assetDetails;
//   return (
//     <FormSection title="Asset / Vehicle / Equipment Details">
//       <div className="grid gap-4 md:grid-cols-2">
//         <FormToggleGroup label="Asset/Vehicle/Equipment Involved?" options={yesNoOptions} value={details.assetInvolved ? "Yes" : "No"} disabled={!editable} />
//         {details.assetInvolved ? (
//           <>
//             <FormInput label="Asset Type" defaultValue={details.assetType} disabled={!editable} />
//             <FormInput label="Asset Reference / ID" defaultValue={details.assetReference} disabled={!editable} />
//             {details.assetType === "Vehicle" ? <FormInput label="Vehicle Plate Number" defaultValue={details.vehiclePlateNumber} disabled={!editable} /> : null}
//             <FormInput label="VIN / Chassis Number" defaultValue={details.vin} disabled={!editable} />
//             <FormInput label="Client / Company" defaultValue={details.clientCompany} disabled={!editable} />
//           </>
//         ) : null}
//       </div>
//     </FormSection>
//   );
// }

function AssignmentPlanning({
  request,
  editable,
  assignedWorkers,
  onAssignedWorkersChange,
  selectedContractors,
  onSelectedContractorsChange,
}: {
  request: WorkInitiationRequest;
  editable: boolean;
  assignedWorkers: string[];
  onAssignedWorkersChange: (value: string[]) => void;
  selectedContractors: string[];
  onSelectedContractorsChange: (value: string[]) => void;
}) {
  const assignment = request.assignment;
  return (
    <FormSection title="Assignment & Planning">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Assigned Department / Team" defaultValue={assignment.assignedDepartment} disabled={!editable} />
        <FormInput label="Assigned Supervisor" defaultValue={assignment.assignedSupervisor} disabled={!editable} />
        <FormMultiSelect label="Assigned Workers" options={employeeOptions} value={assignedWorkers} onValueChange={onAssignedWorkersChange} disabled={!editable} />
        <FormToggleGroup label="Contractors Needed?" options={yesNoOptions} value={assignment.contractorsNeeded ? "Yes" : "No"} disabled={!editable} />
        {assignment.contractorsNeeded ? (
          <FormMultiSelect label="Selected Contractors" options={contractorOptions} value={selectedContractors} onValueChange={onSelectedContractorsChange} disabled={!editable} />
        ) : null}
        <FormInput label="Planned Start Date/Time" defaultValue={assignment.plannedStartDateTime} disabled={!editable} />
        <FormInput label="Planned End Date/Time" defaultValue={assignment.plannedEndDateTime} disabled={!editable} />
        <FormTextarea label="Materials / Parts Required" defaultValue={assignment.materialsRequired} disabled={!editable} className="md:col-span-2" />
      </div>
    </FormSection>
  );
}

function DecisionSubmitControl({
  onDecision,
  reasonMissing,
  reasonMessage,
}: {
  onDecision: (decision: WorkAuthorizationDecision) => void;
  reasonMissing: boolean;
  reasonMessage: string;
}) {
  const [decision, setDecision] = useState("");
  const selectedDecision = decision as WorkAuthorizationDecision;
  const needsReason = (selectedDecision === "Return" || selectedDecision === "Deny") && reasonMissing;
  return (
    <div className="space-y-3">
      <FormSelect label="Review Decision" options={decisionOptions} placeholder="Select decision" value={decision} onValueChange={setDecision} />
      {needsReason ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{reasonMessage}</p> : null}
      <Button type="button" disabled={!decision || needsReason} variant={selectedDecision === "Deny" ? "danger" : "primary"} onClick={() => onDecision(selectedDecision)}>
        Submit
      </Button>
    </div>
  );
}

function ReviewResult({ request }: { request: WorkInitiationRequest }) {
  const review = request.operationalReview;
  if (!review) return null;
  return (
    <FormSection title="Operational Review Result">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Reviewer" value={review.reviewer} disabled />
        <FormInput label="Review Decision" value={review.decision} disabled />
        <FormInput label="Review Date/Time" value={review.dateTime} disabled />
        <FormTextarea label="Review Comment" value={review.comment} disabled />
      </div>
    </FormSection>
  );
}

function AttachmentList({ attachments }: { attachments: WorkAuthorizationAttachment[] }) {
  if (attachments.length === 0) return <p className="text-sm text-brand-text-secondary">No attachments.</p>;
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
    </FormSection>
  );
}

function StatusNote({ request, currentRole }: { request: WorkInitiationRequest; currentRole: WorkInitiationRole }) {
  let note = "";
  if (request.status === "submitted") note = currentRole === "operations_reviewer" ? "This request is waiting for your operational review." : "Waiting for operational review.";
  if (request.status === "approved") note = currentRole === "supervisor" ? "Work approved. Confirm assigned workers/contractors to make it eligible for Work Authorization." : "Work approved and waiting for assignment.";
  if (request.status === "assigned") note = "Work assigned. This request is eligible for Work Authorization.";
  if (request.status === "returned") note = currentRole === "requester" ? "This request was returned. Update and resubmit." : "This request was returned to the requester.";
  if (request.status === "denied") note = "This work initiation request has been denied and closed.";
  if (!note) return null;
  return <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{note}</div>;
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-visible rounded-2xl border border-brand-border bg-white">
      <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-5 py-4 md:px-6">
        <h3 className="text-base font-semibold text-brand-text-primary">{title}</h3>
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

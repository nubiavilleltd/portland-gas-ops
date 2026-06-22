"use client";

import { useState } from "react";
import { ArrowLeft, FileText, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import ApprovalPanel from "@/components/ui/ApprovalPanel";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import Button from "@/components/ui/Button";
import FormInput from "@/components/forms/FormInput";
import FormMultiSelect from "@/components/forms/FormMultiSelect";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import AuditTrail from "@/components/forms/AuditTrail";
import RoleBasedRecordHeader from "@/components/ui/RoleBasedRecordHeader";
import { useToast } from "@/hooks/useToast";
import {
  contractorContactEmailByName,
  getMockWorkInitiationRequest,
  workCategoryOptions,
  workTypeOptionsByCategory,
} from "@/lib/mock/work-initiation";
import { updateWorkInitiation, useSafetyDemoData } from "@/lib/safety-demo-store";
import { getWorkInitiationNextActor } from "@/lib/safety-next-actor";
import {
  formatSafetyDisplayDate,
  formatSafetyDisplayDateTime,
} from "@/lib/safety-demo-dates";
import type {
  WorkAuthorizationAuditTrailItem,
  WorkAuthorizationAttachment,
  WorkAuthorizationDecision,
  WorkInitiationRequest,
  WorkInitiationRole,
} from "@/types/safety";

const toOptions = (items: string[]) => items.map((item) => ({ value: item, label: item }));
const categoryOptions = toOptions(workCategoryOptions);
const employeeOptions = toOptions(["Mary James", "Felix Ohemu", "Samuel Bassey", "Grace Bello"]);
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
const workInitiationRoles: { value: WorkInitiationRole; label: string }[] = [
  { value: "requester", label: "Requester" },
  { value: "supervisor", label: "Supervisor" },
  { value: "operations_hod", label: "Operations HOD" },
];

export default function WorkInitiationDetailsView({
  requestId,
  initialRole,
}: {
  requestId: string;
  initialRole?: WorkInitiationRole;
}) {
  const router = useRouter();
  const toast = useToast();
  const initialRequest = getMockWorkInitiationRequest(requestId);
  const { incidentHazards, workInitiations } = useSafetyDemoData();
  const request = workInitiations.find((item) => item.id === requestId) ?? initialRequest;
  const incidentHazardRequestOptions = incidentHazards
    .filter((report) => report.status === "recommended")
    .map((report) => ({
      value: report.id,
      label: `${report.id} - ${report.title || report.reportType}`,
      description: `${report.reporter.name} | ${formatSafetyDisplayDate(report.reporter.reportDate)}`,
    }));
  const [currentRole, setCurrentRole] = useState<WorkInitiationRole>(
    initialRole ?? "requester",
  );
  const [supervisorComment, setSupervisorComment] = useState("");
  const [operationsHodComment, setOperationsHodComment] = useState("");
  const [assignedWorkers, setAssignedWorkers] = useState<string[]>(
    initialRequest?.assignment.assignedWorkers ?? [],
  );
  const [selectedContractor, setSelectedContractor] = useState(
    initialRequest?.assignment.selectedContractor ?? "",
  );

  if (!request) {
    return (
      <div className="rounded-2xl border border-brand-border bg-white p-6">
        <p className="text-sm text-brand-text-secondary">Work initiation request not found.</p>
      </div>
    );
  }
  const persistedRequestId = request.id;

  const canRequesterEdit =
    currentRole === "requester" && (request.status === "draft" || request.status === "returned");
  const canSupervisorReview = currentRole === "supervisor" && request.status === "submitted";
  const canOperationsHodReview =
    currentRole === "operations_hod" && request.status === "pending";

  function persistUpdate(
    update: (current: WorkInitiationRequest) => WorkInitiationRequest,
  ) {
    updateWorkInitiation(persistedRequestId, update);
  }

  function submitRequest() {
    if (!request) return;
    const audit: WorkAuthorizationAuditTrailItem = {
      action: "Submitted",
      actor: request.requester.name,
      role: "Requester",
      dateTime: "2026-05-18 09:30 AM",
      comment: "Work initiation request submitted.",
    };
    persistUpdate((current) => ({
      ...current,
      status: "submitted",
      auditTrail: [...current.auditTrail, audit],
    }));
    toast.success("Work initiation submitted.");
  }

  function supervisorReview(decision: WorkAuthorizationDecision) {
    if (!request) return;
    if ((decision === "Return" || decision === "Deny") && !supervisorComment.trim()) return;
    const nextStatus =
      decision === "Approve" ? "pending" : decision === "Return" ? "returned" : "denied";
    const result = {
      decision,
      approver: request.assignment.assignedSupervisor || "Mary James",
      dateTime: "2026-05-18 10:15 AM",
      comment:
        supervisorComment ||
        (decision === "Approve"
          ? "Work details reviewed and recommended to Operations HOD."
          : `Work initiation ${decision.toLowerCase()}ed.`),
    };
    const audit: WorkAuthorizationAuditTrailItem = {
      action: decision === "Approve" ? "Supervisor Approved" : `Supervisor ${decision}ed`,
      actor: result.approver,
      role: "Supervisor",
      dateTime: result.dateTime,
      comment: result.comment,
    };
    persistUpdate((current) => ({
      ...current,
      status: nextStatus,
      supervisorApproval: result,
      auditTrail: [...current.auditTrail, audit],
    }));
    showDecisionToast(toast, "Work initiation", decision, "Supervisor");
  }

  function operationsHodReview(decision: WorkAuthorizationDecision) {
    if ((decision === "Return" || decision === "Deny") && !operationsHodComment.trim()) return;
    const nextStatus =
      decision === "Approve" ? "approved" : decision === "Return" ? "returned" : "denied";
    const result = {
      decision,
      reviewer: "Grace Bello",
      dateTime: "2026-05-18 10:45 AM",
      comment:
        operationsHodComment ||
        (decision === "Approve"
          ? "Work approved by Operations HOD. Assignment confirmed for Work Authorization."
          : `Work initiation ${decision.toLowerCase()}ed by Operations HOD.`),
    };
    const audit: WorkAuthorizationAuditTrailItem = {
      action:
        decision === "Approve"
          ? "Operations HOD Approved"
          : `Operations HOD ${decision}ed`,
      actor: result.reviewer,
      role: "Operations HOD",
      dateTime: "2026-05-18 10:45 AM",
      comment: result.comment,
    };
    persistUpdate((current) => ({
      ...current,
      status: nextStatus,
      operationalReview: result,
      auditTrail: [...current.auditTrail, audit],
    }));
    showDecisionToast(toast, "Work initiation", decision, "Operations HOD");
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => router.push("/safety/work-initiation")}
        className="flex items-center gap-2 text-sm text-brand-text-secondary transition-colors hover:text-brand-text-primary"
      >
        <ArrowLeft size={14} />
        Back to Work Initiation
      </button>

      <RoleBasedRecordHeader
        id={request.id}
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        roleLabel={getWorkInitiationRoleLabel(currentRole)}
        roles={workInitiationRoles}
        recordLabel="Work Initiation"
        title={request.title}
        status={<ApprovalBadge status={request.status} />}
        nextActor={getWorkInitiationNextActor(request)}
        switcherDescription="Switch roles to preview requester, supervisor, and Operations HOD views."
      />

      <StatusNote request={request} currentRole={currentRole} />
      <RequesterDetails request={request} />
      <WorkDetails
        request={request}
        editable={canRequesterEdit}
        incidentHazardRequestOptions={incidentHazardRequestOptions}
      />
      {/* <AssetDetails request={request} editable={canRequesterEdit} /> */}
      <AssignmentPlanning
        request={request}
        editable={canRequesterEdit}
        assignedWorkers={assignedWorkers}
        onAssignedWorkersChange={setAssignedWorkers}
        selectedContractor={selectedContractor}
        onSelectedContractorChange={setSelectedContractor}
      />

      {currentRole === "requester" && (request.status === "draft" || request.status === "returned") ? (
        <div className="flex justify-end">
          <Button type="button" onClick={submitRequest}>Submit Work Initiation</Button>
        </div>
      ) : null}

      {canSupervisorReview ? (
        <ApprovalPanel
          title="Supervisor Review"
          description="Review the requested work before it proceeds to Operations HOD."
          commentLabel="Supervisor Comment"
          commentPlaceholder="Add supervisor review notes"
          commentValue={supervisorComment}
          onCommentChange={setSupervisorComment}
          onApprove={() => supervisorReview("Approve")}
          onReturn={() => supervisorReview("Return")}
          onReject={() => supervisorReview("Deny")}
          rejectLabel="Deny"
          returnDisabled={!supervisorComment.trim()}
          rejectDisabled={!supervisorComment.trim()}
          extraFields={
            !supervisorComment.trim() ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Add a supervisor comment before returning or denying this request.
              </p>
            ) : null
          }
        />
      ) : request.supervisorApproval ? (
        <ApprovalResult
          title="Supervisor Review Result"
          approver={request.supervisorApproval.approver}
          decision={request.supervisorApproval.decision}
          dateTime={request.supervisorApproval.dateTime}
          comment={request.supervisorApproval.comment}
        />
      ) : null}

      {canOperationsHodReview ? (
        <ApprovalPanel
          title="Operations HOD Review"
          description="Record the operational approval decision for this work."
          commentLabel="Operations HOD Comment"
          commentPlaceholder="Add operational approval notes"
          commentValue={operationsHodComment}
          onCommentChange={setOperationsHodComment}
          onApprove={() => operationsHodReview("Approve")}
          onReturn={() => operationsHodReview("Return")}
          onReject={() => operationsHodReview("Deny")}
          rejectLabel="Deny"
          returnDisabled={!operationsHodComment.trim()}
          rejectDisabled={!operationsHodComment.trim()}
          extraFields={
            !operationsHodComment.trim() ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Add an Operations HOD comment before returning or denying this request.
              </p>
            ) : null
          }
        />
      ) : request.operationalReview ? (
        <ReviewResult request={request} />
      ) : null}

      {request.status !== "draft" ? (
        <AuditTrail
          items={request.auditTrail}
          formatDateTime={formatSafetyDisplayDateTime}
        />
      ) : null}
    </div>
  );
}

function RequesterDetails({ request }: { request: WorkInitiationRequest }) {
  return (
    <FormSection title="Requester Details" description="Employee information for the person who initiated this work.">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Requester Name" value={request.requester.name} disabled />
        <FormInput label="Department" value={request.requester.department} disabled />
        <FormInput label="Job Title / Role" value={request.requester.role} disabled />
        <FormInput label="Request Date" value={formatSafetyDisplayDate(request.requester.requestDate)} disabled />
      </div>
    </FormSection>
  );
}

function WorkDetails({
  request,
  editable,
  incidentHazardRequestOptions,
}: {
  request: WorkInitiationRequest;
  editable: boolean;
  incidentHazardRequestOptions: { value: string; label: string }[];
}) {
  const [workCategory, setWorkCategory] = useState(request.workCategory);
  const [workTypes, setWorkTypes] = useState<string[]>(request.workType);
  const workTypeOptions = toOptions(
    workCategory ? workTypeOptionsByCategory[workCategory] ?? [] : [],
  );

  function handleWorkCategoryChange(nextCategory: string) {
    setWorkCategory(nextCategory);
    setWorkTypes([]);
  }

  return (
    <FormSection title="Work Details" description="Requested work scope, purpose, location, and supporting evidence.">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Work Title" defaultValue={request.title} disabled={!editable} />
        {editable ? (
          <FormSelect
            label="Work Category"
            options={categoryOptions}
            value={workCategory}
            onValueChange={handleWorkCategoryChange}
            placeholder="Select work category"
          />
        ) : (
          <FormInput label="Work Category" value={request.workCategory} disabled />
        )}
        {workCategory === "Incident/Hazard" ? (
          editable ? (
            <FormSelect
              label="Related Incident/Hazard Request"
              searchable
              options={incidentHazardRequestOptions}
              defaultValue={request.relatedIncidentHazardId}
              placeholder="Select related incident or hazard"
              dropdownClassName="md:min-w-[34rem]"
            />
          ) : (
            <FormInput
              label="Related Incident/Hazard Request"
              value={request.relatedIncidentHazardId}
              disabled
            />
          )
        ) : null}
        {editable ? (
          <FormMultiSelect
            label="Work Type"
            searchable
            creatable
            options={workTypeOptions}
            value={workTypes}
            onValueChange={setWorkTypes}
            placeholder={workCategory ? "Select or add work type" : "Select work category first"}
            disabled={!workCategory}
          />
        ) : (
          <FormInput label="Work Type" value={request.workType.join(", ")} disabled />
        )}
        <FormMultiSelect
          label="Location"
          defaultValue={request.location ? [request.location] : []}
          disabled={!editable}
          searchable
          creatable
          options={locationOptions}
          placeholder="Select or add location"
        />
        <FormTextarea label="Exact Work Area" minLength={5} defaultValue={request.exactWorkArea} disabled={!editable} />
        <FormTextarea label="Work Description" minLength={5} defaultValue={request.workDescription} disabled={!editable} />
        <FormTextarea label="Reason for Work" minLength={5} defaultValue={request.reasonForWork} disabled={!editable} />
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
  selectedContractor,
  onSelectedContractorChange,
}: {
  request: WorkInitiationRequest;
  editable: boolean;
  assignedWorkers: string[];
  onAssignedWorkersChange: (value: string[]) => void;
  selectedContractor: string;
  onSelectedContractorChange: (value: string) => void;
}) {
  const assignment = request.assignment;
  return (
    <FormSection title="Assignment & Planning" description="Assigned team, workers, contractor, and planned schedule.">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Assigned Department / Team" defaultValue={assignment.assignedDepartment} disabled={!editable} />
        <FormInput label="Assigned Supervisor" defaultValue={assignment.assignedSupervisor} disabled={!editable} />
        <FormMultiSelect label="Assigned Workers" options={employeeOptions} value={assignedWorkers} onValueChange={onAssignedWorkersChange} disabled={!editable} />
        <FormSelect label="Contractors Needed?" options={yesNoOptions} value={assignment.contractorsNeeded ? "Yes" : "No"} onValueChange={() => undefined} disabled={!editable} />
        {assignment.contractorsNeeded ? (
          <>
            <FormSelect
              label="Selected Contractor"
              options={contractorOptions}
              value={selectedContractor}
              onValueChange={onSelectedContractorChange}
              searchable
              creatable
              placeholder="Select contractor"
              disabled={!editable}
            />
            <FormInput
              label="Contractor Contact Email"
              type="email"
              value={contractorContactEmailByName[selectedContractor] ?? assignment.contractorContactEmail}
              disabled
            />
          </>
        ) : null}
        <FormInput label="Planned Start Date/Time" defaultValue={formatSafetyDisplayDateTime(assignment.plannedStartDateTime)} disabled={!editable} />
        <FormInput label="Planned End Date/Time" defaultValue={formatSafetyDisplayDateTime(assignment.plannedEndDateTime)} disabled={!editable} />
        <FormTextarea label="Materials / Parts Required" minLength={5} defaultValue={assignment.materialsRequired} disabled={!editable} className="md:col-span-2" />
      </div>
    </FormSection>
  );
}

function ReviewResult({ request }: { request: WorkInitiationRequest }) {
  const review = request.operationalReview;
  if (!review) return null;
  return (
    <FormSection title="Operations HOD Review Result" description="Recorded Operations HOD decision and comments.">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Reviewer" value={review.reviewer} disabled />
        <FormInput label="Review Decision" value={review.decision} disabled />
        <FormInput label="Review Date/Time" value={formatSafetyDisplayDateTime(review.dateTime)} disabled />
        <FormTextarea label="Review Comment" minLength={5} value={review.comment} disabled />
      </div>
    </FormSection>
  );
}

function ApprovalResult({
  title,
  approver,
  decision,
  dateTime,
  comment,
}: {
  title: string;
  approver: string;
  decision: WorkAuthorizationDecision;
  dateTime: string;
  comment: string;
}) {
  return (
    <FormSection title={title} description="Recorded supervisor decision and comments for this work request.">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Approver" value={approver} disabled />
        <FormInput label="Decision" value={decision} disabled />
        <FormInput label="Review Date/Time" value={formatSafetyDisplayDateTime(dateTime)} disabled />
        <FormTextarea label="Comment" minLength={5} value={comment} disabled />
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

function StatusNote({ request, currentRole }: { request: WorkInitiationRequest; currentRole: WorkInitiationRole }) {
  let note = "";
  if (request.status === "submitted") note = currentRole === "supervisor" ? "This request is waiting for your supervisor review." : "Waiting for supervisor approval.";
  if (request.status === "pending") note = currentRole === "operations_hod" ? "Supervisor approved. This request is waiting for your Operations HOD review." : "Supervisor approved. Waiting for Operations HOD approval.";
  if (request.status === "approved") note = "Work approved by Operations HOD. Its assigned team is eligible for Work Authorization.";
  if (request.status === "returned") note = currentRole === "requester" ? "This request was returned. Update and resubmit." : "This request was returned to the requester.";
  if (request.status === "denied") note = "This work initiation request has been denied and closed.";
  if (!note) return null;
  return <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{note}</div>;
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

function getWorkInitiationRoleLabel(role: WorkInitiationRole) {
  if (role === "operations_hod") return "Operations HOD";
  if (role === "supervisor") return "Supervisor";
  return "Requester";
}

function showDecisionToast(
  toast: ReturnType<typeof useToast>,
  recordLabel: string,
  decision: WorkAuthorizationDecision,
  actorLabel: string,
) {
  if (decision === "Approve") {
    toast.success(`${recordLabel} approved by ${actorLabel}.`);
  } else if (decision === "Return") {
    toast.info(`${recordLabel} returned to requester.`);
  } else {
    toast.error(`${recordLabel} denied by ${actorLabel}.`);
  }
}
